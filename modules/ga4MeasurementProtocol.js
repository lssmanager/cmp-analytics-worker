/**
 * ga4MeasurementProtocol.js - Direct Google Analytics 4 Measurement Protocol
 *
 * Implementación del GA4 Measurement Protocol API
 * Envía eventos directamente a: https://www.google-analytics.com/mp/collect
 *
 * Documentación: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

import { buildGA4EventPayload, isValidGA4Payload, normalizeGA4Item } from "./ga4StandardEvents.js"

/**
 * Enviar evento directamente a GA4 Measurement Protocol
 *
 * @param {Object} env - Cloudflare env (contiene GA4_MEASUREMENT_ID y GA4_API_SECRET)
 * @param {Object} event - Evento normalizado
 * @param {string} region - Región geográfica (eu, us, ca, global)
 * @returns {Promise<Object>} { success: boolean, status: number, error?: string }
 */
export async function sendToGA4MeasurementProtocol(env, event, region = "global") {
  // Validar configuración
  if (!env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) {
    return {
      success: false,
      status: 400,
      error: "GA4_MEASUREMENT_ID or GA4_API_SECRET not configured"
    }
  }

  // EU compliance: No enviar direct a GA4 sin consentimiento explícito
  if ((region === "eu" || region === "ca") && !shouldSendToGA4DirectForRegion(region)) {
    return {
      success: false,
      status: 403,
      error: "Cannot send direct to GA4 in EU without explicit consent"
    }
  }

  try {
    // Construir payload GA4
    const ga4Payload = buildGA4EventPayload(event)

    // Validar payload
    if (!isValidGA4Payload(ga4Payload)) {
      return {
        success: false,
        status: 400,
        error: "Invalid GA4 payload structure"
      }
    }

    // Enviar a GA4 Measurement Protocol API
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ga4Payload),
        timeout: 10000 // 10 segundos timeout
      }
    )

    // GA4 retorna 204 No Content en éxito
    if (response.status === 204) {
      return { success: true, status: 204 }
    }

    // Otros status
    if (response.ok) {
      return { success: true, status: response.status }
    }

    // Error
    const errorText = await response.text()
    return {
      success: false,
      status: response.status,
      error: errorText || `GA4 API returned ${response.status}`
    }
  } catch (err) {
    return {
      success: false,
      status: 500,
      error: `GA4 API error: ${err.message}`
    }
  }
}

/**
 * Enviar evento de Purchase (Ecommerce) a GA4
 * Requiere estructura especial con items
 *
 * @param {Object} env - Cloudflare env
 * @param {Object} transaction - Datos de transacción
 * @param {Array} items - Array de items comprados
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendPurchaseEventToGA4(env, transaction, items = []) {
  if (!env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) {
    return { success: false, error: "GA4 not configured" }
  }

  // Normalizar items
  const normalizedItems = Array.isArray(items)
    ? items.map(normalizeGA4Item)
    : [normalizeGA4Item(items)]

  // Construir payload completo
  const payload = {
    client_id: transaction.sessionId || `session_${Date.now()}`,
    user_id: transaction.userId || undefined,
    timestamp_micros: (transaction.timestamp || Date.now()) * 1000,
    events: [{
      name: "purchase",
      params: {
        transaction_id: transaction.transaction_id || transaction.orderId || "",
        affiliation: transaction.affiliation || "",
        value: parseFloat(transaction.value || 0),
        tax: parseFloat(transaction.tax || 0),
        shipping: parseFloat(transaction.shipping || 0),
        currency: transaction.currency || "USD",
        coupon: transaction.coupon || "",
        items: normalizedItems,
        engagement_time_msec: 100
      }
    }]
  }

  if (!isValidGA4Payload(payload)) {
    return { success: false, error: "Invalid purchase payload" }
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        timeout: 10000
      }
    )

    return {
      success: response.status === 204 || response.ok,
      status: response.status
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Batch envio de múltiples eventos a GA4
 * Agrupa eventos en batches para eficiencia
 *
 * @param {Object} env - Cloudflare env
 * @param {Array} events - Array de eventos a enviar
 * @param {string} region - Región geográfica
 * @returns {Promise<Object>} { success: boolean, sent: number, failed: number }
 */
export async function batchSendToGA4(env, events = [], region = "global") {
  if (!Array.isArray(events) || events.length === 0) {
    return { success: true, sent: 0, failed: 0 }
  }

  const batchSize = 25 // GA4 permite máx 25 eventos por request
  let sent = 0
  let failed = 0

  // Procesar en batches
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize)

    // Construir payload con múltiples eventos
    const batchPayload = {
      client_id: batch[0]?.sessionId || `batch_${Date.now()}`,
      events: batch.map(event => ({
        name: event.type,
        params: {
          engagement_time_msec: 100,
          session_id: event.sessionId,
          page_location: event.page,
          ...event.properties
        }
      }))
    }

    try {
      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchPayload),
          timeout: 10000
        }
      )

      if (response.status === 204 || response.ok) {
        sent += batch.length
      } else {
        failed += batch.length
      }
    } catch (err) {
      failed += batch.length
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    total: events.length
  }
}

/**
 * Determinar si se puede enviar directamente a GA4 según región
 * EU y CA requieren consentimiento explícito
 *
 * @param {string} region - Región (eu, us, ca, global)
 * @returns {boolean} Permitido enviar a GA4
 */
function shouldSendToGA4DirectForRegion(region) {
  // Aquí se validaría contra consentimiento real
  // Por ahora, retornar false para EU/CA por seguridad
  if (region === "eu" || region === "ca") {
    return false // Requerir consentimiento explícito
  }
  return true // US y global pueden enviar
}

/**
 * Debug: Validar conexión a GA4
 * Envía un evento de prueba para verificar que GA4 esté configurado correctamente
 *
 * @param {Object} env - Cloudflare env
 * @returns {Promise<Object>} Status de la validación
 */
export async function validateGA4Configuration(env) {
  if (!env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) {
    return {
      status: "error",
      message: "GA4_MEASUREMENT_ID or GA4_API_SECRET not configured"
    }
  }

  const testPayload = {
    client_id: `test_${Date.now()}`,
    events: [{
      name: "test_event",
      params: {
        test_flag: true,
        engagement_time_msec: 100
      }
    }]
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
        timeout: 5000
      }
    )

    return {
      status: response.ok || response.status === 204 ? "success" : "failed",
      http_status: response.status,
      measurement_id: env.GA4_MEASUREMENT_ID?.substring(0, 5) + "***" // Ocultar secreto
    }
  } catch (err) {
    return {
      status: "error",
      message: err.message
    }
  }
}
