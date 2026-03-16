import { randomId, anonymizeIP, serializeQuery, safeJsonParse } from "./utils.js"
import { resolveCategory, BATCHABLE_TYPES, COMPLETION_TYPES } from "./constants/events.js"
import { sanitizeItems } from "./constants/params.js"
import { anonymizeEventForExport, hashUserIdForML, buildMLTrainingRecord, createAnonDatasetRecord } from "./dataPrivacy.js"
import { sendToGA4MeasurementProtocol, batchSendToGA4 } from "./ga4MeasurementProtocol.js"
import { buildGA4EventPayload, isValidGA4Payload, toGA4EventName } from "./ga4StandardEvents.js"

function parseUA(ua = "") {
  const s = ua.toLowerCase()
  return {
    browser: s.includes("firefox") ? "firefox" : s.includes("edg") ? "edge"
           : s.includes("chrome")  ? "chrome"  : s.includes("safari") ? "safari" : "other",
    os     : s.includes("android") ? "android" : (s.includes("iphone")||s.includes("ipad")) ? "ios"
           : s.includes("windows") ? "windows" : s.includes("mac os") ? "macos"
           : s.includes("linux")   ? "linux"   : "other",
    device : s.includes("mobile")||s.includes("iphone") ? "mobile"
           : s.includes("tablet")||s.includes("ipad")   ? "tablet" : "desktop"
  }
}

export async function trackPageview(request, env, region, consent, geo, platforms, sessionId, identity) {
  const url = new URL(request.url)
  const ua  = parseUA(request.headers.get("user-agent") || "")
  const ip  = anonymizeIP(request.headers.get("cf-connecting-ip"), region)
  const pageType = identity?.moodleContext?.type || identity?.buddybossContext?.type ||
    (identity?.wooContext?.isCheckout ? "checkout" : identity?.wooContext?.isCart ? "cart" : "page")
  const contentId = identity?.moodleContext?.id || identity?.buddybossContext?.slug || null
  const userSegment = identity?.isMoodleActive ? "student"
    : identity?.isAuthenticated ? "customer"
    : platforms?.isBuddyBoss ? "community_member"
    : "anonymous"

  const event = {
    id       : randomId(), type: "pageview", eventName: "page_view",
    category : resolveCategory("pageview", "engagement"),
    url      : url.toString(), path: url.pathname,
    host     : url.host, referrer: request.headers.get("referer"),
    query    : serializeQuery(url),
    sessionId, consent, region, geo,
    browser  : ua.browser, os: ua.os, device: ua.device, ip,
    userId   : identity.userId,
    isAnon   : !identity.userId,
    fingerprint: identity.fingerprint,
    platform : {
      isMoodle     : platforms.isMoodle,
      isBuddyBoss  : platforms.isBuddyBoss,
      hasGamiPress : platforms.hasGamiPress,
      isWooCommerce: platforms.isWooCommerce,
      isLoggedIn   : platforms.isLoggedInWP || platforms.isLoggedInMoodle,
      moodleCtx    : identity.moodleContext,
      buddybossCtx : identity.buddybossContext,
      wooCtx       : identity.wooContext,
      host         : platforms.host
    },
    customParams: {
      custom_page_type: pageType,
      custom_content_id: contentId,
      custom_content_name: identity?.path || url.pathname,
      custom_is_first_visit: Boolean(!identity?.userId),
      custom_user_segment: userSegment
    },
    timestamp: Date.now()
  }

  if (env.ANALYTICS) {
    await env.ANALYTICS.put(`events:${event.id}`, JSON.stringify(event), {
      expirationTtl: 60 * 60 * 24 * 365
    })
  }
}

export async function trackEventComplete(env, event, identity = {}) {
  if (!env?.ANALYTICS) return
  const key = `completions:${event.type}:${event.id}`
  const value = {
    id: event.id,
    type: event.type,
    category: event.category,
    eventName: event.eventName,
    sessionId: event.sessionId,
    userId: identity.userId || null,
    host: event.host || null,
    page: event.page || null,
    value: event.value || null,
    currency: event.currency || null,
    items: event.items || [],
    timestamp: event.timestamp
  }
  await env.ANALYTICS.put(key, JSON.stringify(value), {
    expirationTtl: 60 * 60 * 24 * 365
  })
}

async function aggregateEvent(env, event) {
  if (!env?.ANALYTICS) return
  const day = new Date(event.timestamp).toISOString().slice(0, 10)
  const host = event.host || "unknown"
  const key = `agg:${day}:${event.category}:${event.type}:${host}`

  const prev = safeJsonParse(await env.ANALYTICS.get(key), {
    count: 0,
    totalValue: 0,
    lastEventAt: null
  })

  const next = {
    count: Number(prev.count || 0) + 1,
    totalValue: Number(prev.totalValue || 0) + Number(event.value || 0),
    lastEventAt: event.timestamp
  }

  await env.ANALYTICS.put(key, JSON.stringify(next), {
    expirationTtl: 60 * 60 * 24 * 365
  })
}

