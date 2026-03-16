/**
 * ga4StandardEvents.js - GA4 Standard Events & Properties Mapping
 *
 * Centraliza la lógica de eventos estándar de Google Analytics 4
 * Mapea eventos custom a GA4 estándares y valida estructura
 */

/**
 * Mapeo de eventos custom a GA4 estándares
 * Key: Nombre custom del evento
 * Value: { ga4Name, category, isStandard }
 */
export const EVENT_TO_GA4_MAPPING = {
  // User Lifecycle
  "login": { ga4Name: "login", category: "user_lifecycle", isStandard: true },
  "sign_up": { ga4Name: "sign_up", category: "user_lifecycle", isStandard: true },
  "first_visit": { ga4Name: "first_visit", category: "engagement", isStandard: true },

  // Ecommerce
  "view_item": { ga4Name: "view_item", category: "ecommerce", isStandard: true },
  "view_item_list": { ga4Name: "view_item_list", category: "ecommerce", isStandard: true },
  "view_cart": { ga4Name: "view_cart", category: "ecommerce", isStandard: true },
  "add_to_cart": { ga4Name: "add_to_cart", category: "ecommerce", isStandard: true },
  "remove_from_cart": { ga4Name: "remove_from_cart", category: "ecommerce", isStandard: true },
  "begin_checkout": { ga4Name: "begin_checkout", category: "ecommerce", isStandard: true },
  "add_shipping_info": { ga4Name: "add_shipping_info", category: "ecommerce", isStandard: true },
  "add_payment_info": { ga4Name: "add_payment_info", category: "ecommerce", isStandard: true },
  "purchase": { ga4Name: "purchase", category: "ecommerce", isStandard: true },
  "refund": { ga4Name: "refund", category: "ecommerce", isStandard: true },
  "select_item": { ga4Name: "select_item", category: "ecommerce", isStandard: true },
  "select_promotion": { ga4Name: "select_promotion", category: "ecommerce", isStandard: true },
  "view_promotion": { ga4Name: "view_promotion", category: "ecommerce", isStandard: true },

  // Engagement
  "page_view": { ga4Name: "page_view", category: "engagement", isStandard: true },
  "scroll": { ga4Name: "scroll", category: "engagement", isStandard: true },
  "click": { ga4Name: "click", category: "engagement", isStandard: true },
  "file_download": { ga4Name: "file_download", category: "engagement", isStandard: true },
  "search": { ga4Name: "search", category: "search", isStandard: true },
  "view_search_results": { ga4Name: "view_search_results", category: "search", isStandard: true },

  // Video
  "video_start": { ga4Name: "video_start", category: "video", isStandard: true },
  "video_progress": { ga4Name: "video_progress", category: "video", isStandard: true },
  "video_complete": { ga4Name: "video_complete", category: "video", isStandard: true },

  // Forms (mapped to GA4 standard)
  "form_submit": { ga4Name: "form_submit", category: "forms", isStandard: true },
  "form_start": { ga4Name: "form_start", category: "forms", isStandard: false },
  "form_abandon": { ga4Name: "form_abandon", category: "forms", isStandard: false },

  // Learning (custom)
  "course_enrollment": { ga4Name: "course_enrollment", category: "learning", isStandard: false },
  "course_unenroll": { ga4Name: "course_unenroll", category: "learning", isStandard: false },
  "quiz_complete": { ga4Name: "quiz_complete", category: "learning", isStandard: false },
  "assignment_submit": { ga4Name: "assignment_submit", category: "learning", isStandard: false },
  "lesson_complete": { ga4Name: "lesson_complete", category: "learning", isStandard: false },

  // Moodle Advanced Analytics (custom)
  "moodle_cognitive_presence": { ga4Name: "moodle_cognitive_presence", category: "learning_analytics", isStandard: false },
  "moodle_social_presence": { ga4Name: "moodle_social_presence", category: "learning_analytics", isStandard: false },
  "moodle_teaching_presence": { ga4Name: "moodle_teaching_presence", category: "learning_analytics", isStandard: false },
  "moodle_engagement_risk": { ga4Name: "moodle_engagement_risk", category: "predictive_analytics", isStandard: false },
  "moodle_performance_risk": { ga4Name: "moodle_performance_risk", category: "predictive_analytics", isStandard: false },
  "moodle_behavior_risk": { ga4Name: "moodle_behavior_risk", category: "predictive_analytics", isStandard: false },

  // BuddyBoss Social (custom)
  "buddyboss_profile_viewed": { ga4Name: "buddyboss_profile_viewed", category: "social", isStandard: false },
  "buddyboss_profile_updated": { ga4Name: "buddyboss_profile_updated", category: "social", isStandard: false },
  "buddyboss_group_joined": { ga4Name: "buddyboss_group_joined", category: "social", isStandard: false },
  "buddyboss_group_left": { ga4Name: "buddyboss_group_left", category: "social", isStandard: false },
  "buddyboss_group_post_created": { ga4Name: "buddyboss_group_post_created", category: "social", isStandard: false },
  "buddyboss_activity_posted": { ga4Name: "buddyboss_activity_posted", category: "social", isStandard: false },
  "buddyboss_activity_reacted": { ga4Name: "buddyboss_activity_reacted", category: "social", isStandard: false },
  "buddyboss_activity_commented": { ga4Name: "buddyboss_activity_commented", category: "social", isStandard: false },
  "buddyboss_message_sent": { ga4Name: "buddyboss_message_sent", category: "social", isStandard: false },
  "buddyboss_connection_requested": { ga4Name: "buddyboss_connection_requested", category: "social", isStandard: false },
  "buddyboss_connection_accepted": { ga4Name: "buddyboss_connection_accepted", category: "social", isStandard: false },
  "buddyboss_profile_completion": { ga4Name: "buddyboss_profile_completion", category: "social", isStandard: false }
}

