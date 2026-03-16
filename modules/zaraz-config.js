/**
 * zaraz-config.js - Zaraz Configuration with GA4 + Google Ads
 *
 * SETUP INSTRUCTIONS:
 * 1. Replace GA4_MEASUREMENT_ID with your actual GA4 property ID (format: G-XXXXXXXXXX)
 * 2. Replace GOOGLE_ADS_CONVERSION_ID with your actual Google Ads account ID (format: AW-XXXXXXXXXX)
 * 3. Replace each CONVERSION_ACTION_ID with your specific conversion IDs for each event type
 *
 * Where to find these:
 * - GA4 Measurement ID: Analytics > Admin > Property > Data Streams > Web > Measurement ID
 * - Google Ads Details: Your Google Ads account > Tools & Settings > Conversions
 */

export const ZARAZ_CONFIG = {
  // ═══════════════════════════════════════════════════════════════════════
  // GOOGLE ANALYTICS 4 CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════

  ga4: {
    measurementId: "G-XXXXXXXXXX", // REPLACE WITH YOUR GA4 MEASUREMENT ID
    apiSecret: "", // Optional: for Measurement Protocol server-side sends

    // Custom dimensions for user segmentation
    customDimensions: {
      "dimension1": "user_segment", // student|customer|instructor|admin
      "dimension2": "moodle_user_role", // student|teacher|admin|manager
      "dimension3": "course_id", // Course ID for learning context
      "dimension4": "privacy_region", // eu|us|ca|global
      "dimension5": "enrollment_status", // active|inactive|completed
      "dimension6": "platform_type", // wordpress|moodle|buddyboss
      "dimension7": "group_id", // User group assignment
      "dimension8": "cohort_id", // User cohort assignment
      "dimension9": "device_category", // mobile|tablet|desktop
      "dimension10": "content_type" // course|product|article|forum
    },

    // Custom metrics for measurement
    customMetrics: {
      "metric1": "engagement_score", // 0-100 scale
      "metric2": "session_duration_seconds",
      "metric3": "course_progress_percent", // 0-100
      "metric4": "quiz_average_score", // 0-100
      "metric5": "form_completion_time_seconds"
    },

    // Settings
    anonymizeIp: true,
    allowGoogleSignals: true, // Set to false if marketing consent denied
    cookieFlags: "SameSite=None;Secure"
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GOOGLE ADS CONVERSION TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  googleAds: {
    customerId: "XXXXXXXXXX", // REPLACE WITH YOUR GOOGLE ADS CUSTOMER ID (without hyphens)
    conversionTrackingId: "AW-XXXXXXXXXX", // REPLACE WITH YOUR CONVERSION TRACKING ID

    // Event-to-Conversion ID Mapping
    conversions: {
      // E-Commerce Conversions
      "purchase": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_PURCHASE", // REPLACE
        valueTrackingEnabled: true,
        currencyCode: "USD"
      },
      "begin_checkout": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_ADD_TO_CART", // REPLACE
        valueTrackingEnabled: false
      },
      "add_to_cart": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_ADD_TO_CART", // REPLACE
        valueTrackingEnabled: false
      },

      // E-Learning Conversions
      "course_enrollment": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_ENROLLMENT", // REPLACE
        valueTrackingEnabled: false
      },
      "course_completed": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_COURSE_COMPLETION", // REPLACE
        valueTrackingEnabled: false
      },
      "quiz_complete": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_QUIZ_COMPLETE", // REPLACE
        valueTrackingEnabled: false
      },

      // Lead Generation Conversions
      "lead_generation": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_LEAD", // REPLACE
        valueTrackingEnabled: false
      },
      "contact_form_submit": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_CONTACT", // REPLACE
        valueTrackingEnabled: false
      },
      "newsletter_signup": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_NEWSLETTER", // REPLACE
        valueTrackingEnabled: false
      },
      "demo_request": {
        conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_DEMO", // REPLACE
        valueTrackingEnabled: false
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT-TO-GA4 PARAMETER MAPPING
  // ═══════════════════════════════════════════════════════════════════════

  eventMappings: {
    // E-Commerce Events (GA4 standard)
    "view_item": {
      ga4EventName: "view_item",
      requiredParams: ["item_id", "item_name", "price", "currency"],
      customParams: ["product_category", "product_brand"],
      googleAdsTracking: false
    },
    "add_to_cart": {
      ga4EventName: "add_to_cart",
      requiredParams: ["item_id", "item_name", "price", "currency", "quantity"],
      customParams: [],
      googleAdsTracking: true
    },
    "purchase": {
      ga4EventName: "purchase",
      requiredParams: ["transaction_id", "value", "currency", "items"],
      customParams: ["shipping_tier", "payment_method", "coupon"],
      googleAdsTracking: true,
      conversionEventOnly: true
    },

    // E-Learning Events (GA4 standard + custom)
    "course_enrollment": {
      ga4EventName: "course_enrollment",
      requiredParams: ["course_id", "course_name"],
      customParams: ["enrollment_type", "user_role", "duration_days"],
      googleAdsTracking: true,
      conversionEventOnly: true
    },
    "lesson_complete": {
      ga4EventName: "lesson_complete",
      requiredParams: ["course_id", "lesson_id"],
      customParams: ["time_spent_seconds", "completion_date"],
      googleAdsTracking: false
    },
    "quiz_complete": {
      ga4EventName: "quiz_complete",
      requiredParams: ["course_id", "quiz_id", "score"],
      customParams: ["passing_score", "time_spent", "attempt_number"],
      googleAdsTracking: true,
      conversionEventOnly: true
    },

    // Form & Lead Events
    "form_submit": {
      ga4EventName: "form_submit",
      requiredParams: ["form_type"],
      customParams: ["form_id", "form_name"],
      googleAdsTracking: false
    },
    "lead_generation": {
      ga4EventName: "lead_generation",
      requiredParams: ["form_type"],
      customParams: ["lead_value"],
      googleAdsTracking: true,
      conversionEventOnly: true
    },

    // Engagement Events
    "user_engagement": {
      ga4EventName: "user_engagement",
      requiredParams: ["engagement_time_msec"],
      customParams: ["scroll_depth", "interaction_count"],
      googleAdsTracking: false
    },
    "page_view": {
      ga4EventName: "page_view",
      requiredParams: ["page_path", "page_title"],
      customParams: ["page_type", "content_id"],
      googleAdsTracking: false
    },

    // Search Events
    "search": {
      ga4EventName: "search",
      requiredParams: ["search_term"],
      customParams: ["search_source", "results_count"],
      googleAdsTracking: false
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CONSENT & REGIONAL COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════

  consentRules: {
    // Events that fire only with analytics consent
    analyticsOnly: [
      "page_view", "scroll", "user_engagement", "session_start",
      "lesson_start", "quiz_start", "assignment_submit", "quiz_complete"
    ],

    // Events that fire only with marketing consent
    marketingOnly: [
      "purchase", "lead_generation", "newsletter_signup", "demo_request"
    ],

    // Events that always fire (necessary/functional only)
    necessary: [
      "page_error", "consent_update", "banner_interaction"
    ],

    // Regional rules
    regions: {
      eu: {
        defaultAnalytics: "denied", // GDPR: deny by default
        requireBanner: true,
        bannerAutoClose: false, // Must require user action
        anonymizeIp: true
      },
      ca: {
        defaultAnalytics: "denied", // CASL: deny by default
        requireBanner: true,
        bannerAutoClose: false, // Must require user action
        anonymizeIp: true
      },
      us: {
        defaultAnalytics: "granted", // CCPA: assume granted
        requireBanner: false, // Banner optional but recommended
        bannerAutoClose: true, // Auto-accept after 10s
        anonymizeIp: true
      },
      global: {
        defaultAnalytics: "granted",
        requireBanner: false,
        bannerAutoClose: true,
        anonymizeIp: false
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ZARAZ TRIGGER CONDITIONS
  // ═══════════════════════════════════════════════════════════════════════

  triggers: {
    // Page view trigger (fires on every page)
    pageView: {
      name: "Page View",
      type: "pageview",
      description: "Fires on every page load"
    },

    // Click trigger (delegated event listener)
    click: {
      name: "Click Event",
      type: "click",
      description: "Fires on click events"
    },

    // Form submission trigger
    formSubmit: {
      name: "Form Submission",
      type: "formsubmit",
      description: "Fires when forms are submitted"
    },

    // Custom event triggers (via dispatchEvent)
    customEvents: {
      "moodle_quiz_complete": "Quiz Completion Tracking",
      "bp_group_joined": "BuddyBoss Group Join",
      "ecommerce_purchase": "E-Commerce Purchase",
      "form_generation": "Lead Form Submission",
      "consent_update": "Consent Update"
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MONITORING & VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  validation: {
    // Check for required parameters in each event
    strictMode: true,

    // Log missing or invalid parameters
    debugLogging: true,

    // Maximum events per minute (prevent spam/errors)
    rateLimiting: {
      enabled: true,
      maxEventsPerMinute: 60
    },

    // Sample rate for high-volume events (0.1 = 10%)
    sampling: {
      "user_engagement": 0.5, // Sample 50% of engagement events
      "scroll": 0.3, // Sample 30% of scroll events
      "click": 0.2 // Sample 20% of click events
    }
  }
};

/**
 * IMPLEMENTATION CHECKLIST:
 *
 * ☐ 1. Get GA4 Measurement ID
 *      - Go to Google Analytics > Admin > Data Streams
 *      - Select your web property > Get Measurement ID
 *      - Format: G-1234567890
 *      - Replace "G-XXXXXXXXXX" in ga4.measurementId above
 *
 * ☐ 2. Setup Google Ads Conversion Tracking
 *      - Go to Google Ads > Tools > Conversions
 *      - Create conversions for: purchase, enrollment, quiz_complete, lead_generation
 *      - Note the Conversion IDs (format: AW-1234567890/conversion_action_id)
 *      - Replace placeholder IDs in googleAds.conversions above
 *
 * ☐ 3. Configure GA4 Custom Dimensions
 *      - Go to GA4 > Admin > Custom Definitions > Custom Dimensions
 *      - Create dimensions for user role, course, group, consent status
 *      - Map dimension names to dimension1-dimension10 above
 *
 * ☐ 4. Test Events in GA4 DebugView
 *      - Go to GA4 > Admin > DebugView
 *      - Visit your site and trigger events
 *      - Events should appear in real-time
 *
 * ☐ 5. Setup E-Commerce for GA4 (if applicable)
 *      - Admin > Data Streams > Configure tag settings
 *      - Enable "Enhanced E-Commerce"
 *
 * ☐ 6. Create Conversion Goals in GA4
 *      - Admin > Conversions > Create new conversion
 *      - Set event names: purchase, course_enrollment, quiz_complete, lead_generation
 *      - Mark as "conversion" to track in reports
 */

// Export helper function to validate config
export function validateZarazConfig() {
  const config = ZARAZ_CONFIG;
  const errors = [];

  if (config.ga4.measurementId === "G-XXXXXXXXXX") {
    errors.push("GA4 Measurement ID not configured");
  }
  if (config.googleAds.customerId === "XXXXXXXXXX") {
    errors.push("Google Ads Customer ID not configured");
  }
  if (config.googleAds.conversionTrackingId === "AW-XXXXXXXXXX") {
    errors.push("Google Ads Conversion Tracking ID not configured");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