function normalizeIncomingEvent(payload, request, region, consent, geo, platforms, sessionId) {
  const ua = parseUA(request.headers.get("user-agent") || "")
  const ip = anonymizeIP(request.headers.get("cf-connecting-ip"), region)
  const type = payload.type || "custom"

  return {
    id         : payload.id || randomId(),
    type,
    eventName  : payload.eventName || payload.type || "custom",
    category   : payload.category || resolveCategory(type, "custom"),
    sessionId  : payload.sessionId || sessionId,
    properties : payload.properties || {},
    items      : sanitizeItems(payload.items || payload.properties?.items || []),
    customParams: payload.customParams || payload.properties?.customParams || {},
    value      : payload.value ?? payload.properties?.value ?? null,
    currency   : payload.currency || payload.properties?.currency || null,
    page       : payload.page || null,
    host       : payload.host || null,
    consent, region, geo,
    browser    : ua.browser, os: ua.os, device: ua.device, ip,
    platform   : {
      isMoodle     : platforms.isMoodle,
      isBuddyBoss  : platforms.isBuddyBoss,
      hasGamiPress : platforms.hasGamiPress,
      isWooCommerce: platforms.isWooCommerce,
      hasCart      : platforms.hasCartItems
    },
    timestamp  : Date.now()
  }
}

export async function trackEventFromRequest(request, env, region, consent, geo, platforms, sessionId) {
  if (!consent?.analytics) {
    return { ok: false, skipped: true, reason: "analytics_consent_required" }
  }
  const body = safeJsonParse(await request.text(), {})
  const incoming = Array.isArray(body.events) ? body.events : [body]
  const out = []

  for (const payload of incoming.slice(0, 100)) {
    const event = normalizeIncomingEvent(payload, request, region, consent, geo, platforms, sessionId)
    out.push(event.id)

    // ─── STORE RAW EVENT IN KV (full data for ML training) ───
    if (env.ANALYTICS) {
      await env.ANALYTICS.put(`events:${event.id}`, JSON.stringify(event), {
        expirationTtl: 60 * 60 * 24 * 365
      })
    }

    // ─── ML DATASET STORAGE (for Moodle events) ───
    if (event.type.startsWith("moodle_") && event.properties?.ml_feature_vector) {
      const mlRecord = {
        id: event.id,
        timestamp: event.timestamp,
        courseId: event.properties.course_id,
        userId: hashUserIdForML(event.userId, event.properties.course_id),
        eventType: event.type,
        features: event.properties.ml_feature_vector,
        riskScores: event.properties.risk_scores || {},
        target: null // Filled later with instructor feedback
      }

      if (env.ANALYTICS) {
        await env.ANALYTICS.put(`ml_training:${event.id}`, JSON.stringify(mlRecord), {
          expirationTtl: 60 * 60 * 24 * 365
        })
      }
    }

    // ─── ANONYMIZE FOR EXPORT (Google Analytics, Zaraz) ───
    const anonEvent = anonymizeEventForExport(event, region)

    // ─── SEND TO GA4 MEASUREMENT PROTOCOL (if configured) ───
    // Direct transmission to Google Analytics 4 Measurement Protocol API
    // Respects region-based consent: EU/CA requires explicit consent
    if (env.GA4_MEASUREMENT_ID && env.GA4_API_SECRET) {
      // Check consent + region for direct GA4 transmission
      const canSendGA4 = (region === "eu" || region === "ca")
        ? false // EU/CA require explicit consent not yet implemented in simple mode
        : true  // US/Global can send

      if (canSendGA4) {
        // Convert to GA4 standard format
        const ga4Event = buildGA4EventPayload(event)

        // Validate payload structure
        if (isValidGA4Payload(ga4Event)) {
          // Send to GA4 (non-blocking to avoid impact on response time)
          sendToGA4MeasurementProtocol(env, event, region).catch(err => {
            // Log error but don't fail the request
            console.error("[GA4 Send Error]", event.type, err.message)
          })
        }
      }
    }

    // ─── AGGREGATE EVENTS ───
    if (BATCHABLE_TYPES.has(event.type)) {
      await aggregateEvent(env, anonEvent)
      continue
    }

    // ─── COMPLETION TRACKING ───
    if (COMPLETION_TYPES.has(event.type)) {
      await trackEventComplete(env, event)
    }
  }

  return { ok: true, ids: out, accepted: out.length }
}

