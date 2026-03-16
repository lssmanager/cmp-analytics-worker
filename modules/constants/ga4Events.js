/**
 * modules/constants/ga4Events.js - GA4 Event Taxonomy & Mappings
 *
 * Definitive source for all GA4-recognized and custom events
 * Maps internal event names to GA4 standard names and categories
 * Used by ga4StandardEvents.js for payload construction
 *
 * Structure:
 * - GA4_STANDARD_EVENTS: Native GA4 events from Google documentation
 * - LEARNING_PLATFORM_EVENTS: Moodle/LMS custom events
 * - SOCIAL_PLATFORM_EVENTS: BuddyBoss custom events
 * - EVENT_CATEGORIES: Semantic grouping for reporting
 */

/**
 * GA4 Standard Events (Google Analytics 4 native events)
 * Source: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */
export const GA4_STANDARD_EVENTS = {
  // ═══════════════════════════════════════════════════════════
  // USER LIFECYCLE EVENTS
  // ═══════════════════════════════════════════════════════════
  first_visit: {
    category: "user_lifecycle",
    description: "First time a user visits the app/site",
    isStandard: true,
    requiredParams: ["page_location", "page_referrer"]
  },
  first_open: {
    category: "user_lifecycle",
    description: "First time a user opens a mobile/app",
    isStandard: true,
    requiredParams: []
  },
  login: {
    category: "user_lifecycle",
    description: "User logs in",
    isStandard: true,
    requiredParams: ["method"],
    optionalParams: ["provider", "success"]
  },
  sign_up: {
    category: "user_lifecycle",
    description: "User creates a new account",
    isStandard: true,
    requiredParams: ["method"],
    optionalParams: ["provider", "success"]
  },
  app_update: {
    category: "user_lifecycle",
    description: "App is updated (mobile only)",
    isStandard: true,
    requiredParams: []
  },

  // ═══════════════════════════════════════════════════════════
  // ENGAGEMENT EVENTS
  // ═══════════════════════════════════════════════════════════
  page_view: {
    category: "engagement",
    description: "User views a page",
    isStandard: true,
    requiredParams: ["page_location", "page_title"],
    optionalParams: ["page_referrer", "session_id"]
  },
  scroll: {
    category: "engagement",
    description: "User scrolls down the page",
    isStandard: true,
    requiredParams: ["scroll_percent"],
    optionalParams: ["page_location"]
  },
  scroll_depth: {
    category: "engagement",
    description: "User reaches scroll depth milestone (25%, 50%, 75%, 100%)",
    isStandard: false,
    requiredParams: ["scroll_percent"],
    optionalParams: ["max_scroll_percent", "page_location"]
  },
  click: {
    category: "engagement",
    description: "User clicks on link or element",
    isStandard: true,
    requiredParams: ["link_id", "link_url"],
    optionalParams: ["link_text", "element_id"]
  },
  file_download: {
    category: "engagement",
    description: "User downloads a file",
    isStandard: true,
    requiredParams: ["file_name"],
    optionalParams: ["file_extension", "file_url"]
  },
  search: {
    category: "search",
    description: "User performs a search",
    isStandard: true,
    requiredParams: ["search_term"],
    optionalParams: ["search_context"]
  },
  view_search_results: {
    category: "search",
    description: "User views search results",
    isStandard: true,
    requiredParams: ["search_term"],
    optionalParams: ["number_of_results"]
  },

  // ═══════════════════════════════════════════════════════════
  // VIDEO EVENTS
  // ═══════════════════════════════════════════════════════════
  video_start: {
    category: "video",
    description: "User starts playing a video",
    isStandard: true,
    requiredParams: ["video_title", "video_url"],
    optionalParams: ["video_provider", "video_duration"]
  },
  video_progress: {
    category: "video",
    description: "User progresses through a video",
    isStandard: true,
    requiredParams: ["video_title", "video_current_time"],
    optionalParams: ["video_duration", "video_percent"]
  },
  video_complete: {
    category: "video",
    description: "User completes a video",
    isStandard: true,
    requiredParams: ["video_title", "video_duration"],
    optionalParams: ["video_provider"]
  },

  // ═══════════════════════════════════════════════════════════
  // ECOMMERCE EVENTS
  // ═══════════════════════════════════════════════════════════
  view_item: {
    category: "ecommerce",
    description: "User views an item/product details",
    isStandard: true,
    requiredParams: ["items"],
    optionalParams: ["value", "currency"]
  },
  view_item_list: {
    category: "ecommerce",
    description: "User views a list of items/products",
    isStandard: true,
    requiredParams: ["items"],
    optionalParams: ["item_list_id", "item_list_name"]
  },
  view_cart: {
    category: "ecommerce",
    description: "User views their shopping cart",
    isStandard: true,
    requiredParams: ["items"],
    optionalParams: ["value", "currency"]
  },
  add_to_cart: {
    category: "ecommerce",
    description: "User adds item to cart",
    isStandard: true,
    requiredParams: ["items"],
    optionalParams: ["quantity", "value", "currency"]
  },
  remove_from_cart: {
    category: "ecommerce",
    description: "User removes item from cart",
    isStandard: true,
    requiredParams: ["items"],
    optionalParams: ["quantity", "value", "currency"]
  },
  begin_checkout: {
    category: "ecommerce",
    description: "User begins checkout process",
    isStandard: true,
    requiredParams: ["items"],
    optionalParams: ["value", "currency", "coupon"]
  },
  add_shipping_info: {
    category: "ecommerce",
    description: "User adds shipping information",
    isStandard: true,
    requiredParams: ["coupon"],
    optionalParams: ["value", "currency", "shipping_tier"]
  },
  add_payment_info: {
    category: "ecommerce",
    description: "User adds payment information",
    isStandard: true,
    requiredParams: ["coupon"],
    optionalParams: ["value", "currency", "payment_type"]
  },
  purchase: {
    category: "ecommerce",
    description: "User completes a purchase",
    isStandard: true,
    requiredParams: ["items", "transaction_id", "value", "currency"],
    optionalParams: ["affiliation", "tax", "shipping", "coupon"]
  },
  refund: {
    category: "ecommerce",
    description: "Refund issued for purchase",
    isStandard: true,
    requiredParams: ["transaction_id"],
    optionalParams: ["value", "currency", "items"]
  },
  select_item: {
    category: "ecommerce",
    description: "User selects an item from a list",
    isStandard: true,
    requiredParams: ["items"],
    optionalParams: ["item_list_id", "item_list_name"]
  },
  select_promotion: {
    category: "ecommerce",
    description: "User selects/applies a promotion",
    isStandard: true,
    requiredParams: ["items", "promotion_id"],
    optionalParams: ["promotion_name", "creative_name"]
  },
  view_promotion: {
    category: "ecommerce",
    description: "User views a promotion",
    isStandard: true,
    requiredParams: ["promotion_id"],
    optionalParams: ["promotion_name", "creative_name"]
  },

  // ═══════════════════════════════════════════════════════════
  // FORM EVENTS
  // ═══════════════════════════════════════════════════════════
  form_start: {
    category: "forms",
    description: "User starts filling a form",
    isStandard: false,
    requiredParams: ["form_id", "form_name"],
    optionalParams: ["form_destination"]
  },
  form_submit: {
    category: "forms",
    description: "User submits a form",
    isStandard: true, // GA4 supports via GCM
    requiredParams: ["form_id"],
    optionalParams: ["form_name", "form_destination"]
  },
  form_abandon: {
    category: "forms",
    description: "User abandons a form mid-completion",
    isStandard: false,
    requiredParams: ["form_id"],
    optionalParams: ["form_name", "fields_completed"]
  },

  // ═══════════════════════════════════════════════════════════
  // WEB VITALS (Custom)
  // ═══════════════════════════════════════════════════════════
  web_vital_lcp: {
    category: "web_vitals",
    description: "Largest Contentful Paint metric",
    isStandard: false,
    requiredParams: ["metric_value"],
    optionalParams: ["metric_unit", "element"]
  },
  web_vital_fid: {
    category: "web_vitals",
    description: "First Input Delay metric",
    isStandard: false,
    requiredParams: ["metric_value"],
    optionalParams: ["metric_unit"]
  },
  web_vital_inp: {
    category: "web_vitals",
    description: "Interaction to Next Paint metric",
    isStandard: false,
    requiredParams: ["metric_value"],
    optionalParams: ["metric_unit"]
  },
  web_vital_cls: {
    category: "web_vitals",
    description: "Cumulative Layout Shift metric",
    isStandard: false,
    requiredParams: ["metric_value"],
    optionalParams: ["metric_unit"]
  },
  page_engagement_time: {
    category: "engagement",
    description: "Total active engagement time on page",
    isStandard: false,
    requiredParams: ["engagement_time_ms"],
    optionalParams: ["engaged"]
  }
};

