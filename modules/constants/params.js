/**
 * GA4 Parameter Mappings
 * Defines how to structure event data for GA4 compliance
 */

export const GA4_PARAMS = {
  // ======= UNIVERSAL PARAMETERS =======
  session_id: "session_id",
  user_id: "user_id",
  user_pseudo_id: "user_pseudo_id", // Automatically handled by GA4
  timestamp_micros: "timestamp_micros",
  engagement_time_msec: "engagement_time_msec",

  // ======= PAGE & SESSION =======
  page_location: "page_location", // Full URL
  page_referrer: "page_referrer",
  page_title: "page_title",
  page_path: "page_path",

  // ======= ECOMMERCE ITEM STRUCTURE =======
  // Each item in array must have:
  items: {
    item_id: "Required - Product/course ID",
    item_name: "Required - Product/course name",
    affiliation: "Store/platform name",
    currency: "Product currency (USD, EUR, etc)",
    price: "Unit price",
    quantity: "Item quantity",
    item_category: "Product category",
    item_category2: "Secondary category",
    item_category3: "Tertiary category",
    item_category4: "Quaternary category",
    item_category5: "Quinary category",
    item_brand: "Brand name",
    item_variant: "Product variant/option",
    index: "Position in list (0-indexed)",
    coupon: "Coupon/promo code",
    discount: "Discount amount",
    // Custom parameters for learning context
    course_id: "Learning: Course ID",
    instructor_id: "Learning: Instructor ID",
    skill_level: "Learning: Beginner/Intermediate/Advanced",
    content_type: "Learning: Lesson/Quiz/Assignment",
    duration_minutes: "Learning: Content duration"
  },

  // ======= ECOMMERCE TRANSACTION =======
  value: "Transaction value (sum of items * quantities)",
  currency: "Transaction currency (USD, EUR, etc)",
  transaction_id: "Unique order ID",
  affiliation: "Store/merchant name",
  coupon: "Coupon code applied",
  shipping: "Shipping cost",
  tax: "Tax amount",

  // ======= FORM PARAMETERS =======
  form_id: "Unique form identifier",
  form_name: "Human-readable form name",
  form_type: "contact|signup|demo|newsletter|other",
  form_destination: "URL form submits to",
  form_field_count: "Total number of fields",
  form_field_names: "Array of field names",
  last_field_name: "Last field user interacted with (for abandonment)",

  // ======= LEAD PARAMETERS =======
  lead_type: "Type of lead (inquiry|signup|trial|demo|purchase)",
  lead_value: "Estimated lead value",

  // ======= SEARCH PARAMETERS =======
  search_term: "Search query string",
  search_result_count: "Number of results returned",
  search_filters: "Active filters applied (array)",

  // ======= VIDEO PARAMETERS =======
  video_id: "Unique video identifier",
  video_title: "Video title/name",
  video_url: "Video playback URL",
  video_duration: "Total video length in seconds",
  progress_percent: "% of video watched (0-100)",
  watched_time: "Seconds watched",
  video_provider: "youtube|vimeo|internal|other",

  // ======= LEARNING PARAMETERS =======
  course_id: "Unique course identifier",
  course_name: "Course title",
  course_category: "Course category/subject",
  enrollment_type: "free|paid|trial|audit",
  lesson_id: "Lesson/module identifier",
  lesson_name: "Lesson/module title",
  lesson_type: "text|video|quiz|assignment|mixed",
  quiz_id: "Quiz/assessment identifier",
  quiz_name: "Quiz title",
  question_count: "Total questions in quiz",
  score: "User's numeric score",
  passing_score: "Required score to pass",
  attempt_number: "Quiz attempt number",
  assignment_id: "Assignment identifier",
  assignment_name: "Assignment title",
  submission_type: "text|file|link|url",
  module_id: "Module/unit identifier",
  module_name: "Module title",
  modules_completed: "Number of modules completed in course",
  progress_percent: "% completion of course/module (0-100)",
  duration_seconds: "Time spent on lesson/activity",
  completion_date: "ISO format date string",
  unenroll_reason: "why user dropped (difficulty|time|interest|etc)",
  feedback_provided: "boolean - was feedback given",

  // ======= ERROR PARAMETERS =======
  error_type: "SyntaxError|ReferenceError|TypeError|NetworkError|etc",
  error_message: "Error message string (first 256 chars)",
  error_source: "script URL where error occurred",
  error_line: "Line number of error",
  error_column: "Column number of error",
  status_code: "HTTP status code (for API errors)",
  endpoint: "API endpoint that failed (for API errors)",

  // ======= PERFORMANCE PARAMETERS =======
  page_load_time_ms: "Total page load time in milliseconds",
  dns_time_ms: "DNS lookup time",
  ttfb_ms: "Time to first byte",
  fcp_ms: "First contentful paint (ms)",
  lcp_ms: "Largest contentful paint (ms)",
  fid_ms: "First input delay (ms)",
  cls: "Cumulative layout shift (0-1 value)",

  // ======= CAMPAIGN/ATTRIBUTION =======
  utm_source: "Traffic source",
  utm_medium: "Traffic medium",
  utm_campaign: "Campaign name",
  utm_content: "Campaign content/variant",
  utm_term: "Paid search term",
  gclid: "Google Click ID",
  fbclid: "Facebook Click ID",
  msclkid: "Microsoft Click ID",

  // ======= CUSTOM PARAMETERS (Non-standard) =======
  custom_user_segment: "student|customer|instructor|admin|guest",
  custom_is_logged_in: "boolean",
  custom_is_first_visit: "boolean",
  custom_page_type: "product|course|checkout|profile|dashboard|etc",
  custom_content_id: "Primary content identifier on page",
  custom_content_name: "Human-readable content name",
  custom_platform_type: "moodle|wordpress|woocommerce|other",
  custom_region: "eu|us|ca|global",
  engagement_quality: "high|medium|low"
}

