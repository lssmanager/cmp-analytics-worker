/**
 * zarasConfiguration.js - Zaraz Triggers, Variables & GA4 Auto-Send Configuration
 *
 * This configuration automatically maps all worker events to Zaraz and GA4.
 * Deploy to Cloudflare Zaraz dashboard or use as reference for manual setup.
 *
 * Zaraz automatically sends to GA4 when triggered with GA4 event names.
 * No additional GA4_API_SECRET needed - Zaraz handles authentication.
 */

/**
 * ZARAZ VARIABLES
 * Maps incoming event data to reusable variables
 */
export const ZARAZ_VARIABLES = {
  // ═══════════════════════════════════════════════════════════
  // EVENT-LEVEL VARIABLES
  // ═══════════════════════════════════════════════════════════

  event_name: {
    type: "variable",
    category: "event",
    description: "Event name from worker",
    code: `return event.detail?.type || event.detail?.eventName || 'unknown_event'`
  },

  session_id: {
    type: "variable",
    category: "session",
    description: "Session ID (from sessionStorage or generated)",
    code: `
      var sid = sessionStorage.getItem("cmp_session_id");
      if (!sid) {
        sid = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem("cmp_session_id", sid);
      }
      return sid;
    `
  },

  user_id: {
    type: "variable",
    category: "user",
    description: "User ID from cookie or context",
    code: `
      var match = document.cookie.match(new RegExp("(^|;\\\\s*)(cmp_user_id)=([^;]*)"));
      return match ? decodeURIComponent(match[3]) : null;
    `
  },

  timestamp_micros: {
    type: "variable",
    category: "time",
    description: "Timestamp in microseconds for GA4",
    code: `return Date.now() * 1000;`
  },

  engagement_time_msec: {
    type: "variable",
    category: "engagement",
    description: "Engagement time in milliseconds",
    code: `return event.detail?.engagement_time_msec || 100;`
  },

  // ═══════════════════════════════════════════════════════════
  // DEVICE & BROWSER VARIABLES
  // ═══════════════════════════════════════════════════════════

  browser: {
    type: "variable",
    category: "device",
    description: "Browser name",
    code: `
      var ua = navigator.userAgent.toLowerCase();
      return ua.includes("firefox") ? "firefox" : ua.includes("edg") ? "edge"
             : ua.includes("chrome") ? "chrome" : ua.includes("safari") ? "safari" : "other";
    `
  },

  operating_system: {
    type: "variable",
    category: "device",
    description: "Operating system",
    code: `
      var ua = navigator.userAgent.toLowerCase();
      return ua.includes("android") ? "android" : (ua.includes("iphone") || ua.includes("ipad")) ? "ios"
             : ua.includes("windows") ? "windows" : ua.includes("mac") ? "macos"
             : ua.includes("linux") ? "linux" : "other";
    `
  },

  device_category: {
    type: "variable",
    category: "device",
    description: "Device type (mobile/tablet/desktop)",
    code: `
      var ua = navigator.userAgent.toLowerCase();
      return (ua.includes("mobile") || ua.includes("iphone")) ? "mobile"
             : (ua.includes("tablet") || ua.includes("ipad")) ? "tablet" : "desktop";
    `
  },

  screen_resolution: {
    type: "variable",
    category: "device",
    description: "Screen resolution",
    code: `return window.screen ? (window.screen.width + "x" + window.screen.height) : null;`
  },

  language: {
    type: "variable",
    category: "device",
    description: "Browser language",
    code: `return navigator.language || document.documentElement.lang || "unknown";`
  },

  // ═══════════════════════════════════════════════════════════
  // PAGE & CAMPAIGN VARIABLES
  // ═══════════════════════════════════════════════════════════

  page_location: {
    type: "variable",
    category: "page",
    description: "Full page URL",
    code: `return location.href;`
  },

  page_path: {
    type: "variable",
    category: "page",
    description: "Page path",
    code: `return location.pathname;`
  },

  page_title: {
    type: "variable",
    category: "page",
    description: "Page title",
    code: `return document.title;`
  },

  page_referrer: {
    type: "variable",
    category: "page",
    description: "Referrer",
    code: `return document.referrer || null;`
  },

  utm_source: {
    type: "variable",
    category: "campaign",
    description: "UTM source",
    code: `return new URLSearchParams(location.search).get("utm_source");`
  },

  utm_medium: {
    type: "variable",
    category: "campaign",
    description: "UTM medium",
    code: `return new URLSearchParams(location.search).get("utm_medium");`
  },

  utm_campaign: {
    type: "variable",
    category: "campaign",
    description: "UTM campaign",
    code: `return new URLSearchParams(location.search).get("utm_campaign");`
  },

  utm_content: {
    type: "variable",
    category: "campaign",
    description: "UTM content",
    code: `return new URLSearchParams(location.search).get("utm_content");`
  },

  utm_term: {
    type: "variable",
    category: "campaign",
    description: "UTM term",
    code: `return new URLSearchParams(location.search).get("utm_term");`
  },

  // ═══════════════════════════════════════════════════════════
  // USER PROPERTIES (GA4 user-level)
  // ═══════════════════════════════════════════════════════════

  user_language: {
    type: "variable",
    category: "user",
    description: "User language preference",
    code: `return document.documentElement.lang || navigator.language || "en";`
  },

  user_country: {
    type: "variable",
    category: "user",
    description: "User country (from Cloudflare CF-IPCountry header via worker)",
    code: `return document.querySelector("[data-user-country]")?.dataset?.userCountry || "unknown";`
  },

  user_segment: {
    type: "variable",
    category: "user",
    description: "User segment (student/customer/community_member/visitor)",
    code: `return document.querySelector("[data-user-segment]")?.dataset?.userSegment || "visitor";`
  },

  subscription_status: {
    type: "variable",
    category: "user",
    description: "Subscription status",
    code: `return document.querySelector("[data-subscription-status]")?.dataset?.subscriptionStatus || "free";`
  },

  // ═══════════════════════════════════════════════════════════
  // ECOMMERCE VARIABLES
  // ═══════════════════════════════════════════════════════════

  item_id: {
    type: "variable",
    category: "ecommerce",
    description: "Item/product ID",
    code: `return event.detail?.item_id || null;`
  },

  item_name: {
    type: "variable",
    category: "ecommerce",
    description: "Item/product name",
    code: `return event.detail?.item_name || null;`
  },

  value: {
    type: "variable",
    category: "ecommerce",
    description: "Event value (price, revenue, etc)",
    code: `return event.detail?.value || null;`
  },

  currency: {
    type: "variable",
    category: "ecommerce",
    description: "Currency (USD, EUR, etc)",
    code: `return event.detail?.currency || "USD";`
  },

  transaction_id: {
    type: "variable",
    category: "ecommerce",
    description: "Transaction/Order ID",
    code: `return event.detail?.transaction_id || null;`
  },

  // ═══════════════════════════════════════════════════════════
  // LEARNING PLATFORM VARIABLES (Moodle)
  // ═══════════════════════════════════════════════════════════

  course_id: {
    type: "variable",
    category: "learning",
    description: "Moodle course ID",
    code: `return event.detail?.course_id || null;`
  },

  course_name: {
    type: "variable",
    category: "learning",
    description: "Moodle course name",
    code: `return event.detail?.course_name || null;`
  },

  quiz_score: {
    type: "variable",
    category: "learning",
    description: "Quiz score/result",
    code: `return event.detail?.score || null;`
  },

  risk_level: {
    type: "variable",
    category: "learning",
    description: "Student risk level (low/medium/high/critical)",
    code: `return event.detail?.risk_level || null;`
  },

  // ═══════════════════════════════════════════════════════════
  // SOCIAL PLATFORM VARIABLES (BuddyBoss)
  // ═══════════════════════════════════════════════════════════

  group_id: {
    type: "variable",
    category: "social",
    description: "BuddyBoss group ID",
    code: `return event.detail?.group_id || null;`
  },

  group_name: {
    type: "variable",
    category: "social",
    description: "BuddyBoss group name",
    code: `return event.detail?.group_name || null;`
  },

  profile_user_id: {
    type: "variable",
    category: "social",
    description: "Viewed profile user ID",
    code: `return event.detail?.profile_user_id || null;`
  },

  activity_type: {
    type: "variable",
    category: "social",
    description: "Activity type (post/comment/reaction)",
    code: `return event.detail?.activity_type || null;`
  }
};