/**
 * Obtener el nombre GA4 de un evento custom
 * @param {string} eventName - Nombre custom del evento
 * @returns {string} Nombre GA4 estándar
 */
export function toGA4EventName(eventName) {
  const mapping = EVENT_TO_GA4_MAPPING[eventName]
  return mapping ? mapping.ga4Name : eventName
}

/**
 * Obtener la categoría de un evento
 * @param {string} eventName - Nombre custom del evento
 * @returns {string} Categoría del evento
 */
export function getEventCategory(eventName) {
  const mapping = EVENT_TO_GA4_MAPPING[eventName]
  return mapping ? mapping.category : "custom"
}

/**
 * Construir payload GA4 para un evento
 * Asegura que todos los parámetros requeridos están presentes
 *
 * @param {Object} event - Evento normalizado
 * @param {Object} userProperties - Propiedades de usuario GA4
 * @param {Object} sessionProperties - Propiedades de sesión GA4
 * @returns {Object} Payload GA4 válido
 */
export function buildGA4EventPayload(event, userProperties = {}, sessionProperties = {}) {
  const ga4EventName = toGA4EventName(event.type)

  // Timestamp en microsegundos (GA4 requiere)
  const timestamp_micros = typeof event.timestamp === "number"
    ? (event.timestamp > 1e10 ? event.timestamp * 1000 : event.timestamp * 1e6)
    : Date.now() * 1000

  // Payload GA4 válido
  const payload = {
    client_id: event.sessionId || `client_${Date.now()}`,
    user_id: event.userId || undefined, // GA4: user_id es opcional pero importante
    timestamp_micros,
    user_properties: {
      user_language: { value: event.userLanguage || userProperties.user_language || "en" },
      user_country: { value: event.userCountry || userProperties.user_country || "unknown" },
      user_segment: { value: event.userSegment || userProperties.user_segment || "visitor" },
      subscription_status: { value: userProperties.subscription_status || "free" }
    },
    events: [{
      name: ga4EventName,
      params: {
        // GA4 Required Parameters
        engagement_time_msec: Math.max(100, event.engagementTime || 1000),
        session_id: event.sessionId,

        // Page context (GA4 standard)
        page_location: event.page || event.pageLocation,
        page_title: event.pageTitle || event.title || document?.title || "",
        page_referrer: event.referrer || "",

        // Event-specific properties
        ...event.properties
      }
    }]
  }

  // Agregar user_id si existe (GA4 lo requiere para user-level reporting)
  if (event.userId) {
    payload.user_id = event.userId
  }

  return payload
}