/**
 * Learning Platform Events (Moodle/LMS)
 */
export const LEARNING_PLATFORM_EVENTS = {
  course_enrollment: {
    category: "learning",
    description: "User enrolls in a course",
    isStandard: false,
    requiredParams: ["course_id", "course_name"],
    optionalParams: ["enrollment_type", "price", "currency"]
  },
  course_unenroll: {
    category: "learning",
    description: "User un-enrolls from a course",
    isStandard: false,
    requiredParams: ["course_id"],
    optionalParams: ["course_name", "reason"]
  },
  course_completion: {
    category: "learning",
    description: "User completes a course",
    isStandard: false,
    requiredParams: ["course_id"],
    optionalParams: ["course_name", "completion_time_seconds", "final_grade"]
  },
  quiz_start: {
    category: "learning",
    description: "User starts a quiz",
    isStandard: false,
    requiredParams: ["quiz_id"],
    optionalParams: ["quiz_name", "course_id", "question_count", "time_limit_minutes"]
  },
  quiz_complete: {
    category: "learning",
    description: "User completes a quiz",
    isStandard: false,
    requiredParams: ["quiz_id"],
    optionalParams: ["quiz_name", "score", "total_points", "passing_score", "time_spent_seconds"]
  },
  assignment_submit: {
    category: "learning",
    description: "User submits an assignment",
    isStandard: false,
    requiredParams: ["assignment_id"],
    optionalParams: ["assignment_name", "submission_time", "submission_method"]
  },
  assignment_graded: {
    category: "learning",
    description: "Assignment is graded",
    isStandard: false,
    requiredParams: ["assignment_id"],
    optionalParams: ["assignment_name", "grade_received", "max_grade", "grading_date"]
  },
  lesson_complete: {
    category: "learning",
    description: "User completes a lesson",
    isStandard: false,
    requiredParams: ["lesson_id"],
    optionalParams: ["lesson_name", "time_spent_seconds"]
  },

  // ═══════════════════════════════════════════════════════════
  // MOODLE ADVANCED ANALYTICS (CoI + Risk)
  // ═══════════════════════════════════════════════════════════
  moodle_cognitive_presence: {
    category: "learning_analytics",
    description: "Cognitive presence indicator (CoI: thinking/learning)",
    isStandard: false,
    requiredParams: ["activity_type"],
    optionalParams: ["time_in_activity", "interaction_count", "depth_of_engagement"]
  },
  moodle_social_presence: {
    category: "learning_analytics",
    description: "Social presence indicator (CoI: peer interaction)",
    isStandard: false,
    requiredParams: ["interaction_type"],
    optionalParams: ["peer_count", "interaction_quality"]
  },
  moodle_teaching_presence: {
    category: "learning_analytics",
    description: "Teaching presence indicator (CoI: instructor guidance)",
    isStandard: false,
    requiredParams: ["interaction_type"],
    optionalParams: ["instructor_id", "response_time_hours"]
  },
  moodle_engagement_risk: {
    category: "predictive_analytics",
    description: "User at risk for disengagement",
    isStandard: false,
    requiredParams: ["risk_level"],
    optionalParams: ["days_inactive", "completion_rate", "forum_posts"]
  },
  moodle_performance_risk: {
    category: "predictive_analytics",
    description: "User at risk for poor performance",
    isStandard: false,
    requiredParams: ["risk_level"],
    optionalParams: ["current_grade", "grade_trend", "failed_assessments"]
  },
  moodle_behavior_risk: {
    category: "predictive_analytics",
    description: "Unusual behavior detected",
    isStandard: false,
    requiredParams: ["anomaly_type"],
    optionalParams: ["severity", "description"]
  },
  moodle_competency_progress: {
    category: "learning_analytics",
    description: "Competency proficiency updated",
    isStandard: false,
    requiredParams: ["competency_id"],
    optionalParams: ["proficiency_level", "progress_percent"]
  },
  moodle_competency_achieved: {
    category: "learning_analytics",
    description: "User achieves a competency",
    isStandard: false,
    requiredParams: ["competency_id"],
    optionalParams: ["competency_name", "achievement_date"]
  },
  moodle_badge_earned: {
    category: "learning_analytics",
    description: "User earns a badge",
    isStandard: false,
    requiredParams: ["badge_id"],
    optionalParams: ["badge_name", "criteria_met", "earned_date"]
  }
};

