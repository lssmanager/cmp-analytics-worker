/**
 * GA4 Standard Events + Custom Learning/E-Commerce Events
 * Replaces Analytify with native GA4 tracking
 */

export const GA4_EVENTS = {
  // ======= PAGEVIEW & SESSION =======
  pageview: {
    name: "page_view",
    category: "engagement",
    description: "Page load/view",
    params: ["page_location", "page_referrer", "page_title", "engagement_time_msec"]
  },
  session_start: {
    name: "session_start",
    category: "engagement",
    description: "New session initiated",
    params: ["session_id"]
  },
  user_engagement: {
    name: "user_engagement",
    category: "engagement",
    description: "User interaction detected",
    params: ["engagement_time_msec", "session_id"]
  },
  scroll: {
    name: "scroll",
    category: "engagement",
    description: "User scrolled to depth",
    params: ["percent_scrolled", "engagement_time_msec"]
  },

  // ======= CLICK & INTERACTION =======
  click: {
    name: "click",
    category: "engagement",
    description: "Element clicked",
    params: ["link_id", "link_classes", "link_text", "link_url", "page_path"]
  },

  // ======= FORMS & LEAD GENERATION =======
  form_start: {
    name: "form_start",
    category: "lead",
    description: "User began form interaction",
    params: ["form_id", "form_name", "form_type"]
  },
  form_submit: {
    name: "form_submit",
    category: "lead",
    description: "User submitted form",
    params: ["form_id", "form_name", "form_type", "form_destination"]
  },
  form_abandon: {
    name: "form_abandon",
    category: "lead",
    description: "User left form without submission",
    params: ["form_id", "form_name", "last_field_name"]
  },
  lead_generation: {
    name: "lead_generation",
    category: "lead",
    description: "Lead generated (form submitted with value)",
    params: ["value", "currency", "lead_type", "form_id"]
  },
  contact_form_submit: {
    name: "contact_form_submit",
    category: "lead",
    description: "Contact form submission",
    params: ["form_id", "contact_topic"]
  },
  newsletter_signup: {
    name: "newsletter_signup",
    category: "lead",
    description: "User subscribed to newsletter",
    params: ["newsletter_name", "subscription_type"]
  },
  demo_request: {
    name: "demo_request",
    category: "lead",
    description: "Demo or trial requested",
    params: ["demo_type", "product_name", "scheduled_date"]
  },

  // ======= E-COMMERCE =======
  view_item: {
    name: "view_item",
    category: "ecommerce",
    description: "Individual product viewed",
    params: ["items", "currency", "value"]
  },
  view_item_list: {
    name: "view_item_list",
    category: "ecommerce",
    description: "Product list/collection viewed",
    params: ["item_list_id", "item_list_name", "items", "currency"]
  },
  add_to_cart: {
    name: "add_to_cart",
    category: "ecommerce",
    description: "Item added to cart",
    params: ["items", "currency", "value"]
  },
  remove_from_cart: {
    name: "remove_from_cart",
    category: "ecommerce",
    description: "Item removed from cart",
    params: ["items", "currency", "value"]
  },
  view_cart: {
    name: "view_cart",
    category: "ecommerce",
    description: "Cart viewed",
    params: ["items", "currency", "value"]
  },
  begin_checkout: {
    name: "begin_checkout",
    category: "ecommerce",
    description: "Checkout process started",
    params: ["items", "currency", "value"]
  },
  add_shipping_info: {
    name: "add_shipping_info",
    category: "ecommerce",
    description: "Shipping info provided",
    params: ["items", "currency", "value", "shipping_tier"]
  },
  add_payment_info: {
    name: "add_payment_info",
    category: "ecommerce",
    description: "Payment method selected",
    params: ["items", "currency", "value", "payment_type"]
  },
  purchase: {
    name: "purchase",
    category: "ecommerce",
    description: "Purchase completed (replaces order_completed)",
    params: ["transaction_id", "affiliation", "value", "currency", "items", "coupon"]
  },
  refund: {
    name: "refund",
    category: "ecommerce",
    description: "Order refunded/returned",
    params: ["transaction_id", "currency", "value", "items"]
  },

  // ======= E-LEARNING =======
  course_enrollment: {
    name: "course_enrollment",
    category: "learning",
    description: "User enrolled in course",
    params: ["course_id", "course_name", "course_category", "enrollment_type"]
  },
  course_unenroll: {
    name: "course_unenroll",
    category: "learning",
    description: "User unenrolled/dropped course",
    params: ["course_id", "course_name", "unenroll_reason"]
  },
  course_progress: {
    name: "course_progress",
    category: "learning",
    description: "User advanced in course",
    params: ["course_id", "course_name", "progress_percent", "last_completed_module"]
  },
  lesson_start: {
    name: "lesson_start",
    category: "learning",
    description: "Lesson/module view initiated",
    params: ["lesson_id", "lesson_name", "course_id", "lesson_type"]
  },
  lesson_complete: {
    name: "lesson_complete",
    category: "learning",
    description: "Lesson completion recorded",
    params: ["lesson_id", "lesson_name", "course_id", "duration_seconds", "completion_date"]
  },
  lesson_unenroll: {
    name: "lesson_unenroll",
    category: "learning",
    description: "User quit lesson mid-way",
    params: ["lesson_id", "lesson_name", "time_spent_seconds"]
  },
  quiz_start: {
    name: "quiz_start",
    category: "learning",
    description: "Quiz/assessment attempt started",
    params: ["quiz_id", "quiz_name", "course_id", "question_count", "attempt_number"]
  },
  quiz_complete: {
    name: "quiz_complete",
    category: "learning",
    description: "Quiz submission completed",
    params: ["quiz_id", "quiz_name", "score", "passing_score", "time_spent_seconds", "attempt_number"]
  },
  quiz_fail: {
    name: "quiz_fail",
    category: "learning",
    description: "User failed quiz assessment",
    params: ["quiz_id", "quiz_name", "score", "passing_score", "attempt_number"]
  },
  assignment_submit: {
    name: "assignment_submit",
    category: "learning",
    description: "Assignment submission recorded",
    params: ["assignment_id", "assignment_name", "course_id", "submission_type", "submission_date"]
  },
  assignment_complete: {
    name: "assignment_complete",
    category: "learning",
    description: "Assignment graded/reviewed",
    params: ["assignment_id", "assignment_name", "score", "feedback_provided"]
  },
  module_complete: {
    name: "module_complete",
    category: "learning",
    description: "Course module/unit completed",
    params: ["module_id", "module_name", "course_id", "duration_seconds", "modules_completed"]
  },

  // ======= SEARCH =======
  search: {
    name: "search",
    category: "engagement",
    description: "Site search performed",
    params: ["search_term", "search_result_count", "search_filters"]
  },
  view_search_results: {
    name: "view_search_results",
    category: "engagement",
    description: "Search results page viewed",
    params: ["search_term", "result_count", "page_result_count"]
  },

  // ======= VIDEO =======
  video_start: {
    name: "video_start",
    category: "engagement",
    description: "Video playback started",
    params: ["video_id", "video_title", "video_duration", "video_url"]
  },
  video_progress: {
    name: "video_progress",
    category: "engagement",
    description: "Video milestone reached",
    params: ["video_id", "progress_percent", "video_duration", "watched_time"]
  },
  video_complete: {
    name: "video_complete",
    category: "engagement",
    description: "Video fully watched",
    params: ["video_id", "video_title", "video_duration", "watched_time"]
  },

  // ======= ERROR & PERFORMANCE =======
  page_error: {
    name: "page_error",
    category: "error",
    description: "JavaScript error occurred",
    params: ["error_type", "error_message", "error_source", "error_line"]
  },
  api_error: {
    name: "api_error",
    category: "error",
    description: "API call failed",
    params: ["endpoint", "error_code", "error_message", "status_code"]
  },
  page_load_time: {
    name: "page_load_time",
    category: "performance",
    description: "Page load performance",
    params: ["page_load_time_ms", "dns_time_ms", "ttfb_ms", "page_path"]
  },

  // ======= CAMPAIGN & ATTRIBUTION =======
  campaign_hit: {
    name: "campaign_hit",
    category: "attribution",
    description: "Campaign parameter captured (UTM tracking)",
    params: ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "page_path"]
  },
  consent_loaded: {
    name: "consent_loaded",
    category: "compliance",
    description: "Consent state loaded on pageview",
    params: ["analytics_consent", "marketing_consent", "preferences_consent", "consent_region"]
  }
}

export const EVENT_CATEGORIES = {
  engagement: "User interaction & engagement",
  ecommerce: "Shopping & transaction events",
  learning: "E-learning & LMS events",
  lead: "Lead generation & forms",
  attribution: "Campaign & source tracking",
  compliance: "Consent & privacy events",
  error: "Error tracking",
  performance: "Performance metrics"
}

export function getEventSchema(eventName) {
  return GA4_EVENTS[eventName] || null
}

export function getEventsByCategory(category) {
  return Object.entries(GA4_EVENTS)
    .filter(([_, event]) => event.category === category)
    .map(([key, event]) => ({ ...event, internalName: key }))
}