/**
 * Get Moodle course analytics for dashboard
 * Returns risk aggregates per student in a course
 */
export async function getMoodleCourseAnalytics(env, courseId, options = {}) {
  if (!env?.ANALYTICS || !courseId) {
    return { error: "Missing ANALYTICS KV or courseId", status: 400 }
  }

  const dateFrom = options.dateFrom ? new Date(options.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const limit = options.limit || 100

  const list = await env.ANALYTICS.list({
    prefix: `ml_training:`,
    limit: limit * 10 // Get more to filter
  })

  const students = {}

  for (const key of list.keys) {
    const record = safeJsonParse(await env.ANALYTICS.get(key.name), {})

    // Filter by course and date
    if (record.courseId != courseId || !record.timestamp || new Date(record.timestamp) < dateFrom) {
      continue
    }

    const userId = record.userId
    if (!students[userId]) {
      students[userId] = {
        userId_hash: userId,
        engagement_risk: "low",
        performance_risk: "low",
        behavior_risk: "low",
        days_inactive: 0,
        last_activity: null,
        event_count: 0,
        risk_score_aggregate: 0
      }
    }

    students[userId].event_count += 1
    students[userId].last_activity = record.timestamp

    // Aggregate risk scores if present
    if (record.riskScores) {
      if (record.riskScores.engagement_risk_level) {
        students[userId].engagement_risk = record.riskScores.engagement_risk_level
      }
      if (record.riskScores.performance_risk_level) {
        students[userId].performance_risk = record.riskScores.performance_risk_level
      }
    }
  }

  const studentArray = Object.values(students).sort((a, b) => {
    // Sort by last activity (newest first)
    return new Date(b.last_activity) - new Date(a.last_activity)
  })

  return {
    ok: true,
    courseId: courseId,
    dateRange: { from: dateFrom.toISOString() },
    studentCount: studentArray.length,
    students: studentArray.slice(0, limit)
  }
}

/**
 * Export ML dataset in JSONL format (one JSON per line)
 * Anonimized, ready for pandas/scikit-learn import
 */
export async function exportMLDataset(env, options = {}) {
  if (!env?.ANALYTICS) {
    return { error: "ANALYTICS KV not configured", status: 500 }
  }

  const courseId = options.courseId
  const limit = options.limit || 10000
  const format = options.format || "jsonl"
  const region = options.region || "global"

  const list = await env.ANALYTICS.list({
    prefix: `ml_training:`,
    limit: limit
  })

  const records = []

  for (const key of list.keys) {
    const record = safeJsonParse(await env.ANALYTICS.get(key.name), {})

    // Filter by course if specified
    if (courseId && record.courseId != courseId) {
      continue
    }

    // Create anonimized dataset record
    const anonRecord = createAnonDatasetRecord(record, region)
    records.push(anonRecord)
  }

  // Randomly assign to train/val/test splits (80/10/10)
  records.forEach(function(record) {
    const rand = Math.random()
    if (rand < 0.8) {
      record.split = "train"
    } else if (rand < 0.9) {
      record.split = "val"
    } else {
      record.split = "test"
    }
  })

  // Format output
  let output

  if (format === "jsonl") {
    // JSONL format (one JSON per line)
    output = records.map(r => JSON.stringify(r)).join("\n")
  } else if (format === "json") {
    // JSON array format
    output = JSON.stringify(records, null, 2)
  } else if (format === "csv") {
    // CSV format
    if (records.length === 0) {
      output = ""
    } else {
      const headers = Object.keys(records[0]);
      const rows = records.map(r =>
        headers.map(h => {
          const val = r[h];
          // Escape quotes in CSV
          if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
          return val;
        }).join(",")
      );
      output = headers.join(",") + "\n" + rows.join("\n");
    }
  } else {
    return { error: "Unsupported format: " + format, status: 400 }
  }

  return {
    ok: true,
    format: format,
    recordCount: records.length,
    data: output
  }
}

/**
 * Validate GA4 Configuration
 * Tests connectivity to GA4 Measurement Protocol API
 */
export async function validateGA4Config(env) {
  if (!env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) {
    return {
      status: "error",
      message: "GA4_MEASUREMENT_ID or GA4_API_SECRET not configured",
      configured: false
    }
  }

  try {
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

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
        timeout: 5000
      }
    )

    const isSuccessful = response.status === 204 || response.ok
    return {
      status: isSuccessful ? "success" : "failed",
      configured: true,
      http_status: response.status,
      measurement_id: env.GA4_MEASUREMENT_ID?.substring(0, 5) + "***"
    }
  } catch (err) {
    return {
      status: "error",
      configured: true,
      message: err.message
    }
  }
}