/**
 * Mapear item fields a GA4 standard
 * GA4 requiere item_id, item_name, y opcionalmente: categoria, brand, variant, precio, etc.
 *
 * @param {Object} customItem - Item con campos custom
 * @returns {Object} Item con campos GA4 estándares
 */
export function normalizeGA4Item(customItem = {}) {
  return {
    // Requerido
    item_id: customItem.item_id || customItem.id || "",
    item_name: customItem.item_name || customItem.name || "",

    // Clasificación (multi-nivel)
    item_brand: customItem.item_brand || customItem.brand || "",
    item_category: customItem.item_category || customItem.category || "",
    item_category2: customItem.item_category2 || "",
    item_category3: customItem.item_category3 || "",
    item_category4: customItem.item_category4 || "",
    item_category5: customItem.item_category5 || "",
    item_variant: customItem.item_variant || "",

    // Pricing
    price: parseFloat(customItem.price || 0),
    quantity: parseInt(customItem.quantity || 1),
    currency: customItem.currency || "USD",

    // Financial (additions)
    discount: parseFloat(customItem.discount || 0),
    tax: parseFloat(customItem.tax || 0),

    // Attribution
    affiliation: customItem.affiliation || "",
    coupon: customItem.coupon || "",

    // List context (para view_item_list)
    item_list_id: customItem.item_list_id || "",
    item_list_name: customItem.item_list_name || "",
    item_list_index: parseInt(customItem.item_list_index || 0),

    // Promotion
    promotion_id: customItem.promotion_id || "",
    promotion_name: customItem.promotion_name || "",
    creative_name: customItem.creative_name || "",
    creative_slot: customItem.creative_slot || ""
  }
}

/**
 * Validar que un evento tiene estructura GA4 válida
 * @param {Object} payload - Payload GA4
 * @returns {boolean} True si es válido
 */
export function isValidGA4Payload(payload) {
  if (!payload || typeof payload !== "object") return false
  if (!payload.client_id) return false
  if (!Array.isArray(payload.events) || payload.events.length === 0) return false

  const event = payload.events[0]
  if (!event.name) return false
  if (!event.params || typeof event.params !== "object") return false

  return true
}

/**
 * Obtener propiedades de usuario estándar GA4
 * Para setear globalmente en el tracker
 * @param {Object} context - Contexto del usuario (geo, ua, etc)
 * @returns {Object} GA4 user properties
 */
export function buildUserProperties(context = {}) {
  return {
    user_language: context.language || "en",
    user_country: context.country || "unknown",
    user_segment: context.segment || "visitor",
    subscription_status: context.subscriptionStatus || "free",
    user_ltv_currency: context.ltv_currency || "USD",
    user_ltv_revenue: parseFloat(context.ltv_revenue || 0)
  }
}

/**
 * Obtener propiedades de sesión estándar GA4
 * @param {Object} context - Contexto de sesión
 * @returns {Object} GA4 session properties
 */
export function buildSessionProperties(context = {}) {
  return {
    session_number: parseInt(context.session_number || 1),
    session_duration_seconds: parseInt(context.session_duration_seconds || 0),
    engaged_session: context.engaged || false,
    session_start_timestamp: context.session_start_timestamp || Date.now()
  }
}