/**
 * Social Platform Events (BuddyBoss)
 */
export const SOCIAL_PLATFORM_EVENTS = {
  buddyboss_profile_viewed: {
    category: "social",
    description: "User views a profile",
    isStandard: false,
    requiredParams: ["profile_user_id"],
    optionalParams: ["profile_user_name", "viewer_role"]
  },
  buddyboss_profile_updated: {
    category: "social",
    description: "User updates their profile",
    isStandard: false,
    requiredParams: [],
    optionalParams: ["completion_percentage", "updated_fields"]
  },
  buddyboss_profile_completion: {
    category: "social",
    description: "Profile completion percentage changes",
    isStandard: false,
    requiredParams: ["completion_percentage"],
    optionalParams: ["completed_fields", "total_fields"]
  },
  buddyboss_group_joined: {
    category: "social",
    description: "User joins a group",
    isStandard: false,
    requiredParams: ["group_id"],
    optionalParams: ["group_name", "group_type", "group_privacy"]
  },
  buddyboss_group_left: {
    category: "social",
    description: "User leaves a group",
    isStandard: false,
    requiredParams: ["group_id"],
    optionalParams: ["group_name", "membership_duration_days"]
  },
  buddyboss_group_post_created: {
    category: "social",
    description: "User creates a group post",
    isStandard: false,
    requiredParams: ["group_id"],
    optionalParams: ["post_type", "has_media", "attachment_count"]
  },
  buddyboss_activity_posted: {
    category: "social",
    description: "User posts activity/update",
    isStandard: false,
    requiredParams: [],
    optionalParams: ["activity_type", "contains_mention", "contains_media"]
  },
  buddyboss_activity_reacted: {
    category: "social",
    description: "User reacts/likes activity",
    isStandard: false,
    requiredParams: ["activity_id", "reaction_type"],
    optionalParams: ["activity_type"]
  },
  buddyboss_activity_commented: {
    category: "social",
    description: "User comments on activity",
    isStandard: false,
    requiredParams: ["activity_id"],
    optionalParams: ["activity_type", "comment_length_chars"]
  },
  buddyboss_message_sent: {
    category: "social",
    description: "User sends private message",
    isStandard: false,
    requiredParams: [],
    optionalParams: ["recipient_user_id", "message_length_chars", "is_group_message", "participant_count"]
  },
  buddyboss_message_thread_viewed: {
    category: "social",
    description: "User views message thread",
    isStandard: false,
    requiredParams: [],
    optionalParams: ["time_spent_seconds", "thread_type"]
  },
  buddyboss_connection_requested: {
    category: "social",
    description: "User requests connection/friendship",
    isStandard: false,
    requiredParams: ["target_user_id"],
    optionalParams: ["target_user_name", "direction"]
  },
  buddyboss_connection_accepted: {
    category: "social",
    description: "User accepts connection request",
    isStandard: false,
    requiredParams: ["connected_user_id"],
    optionalParams: ["total_connections"]
  },
  buddyboss_session_summary: {
    category: "social",
    description: "Summary of user's BuddyBoss session",
    isStandard: false,
    requiredParams: ["session_duration_seconds"],
    optionalParams: ["profiles_viewed", "groups_interacted", "messages_sent"]
  }
};

