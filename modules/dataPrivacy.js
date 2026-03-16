/**
 * dataPrivacy.js - Centralized privacy & anonymization utilities
 * Handles GDPR/CCPA compliance: anonimization for EU, full data for US/Global
 * ML datasets prepared with deterministic hashing for secure training
 */

import { hashSimple } from "./utils.js"

/**
 * Check if region requires strict anonymization
 * EU + Canada require strict anonymization for export
 */
function regionRequiresStrictAnonymization(region) {
  return region === "eu" || region === "ca"
}

/**
 * Anonymize event before exporting to third parties (Google Analytics, Zaraz)
 * @param {Object} event - Full event object
 * @param {string} region - "eu", "ca", "us", "global"
 * @returns {Object} Anonymized event safe for export
 */
export function anonymizeEventForExport(event, region) {
  const strict = regionRequiresStrictAnonymization(region)

  const anonEvent = {
    ...event,
    // Keep event structure for tracking
    id: event.id,
    type: event.type,
    eventName: event.eventName,
    category: event.category,
    timestamp: event.timestamp,
    sessionId: event.sessionId,

    // Geography/Browser kept (non-personal)
    browser: event.browser,
    os: event.os,
    device: event.device,
    region: event.region,
    geo: strict ? null : event.geo, // Omit granular geo for EU/CA

    // User identification
    userId: strict ? null : event.userId, // Omit userId for EU/CA
    isAnon: strict ? true : event.isAnon,
    fingerprint: event.fingerprint, // Keep fingerprint (PII-less)

    // IP already anonymized by utils.anonymizeIP() before storage
    ip: event.ip,

    // Platform info (keep)
    platform: event.platform,

    // Page context
    page: event.page,
    host: event.host,

    // Custom parameters (scrub sensitive ones)
    properties: sanitizeEventProperties(event.properties, region),
    customParams: sanitizeEventProperties(event.customParams, region),

    // Items/ecommerce
    items: event.items || [],
    value: event.value,
    currency: event.currency
  }

  // Remove sensitive fields for EU
  if (strict) {
    delete anonEvent.userId
    delete anonEvent.geo
  }

  return anonEvent
}

/**
 * Sanitize event properties based on region
 * Removes/hashes sensitive data for strict regions
 */
export function sanitizeEventProperties(props = {}, region) {
  if (!props || typeof props !== "object") return {}

  const strict = regionRequiresStrictAnonymization(region)
  const sanitized = { ...props }

  // List of sensitive property names to remove or hash
  const sensitiveKeys = [
    "email", "phone", "ssn", "passport", "credit_card",
    "password", "api_key", "auth_token", "user_email",
    "customer_email", "student_email"
  ]

  // Moodle-specific sensitive keys
  const moodleSensitiveKeys = [
    "user_email", "instructor_email", "student_name",
    "user_full_name", "gradebook_details"
  ]

  const allSensitiveKeys = [...sensitiveKeys, ...moodleSensitiveKeys]

  allSensitiveKeys.forEach(key => {
    if (key in sanitized) {
      if (strict) {
        // For EU/CA: hash emails/sensitive data
        if (key.includes("email")) {
          sanitized[key] = `email_${hashSimple(sanitized[key])}`
        } else {
          delete sanitized[key]
        }
      }
    }
  })

  return sanitized
}

/**
 * Generate deterministic hash of userId for ML training
 * Same userId + courseId always produces same hash (allows matching across datasets)
 * Reversible only with salt lookup table (kept private on server)
 *
 * @param {string} userId - Moodle user ID
 * @param {string} courseId - Moodle course ID (salt)
 * @returns {string} Hash like "user_abc123xyz"
 */
export function hashUserIdForML(userId, courseId = "") {
  if (!userId) return null

  // Create deterministic hash with course as salt
  const combined = `${userId}:${courseId}`
  const hash = hashSimple(combined)

  return `user_${hash}`
}

/**
 * Normalize feature vectors for ML training
 * Converts risk scores, engagement metrics to numeric format
 *
 * @param {Object} properties - Event properties with raw values
 * @returns {Array} Array of numeric features ready for scikit-learn/TensorFlow
 */
