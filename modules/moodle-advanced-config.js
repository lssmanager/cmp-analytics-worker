/**
 * moodle-advanced-config.js - Advanced Moodle Analytics Tracking
 * Captures Moodle Analytics API indicators, predictive signals, gradebook data,
 * competencies, and ML model-relevant metrics
 * Integration: lms.learnsocialstudies.com
 */

export function buildMoodleAdvancedTrackerScript() {
  return `<script>
(function() {
  var endpoint = "/__cmp/analytics";
  var IS_INITIALIZED = false;
  var trackerIntervalId = null;
  var trackerListeners = [];

  // Constants for limits and thresholds
  var CONSTANTS = {
    CHECK_INTERVAL_MS: 300000,
    MIN_INTERVAL_MINUTES: 5,
    MS_PER_MINUTE: 60000,
    INACTIVITY_THRESHOLD_DAYS: 7,
    MIN_COMPLETION_RATE: 0.5,
    TEXT_LIMITS: { description: 200, name: 150, full: 255 },
    RISK_SCORES: { inactivity: 2, lowCompletion: 2, noForum: 1 },
    ENGAGEMENT_WEIGHTS: { interaction: [5, 30], timeMin: [1, 40], forum: [5, 20], quiz: [5, 10] },
    MAX_EVENTS: 100
  };

  // Guard against multiple initializations
  if (window.__moodleTrackerInit) return;
  window.__moodleTrackerInit = true;

  // ═══════════════════════════════════════════════════════════════════════
  // SHARED UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  var eventCount = 0;

  function sendAnalytics(payload) {
    try {
      // Rate limiting: prevent event spam
      if (eventCount >= CONSTANTS.MAX_EVENTS) {
        if (window.console) console.warn("[Moodle Analytics] Rate limit exceeded");
        return;
      }
      eventCount++;

      var body = JSON.stringify(payload);
      var success = navigator.sendBeacon(endpoint, body);

      if (!success && window.console) {
        console.warn("[Moodle Analytics] sendBeacon queue full");
      }
    } catch(err) {
      if (window.console) console.warn("[Moodle Analytics] Send failed", err);
    }
  }

  function getCookie(name) {
    // FIX: Corrected regex - was \\\\s (4 backslashes), now \\s (2 backslashes)
    var match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
    return match ? decodeURIComponent(match[3]) : "";
  }

  function registerListener(eventName, handler) {
    document.addEventListener(eventName, handler);
    trackerListeners.push({ event: eventName, handler: handler });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MOODLE CONTEXT + ANALYTICS API INDICATORS
  // ═══════════════════════════════════════════════════════════════════════

  function extractMoodleAnalyticsContext() {
    var ctx = {
      // User context
      userId: document.querySelector("[data-user-id]")?.dataset?.userId || null,
      userName: document.querySelector("[data-user-name]")?.dataset?.userName || null,
      userEmail: document.querySelector("[data-user-email]")?.dataset?.userEmail || null,

      // Course context
      courseId: document.querySelector("[data-course-id]")?.dataset?.courseId || null,
      courseName: document.querySelector(".coursename, .course-title")?.innerText || null,
      courseStartDate: document.querySelector("[data-course-start]")?.dataset?.courseStart || null,
      courseEndDate: document.querySelector("[data-course-end]")?.dataset?.courseEnd || null,

      // Role + permissions
      userRole: document.querySelector("[data-user-role]")?.dataset?.userRole || "student",
      canListInsights: document.querySelector("[data-analytics-permission]")?.dataset?.analyticsPermission === "true",

      // Group + Cohort assignment
      userGroups: (document.querySelector("[data-user-groups]")?.dataset?.userGroups || "").split(",").filter(Boolean),
      userCohorts: (document.querySelector("[data-user-cohorts]")?.dataset?.userCohorts || "").split(",").filter(Boolean),

      // Enrollment status
      enrollmentStatus: document.querySelector("[data-enrollment-status]")?.dataset?.enrollmentStatus || "active",
      enrollmentDate: document.querySelector("[data-enrollment-date]")?.dataset?.enrollmentDate || null
    };
    return ctx;
  }

  var moodleCtx = extractMoodleAnalyticsContext();

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS API: COGNITIVE, SOCIAL, TEACHING PRESENCE INDICATORS
  // These are ML-model inputs for predictive analytics
  // ═══════════════════════════════════════════════════════════════════════

  // Cognitive Presence Indicators (student thinking/learning active)
  registerListener("moodle_cognitive_presence", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Cognitive Presence Detected",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        indicator_type: "cognitive_presence",
        activity_type: e.detail?.activity_type || "quiz",
        time_in_activity: parseInt(e.detail?.timeSpent) || 0,
        interaction_count: parseInt(e.detail?.interactions) || 0,
        depth_of_engagement: e.detail?.engagementLevel || "moderate",
        course_id: moodleCtx.courseId,
        user_role: moodleCtx.userRole
      }
    });
  });

  // Social Presence Indicators (peer interaction, collaboration)
  registerListener("moodle_social_presence", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Social Presence Detected",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        indicator_type: "social_presence",
        interaction_type: e.detail?.type || "forum_discussion",
        peer_count: parseInt(e.detail?.peerCount) || 0,
        interaction_quality: e.detail?.quality || "neutral",
        course_id: moodleCtx.courseId
      }
    });
  });

  // Teaching Presence Indicators (instructor guidance, feedback)
  registerListener("moodle_teaching_presence", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Teaching Presence Detected",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        indicator_type: "teaching_presence",
        interaction_type: e.detail?.type || "feedback",
        instructor_id: e.detail?.instructorId || null,
        response_time_hours: parseInt(e.detail?.responseTime) || 0,
        course_id: moodleCtx.courseId
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PREDICTIVE ANALYTICS: STUDENTS AT RISK SIGNALS
  // ═══════════════════════════════════════════════════════════════════════

  // Engagement Risk Indicator
  registerListener("moodle_engagement_risk", function(e) {
    var riskLevel = calculateRiskLevel(e.detail);
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Engagement Risk Signal",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        risk_type: "engagement",
        risk_level: riskLevel,
        days_inactive: parseInt(e.detail?.daysInactive) || 0,
        assignment_completion_rate: parseFloat(e.detail?.completionRate) || 0,
        forum_participation_count: parseInt(e.detail?.forumPosts) || 0,
        course_id: moodleCtx.courseId,
        threshold_exceeded: riskLevel !== "low"
      }
    });
  });

  // Performance Risk Indicator (grades trending down)
  registerListener("moodle_performance_risk", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Performance Risk Signal",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        risk_type: "performance",
        current_grade: parseFloat(e.detail?.currentGrade) || 0,
        grade_trend: e.detail?.trend || "stable",
        failed_assessments: parseInt(e.detail?.failedCount) || 0,
        average_quiz_score: parseFloat(e.detail?.avgQuizScore) || 0,
        passing_threshold: parseFloat(e.detail?.passingGrade) || 50,
        course_id: moodleCtx.courseId
      }
    });
  });

  // Behavior Risk Indicator (unusual patterns)
  registerListener("moodle_behavior_risk", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Behavior Risk Signal",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        risk_type: "behavior",
        anomaly_type: e.detail?.type || "unusual_access_pattern",
        severity: e.detail?.severity || "low",
        description: (e.detail?.description || "").slice(0, CONSTANTS.TEXT_LIMITS.description),
        flagged_by: e.detail?.detectionMethod || "rule_based",
        course_id: moodleCtx.courseId
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GRADEBOOK DATA TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  if (location.pathname.includes("/grade/")) {
    var gradeTable = document.querySelector(".gradetable, table.simple");
    var gradeItems = gradeTable?.querySelectorAll("tr[data-itemid]") || [];

    // Collect all grade categories and batch into one beacon (fix N+1 issue)
    var categories = [];
    document.querySelectorAll(".grade-category, [data-category-grade]").forEach(function(cat) {
      var catName = cat.getAttribute("data-category-name") || cat.innerText || "Unknown";
      var catGrade = parseFloat(cat.getAttribute("data-category-grade")) || 0;
      var catWeight = parseFloat(cat.getAttribute("data-category-weight")) || 0;
      categories.push({
        name: catName.slice(0, CONSTANTS.TEXT_LIMITS.name),
        grade: catGrade,
        weight: catWeight
      });
    });

    // Send single batch beacon instead of N individual beacons
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Gradebook Viewed",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        view_type: moodleCtx.userRole === "student" ? "student_view" : "instructor_view",
        course_id: moodleCtx.courseId,
        grade_item_count: gradeItems.length,
        category_count: categories.length,
        categories: categories,
        user_role: moodleCtx.userRole
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPETENCIES & BADGES TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  registerListener("moodle_competency_progress", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Competency Progress Updated",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        competency_id: e.detail?.competencyId || "",
        competency_name: (e.detail?.competencyName || "").slice(0, CONSTANTS.TEXT_LIMITS.name),
        proficiency_level: e.detail?.proficiencyLevel || "not_started",
        progress_percent: parseInt(e.detail?.progressPercent) || 0,
        evidence_count: parseInt(e.detail?.evidenceCount) || 0,
        course_id: moodleCtx.courseId
      }
    });
  });

  registerListener("moodle_competency_achieved", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Competency Achieved",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        competency_id: e.detail?.competencyId || "",
        competency_name: (e.detail?.competencyName || "").slice(0, CONSTANTS.TEXT_LIMITS.name),
        achievement_date: Date.now(),
        evidence_used: parseInt(e.detail?.evidenceCount) || 0,
        course_id: moodleCtx.courseId
      }
    });
  });

  registerListener("moodle_badge_earned", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Badge Earned",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        badge_id: e.detail?.badgeId || "",
        badge_name: (e.detail?.badgeName || "").slice(0, CONSTANTS.TEXT_LIMITS.name),
        badge_criteria_met: parseInt(e.detail?.criteriaMet) || 0,
        badge_criteria_total: parseInt(e.detail?.criteriaTotal) || 0,
        earned_date: Date.now(),
        course_id: moodleCtx.courseId
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ADVANCED ENGAGEMENT METRICS FOR ML TRAINING
  // Minimum 10 data points per student for ML models to be effective
  // ═══════════════════════════════════════════════════════════════════════

  // Session quality metrics (for training ML models)
  var sessionMetrics = {
    sessionStart: Date.now(),
    activityCount: 0,
    interactionCount: 0,
    timeSpentMs: 0,
    scrollDepthPercent: 0,
    focusCount: 0,
    forumPostsCount: 0,
    assignmentsStarted: 0,
    quizzesAttempted: 0
  };

  // Global activity tracker
  registerListener("moodle_activity_interaction", function(e) {
    sessionMetrics.activityCount++;
    sessionMetrics.interactionCount++;
  });

  registerListener("moodle_session_end", function(e) {
    sessionMetrics.timeSpentMs = Date.now() - sessionMetrics.sessionStart;

    // Only send if we have meaningful engagement (at least 1 activity)
    if (sessionMetrics.activityCount > 0) {
      sendAnalytics({
        type: "moodle_analytics",
        eventName: "Session Engagement Summary",
        page: location.pathname,
        sessionId: getCookie("cmp_uid"),
        properties: {
          session_duration_seconds: Math.round(sessionMetrics.timeSpentMs / 1000),
          activity_count: sessionMetrics.activityCount,
          interaction_count: sessionMetrics.interactionCount,
          forum_posts: sessionMetrics.forumPostsCount,
          assignments_started: sessionMetrics.assignmentsStarted,
          quizzes_attempted: sessionMetrics.quizzesAttempted,
          engagement_score: calculateEngagementScore(sessionMetrics),
          course_id: moodleCtx.courseId,
          user_role: moodleCtx.userRole
        }
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TIME-BASED TRACKING FOR ANALYTICS API
  // ═══════════════════════════════════════════════════════════════════════

  // Interval-based metrics (tracks data at fixed time intervals)
  var lastIntervalCheck = Date.now();
  trackerIntervalId = setInterval(function() {
    var now = Date.now();
    var intervalMinutes = Math.round((now - lastIntervalCheck) / CONSTANTS.MS_PER_MINUTE);

    // Only report if interval >= MIN_INTERVAL_MINUTES (avoid spam)
    if (intervalMinutes >= CONSTANTS.MIN_INTERVAL_MINUTES) {
      sendAnalytics({
        type: "moodle_analytics",
        eventName: "Interval Learning Metrics",
        page: location.pathname,
        sessionId: getCookie("cmp_uid"),
        properties: {
          interval_minutes: intervalMinutes,
          metric_type: "time_interval",
          course_id: moodleCtx.courseId,
          timestamp: now
        }
      });
      lastIntervalCheck = now;
    }
  }, CONSTANTS.CHECK_INTERVAL_MS);

  // Cleanup on page unload (prevent memory leaks)
  window.addEventListener("beforeunload", function() {
    if (trackerIntervalId) clearInterval(trackerIntervalId);
    trackerListeners.forEach(function(item) {
      document.removeEventListener(item.event, item.handler);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  function calculateRiskLevel(data) {
    var score = 0;
    if ((data.daysInactive || 0) > CONSTANTS.INACTIVITY_THRESHOLD_DAYS) score += CONSTANTS.RISK_SCORES.inactivity;
    if ((data.completionRate || 1) < CONSTANTS.MIN_COMPLETION_RATE) score += CONSTANTS.RISK_SCORES.lowCompletion;
    if ((data.forumPosts || 0) === 0) score += CONSTANTS.RISK_SCORES.noForum;
    return score >= 4 ? "critical" : score >= 3 ? "high" : score >= 1 ? "medium" : "low";
  }

  function calculateEngagementScore(metrics) {
    // Scale 0-100 based on multiple factors using CONSTANTS
    var score = 0;
    var w = CONSTANTS.ENGAGEMENT_WEIGHTS;
    score += Math.min(metrics.interactionCount * w.interaction[0], w.interaction[1]);
    score += Math.min(metrics.timeSpentMs / CONSTANTS.MS_PER_MINUTE, w.timeMin[1]);
    score += Math.min(metrics.forumPostsCount * w.forum[0], w.forum[1]);
    score += Math.min(metrics.quizzesAttempted * w.quiz[0], w.quiz[1]);
    return Math.round(Math.min(score, 100));
  }

  // Note: removed duplicate getCookie() - see sendAnalytics() for the single implementation

  // Set global Zaraz variables for Moodle advanced analytics
  if (window.zaraz && moodleCtx.courseId) {
    zaraz.set("moodle_user_role", moodleCtx.userRole, { scope: "session" });
    zaraz.set("moodle_course_id", moodleCtx.courseId, { scope: "session" });
    zaraz.set("moodle_enrollment_status", moodleCtx.enrollmentStatus, { scope: "session" });
    zaraz.set("moodle_can_view_analytics", moodleCtx.canListInsights ? "true" : "false", { scope: "session" });
    if (moodleCtx.userGroups?.length) {
      zaraz.set("moodle_groups", moodleCtx.userGroups.join(","), { scope: "session" });
    }
    if (moodleCtx.userCohorts?.length) {
      zaraz.set("moodle_cohorts", moodleCtx.userCohorts.join(","), { scope: "session" });
    }
  }

})();
</script>\`
}
// FIN DEL SCRIPT INLINE
})();
</script>`;
}