/**
 * EVENT_CATEGORIES for semantic grouping
 * Used for filtering and reporting
 */
export const EVENT_CATEGORIES = {
  user_lifecycle: "User Lifecycle Events",
  engagement: "Engagement Events",
  search: "Search Events",
  video: "Video Events",
  ecommerce: "Ecommerce Events",
  forms: "Form Events",
  web_vitals: "Web Vitals & Performance",
  learning: "Learning Platform Events",
  learning_analytics: "Learning Analytics (Advanced)",
  predictive_analytics: "Predictive Risk Analytics",
  social: "Social Platform Events"
};

/**
 * Flat map of ALL events for easy lookup
 */
export const ALL_EVENTS = {
  ...GA4_STANDARD_EVENTS,
  ...LEARNING_PLATFORM_EVENTS,
  ...SOCIAL_PLATFORM_EVENTS
};

/**
 * Get event definition by name
 * @param {string} eventName
 * @returns {Object|null} Event definition or null
 */
export function getEventDefinition(eventName) {
  return ALL_EVENTS[eventName] || null;
}

/**
 * Check if event is GA4 standard
 * @param {string} eventName
 * @returns {boolean}
 */
export function isGA4StandardEvent(eventName) {
  const event = ALL_EVENTS[eventName];
  return event ? event.isStandard === true : false;
}

/**
 * Get all events in a category
 * @param {string} category
 * @returns {Object} Events in that category
 */
export function getEventsByCategory(category) {
  const result = {};
  Object.entries(ALL_EVENTS).forEach(([name, def]) => {
    if (def.category === category) {
      result[name] = def;
    }
  });
  return result;
}

/**
 * Get all categories
 * @returns {Array} List of category names
 */
export function getAllCategories() {
  return Object.keys(EVENT_CATEGORIES);
}
