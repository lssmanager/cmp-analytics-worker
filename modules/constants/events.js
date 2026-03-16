export const EVENT_CATEGORIES = {
  pageview: "engagement",
  session_start: "engagement",
  user_engagement: "engagement",
  scroll: "engagement",
  click: "engagement",
  search: "search",
  view_search_results: "search",
  page_error: "error",
  api_error: "error",
  remove_from_cart: "ecommerce",
  view_item: "ecommerce",
  view_item_list: "ecommerce",
  add_to_cart: "ecommerce",
  begin_checkout: "ecommerce",
  add_shipping_info: "ecommerce",
  add_payment_info: "ecommerce",
  purchase: "ecommerce",
  course_enrollment: "learning",
  course_unenroll: "learning",
  course_progress: "learning",
  lesson_start: "learning",
  lesson_complete: "learning",
  lesson_unenroll: "learning",
  module_complete: "learning",
  quiz_start: "learning",
  quiz_complete: "learning",
  quiz_fail: "learning",
  assignment_submit: "learning",
  assignment_complete: "learning",
  // Advanced Moodle Analytics - Community of Inquiry
  moodle_cognitive_presence: "learning_analytics",
  moodle_social_presence: "learning_analytics",
  moodle_teaching_presence: "learning_analytics",
  // Advanced Moodle Analytics - Predictive Risk
  moodle_engagement_risk: "predictive_analytics",
  moodle_performance_risk: "predictive_analytics",
  moodle_behavior_risk: "predictive_analytics",
  // Moodle Gradebook & Competencies
  moodle_gradebook_category: "learning_analytics",
  moodle_competency_progress: "learning_analytics",
  moodle_competency_achieved: "learning_analytics",
  moodle_badge_earned: "learning_analytics",
  // Moodle Session & ML Training
  moodle_session_summary: "learning_analytics",
  moodle_ml_training_record: "ml_training",
  form_start: "forms",
  form_submit: "forms",
  form_abandon: "forms",
  lead_generation: "forms",
  contact_form_submit: "forms",
  newsletter_signup: "forms",
  demo_request: "forms",
  video_start: "media",
  video_progress: "media",
  video_complete: "media"
}

export const BATCHABLE_TYPES = new Set([
  "heartbeat",
  "scroll",
  "click",
  "user_engagement",
  "form_field_interaction"
])

export const COMPLETION_TYPES = new Set([
  "purchase",
  "course_enrollment",
  "course_unenroll",
  "quiz_complete",
  "assignment_complete",
  "lead_generation"
])

export function resolveCategory(type, fallback = "custom") {
  return EVENT_CATEGORIES[type] || fallback
}