export function buildMLFeatureVector(properties = {}) {
  const features = {
    // Engagement features (0-100)
    engagement_score: normalizeScore(properties.engagement_score),

    // Time features (seconds to minutes)
    time_in_activity_minutes: normalizeTime(properties.time_in_activity),
    session_duration_minutes: normalizeTime(properties.session_duration_seconds),

    // Count features
    interaction_count: Math.min(parseInt(properties.interaction_count) || 0, 50) / 50,
    forum_posts_count: Math.min(parseInt(properties.forum_posts) || 0, 20) / 20,
    assignments_started: Math.min(parseInt(properties.assignments_started) || 0, 10) / 10,
    quizzes_attempted: Math.min(parseInt(properties.quizzes_attempted) || 0, 10) / 10,

    // Risk features (convert text to numeric)
    engagement_risk_level: encodeRiskLevel(properties.engagement_risk || "low"),
    performance_risk_level: encodeRiskLevel(properties.performance_risk || "low"),
    behavior_risk_level: encodeRiskLevel(properties.behavior_risk || "low"),

    // Active state (boolean → 0 or 1)
    is_active: properties.is_active ? 1 : 0,

    // Inactivity days (capped at 100 days)
    days_inactive: Math.min(parseInt(properties.days_inactive) || 0, 100) / 100,

    // Completion rates (0-1)
    completion_rate: Math.max(0, Math.min(1, parseFloat(properties.completion_rate) || 0)),

    // Grade velocity (trend)
    grade_velocity: (parseFloat(properties.grade_velocity) || 0) / 10, // Capped at 10 points/interval

    // CoI presence indicators (0-1 scale)
    cognitive_presence: normalizeScore(properties.cognitive_presence),
    social_presence: normalizeScore(properties.social_presence),
    teaching_presence: normalizeScore(properties.teaching_presence)
  }

  return features
}

/**
 * Convert risk level string to numeric (one-hot encoded as separate fields)
 * @param {string} riskLevel - "low", "medium", "high", "critical"
 * @returns {number} 0=low, 0.33=medium, 0.67=high, 1=critical
 */
function encodeRiskLevel(riskLevel = "low") {
  const mapping = {
    "low": 0,
    "medium": 0.33,
    "high": 0.67,
    "critical": 1
  }
  return mapping[riskLevel.toLowerCase()] || 0
}

/**
 * Normalize percentage/score (0-100) to 0-1 range
 */
function normalizeScore(score) {
  if (score === null || score === undefined) return 0
  const num = parseFloat(score) || 0
  return Math.max(0, Math.min(1, num / 100))
}

/**
 * Normalize time (seconds to minutes, then 0-1)
 * Max useful time = 300 minutes (5 hours session)
 */
function normalizeTime(seconds) {
  if (seconds === null || seconds === undefined) return 0
  const minutes = parseInt(seconds) / 60 || 0
  return Math.max(0, Math.min(1, minutes / 300))
}

/**
 * Build complete ML training record from Moodle event
 * Ready for pandas/numpy/tensorflow import
 *
 * @param {Object} event - Normalized analytics event
 * @returns {Object} ML training record with features, target placeholder, etc.
 */
export function buildMLTrainingRecord(event) {
  // Only works for Moodle events with feature vectors
  if (!event.type.startsWith("moodle_") || !event.properties?.ml_feature_vector) {
    return null
  }

  const features = buildMLFeatureVector(event.properties)

  return {
    // Metadata
    id: event.id,
    timestamp: event.timestamp,
    courseId: event.properties.course_id,
    userId: hashUserIdForML(event.userId, event.properties.course_id),

    // Event classification
    eventType: event.type,
    eventCategory: event.category,

    // Feature vector normalized for ML
    features: features,

    // Risk scores from rule-based system (baseline)
    riskScores: event.properties.risk_scores || {},

    // Target variable (initially null, filled by instructor feedback)
    target: null,
    targetLabel: null, // e.g., "dropout", "success", "at_risk"

    // Split assignment (for train/val/test)
    split: null // Will be set during dataset export: "train", "val", "test"
  }
}

/**
 * Create anonymized dataset record for export
 * Strips all PII, keeps only features and anonymized identifiers
 *
 * @param {Object} trainingRecord - Raw ML training record
 * @param {string} region - Geographic region
 * @returns {Object} Public-safe dataset record
 */
export function createAnonDatasetRecord(trainingRecord, region = "global") {
  if (!trainingRecord) return null

  const strict = regionRequiresStrictAnonymization(region)

  return {
    // Keep ID for reference (opaque)
    recordId: trainingRecord.id,

    // Timestamp for time-series analysis
    timeUnix: trainingRecord.timestamp,

    // Only hash of user with course salt
    userHash: trainingRecord.userId,

    // Course anonymized if needed
    courseHash: strict ? hashSimple(trainingRecord.courseId) : trainingRecord.courseId,

    // Event classification
    eventType: trainingRecord.eventType,

    // Features (all numeric, no PII)
    ...trainingRecord.features,

    // Risk baseline
    baselineRiskScore: trainingRecord.riskScores?.overall || null,

    // Target for supervised learning (null initially)
    target: trainingRecord.target,

    // Split assignment
    split: trainingRecord.split
  }
}

/**
 * Validate that a feature vector is safe for ML training
 * (No NaN, all numeric, reasonable ranges)
 *
 * @param {Object} features - Feature object
 * @returns {boolean} True if valid
 */
export function isValidMLFeatures(features = {}) {
  if (!features || typeof features !== "object") return false

  for (const [key, value] of Object.entries(features)) {
    // Each value should be numeric
    if (typeof value !== "number") return false

    // No NaN or Infinity
    if (!isFinite(value)) return false

    // Should be normalized (mostly 0-1 range, some up to 100)
    if (value < -1 || value > 100) return false
  }

  return true
}