/**
 * ZARAZ TRIGGERS
 * Automatically fire events when specific conditions are met
 */
export const ZARAZ_TRIGGERS = {
  // ═══════════════════════════════════════════════════════════
  // USER LIFECYCLE TRIGGERS
  // ═══════════════════════════════════════════════════════════

  trigger_login: {
    type: "trigger",
    name: "Login Event",
    description: "Fire when user logs in",
    condition: {
      event_type: "login"
    },
    actions: [
      {
        type: "ga4",
        eventName: "login",
        parameters: {
          method: "{{event.detail.method}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_signup: {
    type: "trigger",
    name: "Sign Up Event",
    description: "Fire when user signs up",
    condition: {
      event_type: "sign_up"
    },
    actions: [
      {
        type: "ga4",
        eventName: "sign_up",
        parameters: {
          method: "{{event.detail.method}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_first_visit: {
    type: "trigger",
    name: "First Visit",
    description: "Fire on first visit",
    condition: {
      event_type: "first_visit"
    },
    actions: [
      {
        type: "ga4",
        eventName: "first_visit",
        parameters: {
          page_location: "{{page_location}}",
          page_referrer: "{{page_referrer}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // ENGAGEMENT TRIGGERS
  // ═══════════════════════════════════════════════════════════

  trigger_page_view: {
    type: "trigger",
    name: "Page View",
    description: "Fire on page load",
    condition: {
      event_type: "page_view"
    },
    actions: [
      {
        type: "ga4",
        eventName: "page_view",
        parameters: {
          page_location: "{{page_location}}",
          page_title: "{{page_title}}",
          page_referrer: "{{page_referrer}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_scroll_depth: {
    type: "trigger",
    name: "Scroll Depth",
    description: "Fire on scroll depth milestones (25%, 50%, 75%, 100%)",
    condition: {
      event_type: "scroll_depth"
    },
    actions: [
      {
        type: "ga4",
        eventName: "scroll",
        parameters: {
          scroll_percent: "{{event.detail.scroll_percent}}",
          page_location: "{{page_location}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_click: {
    type: "trigger",
    name: "Click Event",
    description: "Fire on link clicks",
    condition: {
      event_type: "click"
    },
    actions: [
      {
        type: "ga4",
        eventName: "click",
        parameters: {
          link_id: "{{event.detail.link_id}}",
          link_url: "{{event.detail.link_url}}",
          link_text: "{{event.detail.link_text}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_file_download: {
    type: "trigger",
    name: "File Download",
    description: "Fire when file is downloaded",
    condition: {
      event_type: "file_download"
    },
    actions: [
      {
        type: "ga4",
        eventName: "file_download",
        parameters: {
          file_name: "{{event.detail.file_name}}",
          file_extension: "{{event.detail.file_extension}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // WEB VITALS TRIGGERS
  // ═══════════════════════════════════════════════════════════

  trigger_web_vital_lcp: {
    type: "trigger",
    name: "Web Vital: LCP",
    description: "Largest Contentful Paint metric",
    condition: {
      event_type: "web_vital_lcp"
    },
    actions: [
      {
        type: "ga4",
        eventName: "page_view",
        userProperties: {
          metric_lcp: "{{event.detail.metric_value}}"
        },
        parameters: {
          metric_type: "lcp",
          metric_value: "{{event.detail.metric_value}}",
          metric_unit: "{{event.detail.metric_unit}}"
        }
      }
    ]
  },

  trigger_web_vital_fid: {
    type: "trigger",
    name: "Web Vital: FID",
    description: "First Input Delay metric",
    condition: {
      event_type: "web_vital_fid"
    },
    actions: [
      {
        type: "ga4",
        eventName: "page_view",
        userProperties: {
          metric_fid: "{{event.detail.metric_value}}"
        },
        parameters: {
          metric_type: "fid",
          metric_value: "{{event.detail.metric_value}}",
          metric_unit: "{{event.detail.metric_unit}}"
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // ECOMMERCE TRIGGERS
  // ═══════════════════════════════════════════════════════════

  trigger_view_item: {
    type: "trigger",
    name: "View Item",
    description: "User views product/item details",
    condition: {
      event_type: "view_item"
    },
    actions: [
      {
        type: "ga4",
        eventName: "view_item",
        parameters: {
          item_id: "{{item_id}}",
          item_name: "{{item_name}}",
          value: "{{value}}",
          currency: "{{currency}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_add_to_cart: {
    type: "trigger",
    name: "Add to Cart",
    description: "User adds item to cart",
    condition: {
      event_type: "add_to_cart"
    },
    actions: [
      {
        type: "ga4",
        eventName: "add_to_cart",
        parameters: {
          item_id: "{{item_id}}",
          item_name: "{{item_name}}",
          value: "{{value}}",
          currency: "{{currency}}",
          quantity: "{{event.detail.quantity}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_purchase: {
    type: "trigger",
    name: "Purchase",
    description: "User completes purchase",
    condition: {
      event_type: "purchase"
    },
    actions: [
      {
        type: "ga4",
        eventName: "purchase",
        parameters: {
          transaction_id: "{{transaction_id}}",
          value: "{{value}}",
          tax: "{{event.detail.tax}}",
          shipping: "{{event.detail.shipping}}",
          currency: "{{currency}}",
          coupon: "{{event.detail.coupon}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // LEARNING PLATFORM TRIGGERS (Moodle)
  // ═══════════════════════════════════════════════════════════

  trigger_quiz_complete: {
    type: "trigger",
    name: "Quiz Complete",
    description: "User completes quiz in Moodle",
    condition: {
      event_type: "quiz_complete"
    },
    actions: [
      {
        type: "ga4",
        eventName: "quiz_complete",
        parameters: {
          course_id: "{{course_id}}",
          course_name: "{{course_name}}",
          quiz_score: "{{quiz_score}}",
          total_points: "{{event.detail.total_points}}",
          time_spent_seconds: "{{event.detail.time_spent_seconds}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_course_enrollment: {
    type: "trigger",
    name: "Course Enrollment",
    description: "User enrolls in course",
    condition: {
      event_type: "course_enrollment"
    },
    actions: [
      {
        type: "ga4",
        eventName: "course_enrollment",
        parameters: {
          course_id: "{{course_id}}",
          course_name: "{{course_name}}",
          enrollment_type: "{{event.detail.enrollment_type}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_moodle_engagement_risk: {
    type: "trigger",
    name: "Moodle Engagement Risk",
    description: "Student at risk for disengagement",
    condition: {
      event_type: "moodle_engagement_risk"
    },
    actions: [
      {
        type: "ga4",
        eventName: "moodle_engagement_risk",
        parameters: {
          course_id: "{{course_id}}",
          risk_level: "{{risk_level}}",
          days_inactive: "{{event.detail.days_inactive}}",
          completion_rate: "{{event.detail.completion_rate}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // SOCIAL PLATFORM TRIGGERS (BuddyBoss)
  // ═══════════════════════════════════════════════════════════

  trigger_buddyboss_group_joined: {
    type: "trigger",
    name: "BuddyBoss Group Joined",
    description: "User joins a group",
    condition: {
      event_type: "buddyboss_group_joined"
    },
    actions: [
      {
        type: "ga4",
        eventName: "buddyboss_group_joined",
        parameters: {
          group_id: "{{group_id}}",
          group_name: "{{group_name}}",
          group_type: "{{event.detail.group_type}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_buddyboss_profile_viewed: {
    type: "trigger",
    name: "BuddyBoss Profile Viewed",
    description: "User views member profile",
    condition: {
      event_type: "buddyboss_profile_viewed"
    },
    actions: [
      {
        type: "ga4",
        eventName: "buddyboss_profile_viewed",
        parameters: {
          profile_user_id: "{{profile_user_id}}",
          viewer_role: "{{event.detail.viewer_role}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  },

  trigger_buddyboss_activity_posted: {
    type: "trigger",
    name: "BuddyBoss Activity Posted",
    description: "User posts activity/update",
    condition: {
      event_type: "buddyboss_activity_posted"
    },
    actions: [
      {
        type: "ga4",
        eventName: "buddyboss_activity_posted",
        parameters: {
          activity_type: "{{activity_type}}",
          contains_mention: "{{event.detail.contains_mention}}",
          engagement_time_msec: "{{engagement_time_msec}}"
        }
      }
    ]
  }
};

/**
 * ZARAZ TAGS (GA4 Configuration)
 * Maps to your GA4 Measurement ID
 */
export const ZARAZ_TAGS = {
  ga4_tag: {
    type: "tag",
    name: "Google Analytics 4",
    description: "GA4 tag with Measurement Protocol",
    destination: "ga4",
    config: {
      // Cloudflare Zaraz auto-handles authentication
      // Just provide your Measurement ID
      measurementId: "{{GA4_MEASUREMENT_ID}}", // Set in Zaraz dashboard
      sendPageView: true,
      anonymizeIp: false, // Handled by worker layer
      allowGoogleSignals: true,
      allowAdPersonalization: true
    }
  }
};

/**
 * ZARAZ CONFIGURATION OBJECT
 * Complete config for Cloudflare Zaraz dashboard or programmatic setup
 */
export const ZARAZ_CONFIG = {
  version: "2.0",
  workspace: "cmp-analytics-worker",
  description: "Complete GA4 + Zaraz monitoring for multi-platform analytics worker",
  variables: ZARAZ_VARIABLES,
  triggers: ZARAZ_TRIGGERS,
  tags: ZARAZ_TAGS,
  settings: {
    dataLayer: {
      autoCollect: true,
      trackPageView: true,
      trackClicks: true
    },
    privacy: {
      anonymizeIp: false, // Worker handles anonymization
      respectDoNotTrack: false,
      allowCookies: true
    },
    delivery: {
      async: true,
      timeout: 5000
    }
  }
};

export default ZARAZ_CONFIG;