/**
 * Build GA4-compliant items array
 * @param {Object} item - Single item data
 * @param {string} type - 'ecommerce' | 'learning' | 'generic'
 * @returns {Object} GA4-formatted item
 */
export function formatItem(item, type = 'ecommerce') {
  const base = {
    item_id: item.item_id || item.id || '',
    item_name: item.item_name || item.name || '',
  }

  if (type === 'ecommerce') {
    return {
      ...base,
      affiliation: item.affiliation || null,
      currency: item.currency || 'USD',
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      item_category: item.item_category || null,
      item_brand: item.item_brand || null,
      item_variant: item.item_variant || null,
      coupon: item.coupon || null
    }
  }

  if (type === 'learning') {
    return {
      ...base,
      course_id: item.course_id || '',
      course_name: item.course_name || '',
      lesson_id: item.lesson_id || null,
      content_type: item.content_type || 'lesson',
      duration_minutes: parseInt(item.duration_minutes) || 0,
      skill_level: item.skill_level || null,
      difficulty: item.difficulty || null
    }
  }

  return base
}

/**
 * Build GA4-compliant event payload
 * @param {string} eventName - GA4 event name
 * @param {Object} params - Event parameters
 * @returns {Object} GA4-formatted event
 */
export function formatGAEvent(eventName, params = {}) {
  return {
    name: eventName,
    params: {
      ...params,
      // Ensure these are always present
      page_location: params.page_location || typeof window !== 'undefined' ? window.location.href : '',
      page_title: params.page_title || typeof document !== 'undefined' ? document.title : '',
      page_path: params.page_path || typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp_micros: params.timestamp_micros || String(Date.now() * 1000),
    }
  }
}

/**
 * Validate event has all required parameters
 * @param {string} eventName - Event to validate
 * @param {Object} params - Params to check
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateEvent(eventName, params = {}) {
  const requiredByEvent = {
    'purchase': ['transaction_id', 'currency', 'value'],
    'begin_checkout': ['currency', 'value'],
    'add_to_cart': ['currency', 'value'],
    'form_submit': ['form_id', 'form_name'],
    'course_enrollment': ['course_id', 'course_name'],
    'quiz_complete': ['quiz_id', 'score'],
    'lesson_complete': ['lesson_id', 'lesson_name']
  }

  const required = requiredByEvent[eventName] || []
  const missing = required.filter(param => !params[param])

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Sanitize params for GDPR (remove sensitive data)
 * @param {Object} params - Raw parameters
 * @param {Object} consent - User consent state
 * @returns {Object} Sanitized parameters
 */
export function sanitizeParams(params = {}, consent = {}) {
  const sanitized = { ...params }

  // Remove PII unless explicitly provided in forms
  if (!params.is_form_submission) {
    delete sanitized.email
    delete sanitized.phone
    delete sanitized.name
    delete sanitized.address
  }

  // Respect consent state
  if (!consent.analytics) {
    delete sanitized.user_id // Don't track identified user if no analytics consent
  }

  if (!consent.marketing) {
    delete sanitized.gclid
    delete sanitized.fbclid
    delete sanitized.msclkid
  }

  return sanitized
}
