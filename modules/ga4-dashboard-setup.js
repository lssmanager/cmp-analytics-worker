/**
 * ga4-dashboard-setup.js - GA4 Dashboard Configuration & Templates
 *
 * This module provides pre-built dashboard templates for GA4 to track:
 * - Moodle (E-Learning) metrics
 * - BuddyBoss (Social Community) metrics
 * - WooCommerce (E-Commerce) metrics
 * - User Engagement metrics
 *
 * USAGE:
 * 1. Copy each dashboard configuration below
 * 2. Go to Google Analytics 4 > Dashboards > Create Dashboard
 * 3. Import or manually configure each card using the provided layouts
 */

export const GA4_DASHBOARDS = {
  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD 1: MOODLE LEARNING ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════

  moodleLearningDashboard: {
    title: "Moodle Learning Analytics",
    description: "Track course enrollment, quiz performance, completion rates, and student engagement",

    cards: [
      // Key metrics (top row)
      {
        name: "Active Learners (28 days)",
        type: "scorecard",
        metrics: ["active_users"],
        dimensions: [],
        filters: [
          { field: "platform_type", value: "moodle" },
          { field: "event_name", value: "course_enrollment", matchType: "CONTAINS" }
        ]
      },
      {
        name: "Course Enrollments (28 days)",
        type: "scorecard",
        metrics: ["event_count"],
        dimensions: [],
        filters: [
          { field: "event_name", value: "moodle_course_enrolled" }
        ],
        comparison: {
          type: "PREVIOUS_PERIOD",
          periods: 1
        }
      },
      {
        name: "Quiz Completion Rate",
        type: "scorecard",
        metrics: ["conversion_rate"],
        dimensions: [],
        filters: [
          { field: "event_name", value: "moodle_quiz_complete" }
        ],
        formula: "quiz_complete_events / quiz_start_events * 100"
      },
      {
        name: "Average Course Progress",
        type: "scorecard",
        metrics: ["custom_metric:metric3"], // course_progress_percent
        dimensions: [],
        aggregation: "AVERAGE"
      },

      // Trend charts
      {
        name: "Course Enrollments Over Time",
        type: "line",
        metrics: ["event_count"],
        dimensions: ["date"],
        filters: [
          { field: "event_name", value: "moodle_course_enrolled" }
        ],
        dateRange: "28d"
      },
      {
        name: "Quiz Performance by Course",
        type: "bar",
        metrics: ["custom_metric:metric4"], // quiz_average_score
        dimensions: ["custom_dimension:dimension3"], // course_id
        filters: [
          { field: "event_name", value: "moodle_quiz_complete" }
        ],
        sorting: "DESC",
        limit: 10
      },

      // Engagement table
      {
        name: "User Role Activity Distribution",
        type: "table",
        metrics: ["active_users", "event_count"],
        dimensions: ["custom_dimension:dimension2"], // moodle_user_role
        filters: [
          { field: "platform_type", value: "moodle" }
        ]
      },
      {
        name: "Course Completion Status",
        type: "pie",
        metrics: ["users"],
        dimensions: ["custom_dimension:dimension5"], // enrollment_status
        filters: [
          { field: "platform_type", value: "moodle" }
        ]
      },

      // Risk indicators
      {
        name: "Students at Risk (Low Engagement)",
        type: "table",
        eventName: "moodle_engagement_risk",
        metrics: ["event_count"],
        dimensions: ["event_param:risk_level"],
        filters: [
          { field: "event_param:risk_type", value: "engagement" }
        ]
      },
      {
        name: "Assignment Submission Rate",
        type: "line",
        metrics: ["conversion_rate"],
        dimensions: ["date"],
        filters: [
          { field: "event_name", value: "moodle_assignment_submitted" }
        ],
        formula: "assignment_submitted_events / assignment_viewed_events * 100"
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD 2: BUDDYBOSS SOCIAL COMMUNITY ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════

  buddyBossDashboard: {
    title: "BuddyBoss Community Engagement",
    description: "Track forum activity, group participation, member interactions, and gamification",

    cards: [
      // Overall engagement metrics
      {
        name: "Active Community Members (28 days)",
        type: "scorecard",
        metrics: ["active_users"],
        filters: [
          { field: "event_name", value: "bp_", matchType: "STARTS_WITH" }
        ]
      },
      {
        name: "Total Forum Posts",
        type: "scorecard",
        metrics: ["event_count"],
        filters: [
          { field: "event_name", value: "bp_forum_reply_created" }
        ]
      },
      {
        name: "Avg Posts per User",
        type: "scorecard",
        metrics: ["event_count"],
        formula: "forum_post_count / active_community_users"
      },
      {
        name: "Group Engagement",
        type: "scorecard",
        metrics: ["event_count"],
        filters: [
          { field: "event_name", value: "bp_group_joined" }
        ]
      },

      // Forum activity
      {
        name: "Forum Activity Over Time",
        type: "line",
        metrics: ["event_count"],
        dimensions: ["date"],
        filters: [
          { field: "event_name", value: "bp_forum_", matchType: "STARTS_WITH" }
        ],
        breakdownBy: [
          { dimension: "event_name", limit: 3 }
        ]
      },
      {
        name: "Most Active Forums",
        type: "bar",
        metrics: ["event_count"],
        dimensions: ["event_param:forum_id"],
        filters: [
          { field: "event_name", value: "bp_forum_viewed" }
        ],
        limit: 10
      },

      // Group performance
      {
        name: "Group Membership Growth",
        type: "area",
        metrics: ["event_count"],
        dimensions: ["date"],
        filters: [
          { field: "event_name", value: "bp_group_joined" }
        ]
      },
      {
        name: "Top Groups by Activity",
        type: "table",
        metrics: ["event_count"],
        dimensions: ["event_param:group_name"],
        filters: [
          { field: "event_name", value: "bp_group_", matchType: "STARTS_WITH" }
        ],
        sorting: "DESC",
        limit: 10
      },

      // Gamification
      {
        name: "Achievements Unlocked by Type",
        type: "bar",
        metrics: ["event_count"],
        dimensions: ["event_param:achievement_title"],
        filters: [
          { field: "event_name", value: "gp_achievement_unlocked" }
        ],
        limit: 10
      },
      {
        name: "Rank Progression",
        type: "table",
        metrics: ["event_count"],
        dimensions: ["event_param:rank_title"],
        filters: [
          { field: "event_name", value: "gp_rank_achieved" }
        ]
      },

      // Member interaction
      {
        name: "Member Following Activity",
        type: "line",
        metrics: ["event_count"],
        dimensions: ["date"],
        filters: [
          { field: "event_name", value: "bp_member_followed" }
        ]
      },
      {
        name: "Activity Stream Engagement",
        type: "pie",
        metrics: ["event_count"],
        dimensions: ["event_param:activity_type"],
        filters: [
          { field: "event_name", value: "bp_activity_posted" }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD 3: E-COMMERCE FUNNEL & REVENUE
  // ═══════════════════════════════════════════════════════════════════════

  ecommerceDashboard: {
    title: "E-Commerce Sales & Funnel",
    description: "Track product views, cart conversions, purchases, AOV, and revenue",

    cards: [
      // Key revenue metrics
      {
        name: "Total Revenue (28 days)",
        type: "scorecard",
        metrics: ["purchase_revenue"],
        currency: "USD"
      },
      {
        name: "Conversion Rate",
        type: "scorecard",
        metrics: ["conversion_rate"],
        formula: "purchase_events / view_item_events * 100",
        suffix: "%"
      },
      {
        name: "Average Order Value",
        type: "scorecard",
        metrics: ["purchase_revenue"],
        formula: "total_revenue / purchase_count",
        currency: "USD"
      },
      {
        name: "Orders",
        type: "scorecard",
        metrics: ["event_count"],
        filters: [
          { field: "event_name", value: "purchase" }
        ]
      },

      // Funnel visualization
      {
        name: "Ecommerce Funnel",
        type: "funnel",
        steps: [
          { name: "Product View", eventName: "view_item" },
          { name: "Add to Cart", eventName: "add_to_cart" },
          { name: "Begin Checkout", eventName: "begin_checkout" },
          { name: "Add Shipping", eventName: "add_shipping_info" },
          { name: "Add Payment", eventName: "add_payment_info" },
          { name: "Purchase", eventName: "purchase" }
        ]
      },

      // Product analysis
      {
        name: "Top Products by Revenue",
        type: "table",
        metrics: ["purchase_revenue"],
        dimensions: ["item_name"],
        filters: [
          { field: "event_name", value: "purchase" }
        ],
        sorting: "DESC",
        limit: 10
      },
      {
        name: "Product Category Performance",
        type: "bar",
        metrics: ["purchase_revenue"],
        dimensions: ["item_category"],
        filters: [
          { field: "event_name", value: "purchase" }
        ]
      },

      // Time series
      {
        name: "Revenue Trend",
        type: "line",
        metrics: ["purchase_revenue"],
        dimensions: ["date"],
        dateRange: "28d"
      },
      {
        name: "Conversion by Device",
        type: "pie",
        metrics: ["event_count"],
        dimensions: ["device_category"],
        filters: [
          { field: "event_name", value: "purchase" }
        ]
      },

      // Cart abandonment
      {
        name: "Cart Abandonment Rate",
        type: "scorecard",
        metrics: ["conversion_rate"],
        formula: "(begin_checkout_events - purchase_events) / begin_checkout_events * 100",
        suffix: "%"
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD 4: USER ENGAGEMENT & PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════

  engagementDashboard: {
    title: "User Engagement & Performance",
    description: "Track engagement metrics, session duration, scroll depth, and page performance",

    cards: [
      // Session metrics
      {
        name: "Sessions",
        type: "scorecard",
        metrics: ["sessions"],
        dateRange: "28d"
      },
      {
        name: "Avg Session Duration",
        type: "scorecard",
        metrics: ["session_duration"],
        suffix: "s"
      },
      {
        name: "Bounce Rate",
        type: "scorecard",
        metrics: ["bounce_rate"],
        suffix: "%"
      },
      {
        name: "Users",
        type: "scorecard",
        metrics: ["active_users"],
        dateRange: "28d"
      },

      // Engagement trends
      {
        name: "Engagement Over Time",
        type: "line",
        metrics: ["engagement_rate"],
        dimensions: ["date"],
        dateRange: "28d"
      },
      {
        name: "Top Pages by Users",
        type: "table",
        metrics: ["active_users", "avg_session_duration"],
        dimensions: ["page_path"],
        sorting: "DESC",
        limit: 10
      },

      // Scroll & interaction
      {
        name: "Scroll Depth Distribution",
        type: "pie",
        metrics: ["event_count"],
        dimensions: ["event_param:scroll_percent"],
        filters: [
          { field: "event_name", value: "user_engagement" }
        ]
      },
      {
        name: "Click Heatmap (by page)",
        type: "table",
        metrics: ["event_count"],
        dimensions: ["page_path", "event_param:click_target"],
        filters: [
          { field: "event_name", value: "click" }
        ],
        limit: 15
      },

      // Core Web Vitals
      {
        name: "Largest Contentful Paint (LCP)",
        type: "line",
        metrics: ["custom_metric"], // lcp_value",
        dimensions: ["date"],
        filters: [
          { field: "event_name", value: "page_error", matchType: "CONTAINS" }
        ]
      },
      {
        name: "Cumulative Layout Shift (CLS)",
        type: "scorecard",
        metrics: ["custom_metric"], //"cls_value"],
        aggregation: "AVERAGE"
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD 5: COMPLIANCE & CONSENT
  // ═══════════════════════════════════════════════════════════════════════

  complianceDashboard: {
    title: "Privacy & Consent Compliance",
    description: "Monitor consent acceptance rates, regional compliance, and data retention",

    cards: [
      // Consent metrics
      {
        name: "Analytics Consent Rate",
        type: "scorecard",
        metrics: ["conversion_rate"],
        formula: "analytics_consent_granted / total_impressions * 100",
        suffix: "%"
      },
      {
        name: "Marketing Consent Rate",
        type: "scorecard",
        metrics: ["conversion_rate"],
        formula: "marketing_consent_granted / total_impressions * 100",
        suffix: "%"
      },
      {
        name: "Banner Impressions",
        type: "scorecard",
        metrics: ["event_count"],
        filters: [
          { field: "event_name", value: "banner_interaction" }
        ]
      },
      {
        name: "Consent by Region",
        type: "table",
        metrics: ["event_count"],
        dimensions: ["custom_dimension:dimension4"], // privacy_region
        filters: [
          { field: "event_name", value: "consent_update" }
        ]
      },

      // Regional breakdown
      {
        name: "Users by Region",
        type: "pie",
        metrics: ["active_users"],
        dimensions: ["custom_dimension:dimension4"] // privacy_region
      },
      {
        name: "Consent Accept vs Deny",
        type: "bar",
        metrics: ["event_count"],
        dimensions: ["event_param:consent_analytics"],
        filters: [
          { field: "event_name", value: "consent_update" }
        ]
      }
    ]
  }
};

/**
 * SETUP INSTRUCTIONS FOR GA4 DASHBOARDS:
 *
 * 1. MANUAL DASHBOARD CREATION:
 *    - Go to Google Analytics > Dashboards > Create Dashboard
 *    - Select "Blank Dashboard"
 *    - Add each card below one at a time
 *
 * 2. FOR EACH CARD:
 *    - Click "Add Widget"
 *    - Select card type (Scorecard, Table, Line Chart, etc.)
 *    - Set Metric: Choose from dropdown (e.g., Active Users, Events)
 *    - Set Dimension: Choose from dropdown (e.g., Date, Page Path)
 *    - Add Filters: Click "Add Filter" for each filter needed
 *    - Configure comparison periods if needed
 *
 * 3. CUSTOM DIMENSIONS (Setup First):
 *    - Admin > Custom Definitions > Custom Dimensions
 *    - Name: "user_segment" → Dimension 1
 *    - Name: "moodle_user_role" → Dimension 2
 *    - Name: "course_id" → Dimension 3
 *    - Name: "privacy_region" → Dimension 4
 *    - Name: "enrollment_status" → Dimension 5
 *    - Name: "platform_type" → Dimension 6
 *    - (Repeat for dimensions 7-10)
 *
 * 4. CUSTOM METRICS:
 *    - Admin > Custom Definitions > Custom Metrics
 *    - Name: "engagement_score" → Metric 1
 *    - Name: "session_duration_seconds" → Metric 2
 *    - Name: "course_progress_percent" → Metric 3
 *    - Name: "quiz_average_score" → Metric 4
 *    - Name: "form_completion_time_seconds" → Metric 5
 *
 * 5. CONVERSIONS:
 *    - Admin > Conversions > Create New Conversion
 *    - Mark these events as conversions:
 *      ☐ purchase
 *      ☐ course_enrollment
 *      ☐ quiz_complete
 *      ☐ lead_generation
 *      ☐ contact_form_submit
 *    - This enables conversion rate calculations
 *
 * 6. SHARE DASHBOARD:
 *    - Click "Share" button
 *    - Select team members or make public
 */

export function getDashboardNames() {
  return Object.keys(GA4_DASHBOARDS).map(key => ({
    id: key,
    name: GA4_DASHBOARDS[key].title,
    cardCount: GA4_DASHBOARDS[key].cards.length
  }));
}

export function getDashboard(dashboardId) {
  return GA4_DASHBOARDS[dashboardId] || null;
}
