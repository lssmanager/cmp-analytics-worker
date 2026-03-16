/**
 * moodleAdvancedTracker.js - Advanced Moodle Learning Analytics
 *
 * Captures:
 * - Community of Inquiry (CoI) indicators: Cognitive, Social, Teaching presence
 * - Predictive risk signals: Engagement, Performance, Behavior risk
 * - Gradebook data and competency tracking
 * - ML-ready feature vectors for training models
 *
 * Integration: Called from worker.js if platforms.isMoodle
 */

export function buildMoodleAdvancedTrackerScript(endpoint) {
  return `<script>
(function() {
  var EP = ${JSON.stringify(endpoint)};

  if (!EP) return;

  // Fallback si sendBeacon no existe
  function sendAnalytics(payload) {
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        return navigator.sendBeacon(EP, body);
      } else {
        // Fallback no bloqueante
        var xhr = new XMLHttpRequest();
        xhr.open("POST", EP, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(body);
      }
    } catch (err) {
      console && console.warn && console.warn("Analytics send failed", err);
    }
  }

  // ════════════════════════════════════════════════
  // MOODLE CONTEXT + ANALYTICS API INDICATORS
  // ════════════════════════════════════════════════

  function safeText(selector) {
    var el = document.querySelector(selector);
    return el && el.innerText ? el.innerText.trim().slice(0, 255) : null;
  }

  function extractMoodleAnalyticsContext() {
    var ctxEl = document.querySelector("[data-moodle-context]");
    var ctx = {
      // User context
      userId: document.querySelector("[data-user-id]")?.dataset?.userId || null,
      userName: document.querySelector("[data-user-name]")?.dataset?.userName || null,
      userEmail: document.querySelector("[data-user-email]")?.dataset?.userEmail || null,

      // Course context
      courseId: document.querySelector("[data-course-id]")?.dataset?.courseId || null,
      courseName: safeText(".coursename, .course-title") || null,
      courseStartDate: document.querySelector("[data-course-start]")?.dataset?.courseStart || null,
      courseEndDate: document.querySelector("[data-course-end]")?.dataset?.courseEnd || null,

      // Role + permissions
      userRole: document.querySelector("[data-user-role]")?.dataset?.userRole || "student",
      canListInsights: document.querySelector("[data-analytics-permission]")?.dataset?.analyticsPermission === "true",

      // Group + Cohort assignment
      userGroups: (document.querySelector("[data-user-groups]")?.dataset?.userGroups || "")
        .split(",").map(function(x){return x.trim();}).filter(Boolean),
      userCohorts: (document.querySelector("[data-user-cohorts]")?.dataset?.userCohorts || "")
        .split(",").map(function(x){return x.trim();}).filter(Boolean),

      // Enrollment status
      enrollmentStatus: document.querySelector("[data-enrollment-status]")?.dataset?.enrollmentStatus || "active",
      enrollmentDate: document.querySelector("[data-enrollment-date]")?.dataset?.enrollmentDate || null,

      // Extra flags para análisis
      isFrontpage: document.body?.classList.contains("pagelayout-frontpage") || false,
      lang: document.documentElement.lang || "en",
      contextRaw: ctxEl ? ctxEl.dataset : null
    };
    return ctx;
  }

  var moodleCtx = extractMoodleAnalyticsContext();

  // ════════════════════════════════════════════════
  // ANALYTICS API: COGNITIVE, SOCIAL, TEACHING PRESENCE
  // ════════════════════════════════════════════════

  document.addEventListener("moodle_cognitive_presence", function(e) {
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
        course_name: moodleCtx.courseName,
        user_role: moodleCtx.userRole
      }
    });
  });

  document.addEventListener("moodle_social_presence", function(e) {
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

  document.addEventListener("moodle_teaching_presence", function(e) {
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

  // ════════════════════════════════════════════════
  // PREDICTIVE ANALYTICS: STUDENTS AT RISK SIGNALS
  // ════════════════════════════════════════════════

  document.addEventListener("moodle_engagement_risk", function(e) {
    var riskLevel = calculateRiskLevel(e.detail || {});
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

  document.addEventListener("moodle_performance_risk", function(e) {
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

  document.addEventListener("moodle_behavior_risk", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Behavior Risk Signal",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        risk_type: "behavior",
        anomaly_type: e.detail?.type || "unusual_access_pattern",
        severity: e.detail?.severity || "low",
        description: (e.detail?.description || "").slice(0, 200),
        flagged_by: e.detail?.detectionMethod || "rule_based",
        course_id: moodleCtx.courseId
      }
    });
  });

  // ════════════════════════════════════════════════
  // GRADEBOOK DATA TRACKING
  // ════════════════════════════════════════════════

  if (location.pathname.includes("/grade/")) {
    var gradeTable = document.querySelector(".gradetable, table.simple");
    var gradeItems = gradeTable?.querySelectorAll("tr[data-itemid]") || [];

    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Gradebook Viewed",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        view_type: moodleCtx.userRole === "student" ? "student_view" : "instructor_view",
        course_id: moodleCtx.courseId,
        grade_item_count: gradeItems.length,
        user_role: moodleCtx.userRole
      }
    });

    document.querySelectorAll(".grade-category, [data-category-grade]").forEach(function(cat) {
      var catName = cat.getAttribute("data-category-name") || cat.innerText || "Unknown";
      var catGrade = parseFloat(cat.getAttribute("data-category-grade")) || 0;
      var catWeight = parseFloat(cat.getAttribute("data-category-weight")) || 0;

      sendAnalytics({
        type: "moodle_analytics",
        eventName: "Grade Category Performance",
        page: location.pathname,
        sessionId: getCookie("cmp_uid"),
        properties: {
          category_name: catName.trim().slice(0, 150),
          category_grade: catGrade,
          category_weight_percent: catWeight,
          course_id: moodleCtx.courseId
        }
      });
    });
  }

  // ════════════════════════════════════════════════
  // COMPETENCIES & BADGES TRACKING
  // ════════════════════════════════════════════════

  document.addEventListener("moodle_competency_progress", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Competency Progress Updated",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        competency_id: e.detail?.competencyId || "",
        competency_name: (e.detail?.competencyName || "").slice(0, 150),
        proficiency_level: e.detail?.proficiencyLevel || "not_started",
        progress_percent: parseInt(e.detail?.progressPercent) || 0,
        evidence_count: parseInt(e.detail?.evidenceCount) || 0,
        course_id: moodleCtx.courseId
      }
    });
  });

  document.addEventListener("moodle_competency_achieved", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Competency Achieved",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        competency_id: e.detail?.competencyId || "",
        competency_name: (e.detail?.competencyName || "").slice(0, 150),
        achievement_date: Date.now(),
        evidence_used: parseInt(e.detail?.evidenceCount) || 0,
        course_id: moodleCtx.courseId
      }
    });
  });

  document.addEventListener("moodle_badge_earned", function(e) {
    sendAnalytics({
      type: "moodle_analytics",
      eventName: "Badge Earned",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        badge_id: e.detail?.badgeId || "",
        badge_name: (e.detail?.badgeName || "").slice(0, 150),
        badge_criteria_met: parseInt(e.detail?.criteriaMet) || 0,
        badge_criteria_total: parseInt(e.detail?.criteriaTotal) || 0,
        earned_date: Date.now(),
        course_id: moodleCtx.courseId
      }
    });
  });

  // ════════════════════════════════════════════════
  // ADVANCED ENGAGEMENT METRICS FOR ML TRAINING
  // ════════════════════════════════════════════════

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

  document.addEventListener("moodle_activity_interaction", function(e) {
    sessionMetrics.activityCount++;
    sessionMetrics.interactionCount++;
  });

  document.addEventListener("moodle_session_end", function(e) {
    sessionMetrics.timeSpentMs = Date.now() - sessionMetrics.sessionStart;
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

  // ════════════════════════════════════════════════
  // TIME-BASED TRACKING
  // ════════════════════════════════════════════════

  var lastIntervalCheck = Date.now();
  setInterval(function() {
    var now = Date.now();
    var intervalMinutes = Math.round((now - lastIntervalCheck) / 60000);
    if (intervalMinutes >= 5) {
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
  }, 300000);

  // ════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ════════════════════════════════════════════════

  function calculateRiskLevel(data) {
    var score = 0;
    if ((data.daysInactive || 0) > 7) score += 2;
    if ((data.completionRate || 1) < 0.5) score += 2;
    if ((data.forumPosts || 0) === 0) score += 1;
    return score >= 4 ? "critical" : score >= 3 ? "high" : score >= 1 ? "medium" : "low";
  }

  function calculateEngagementScore(metrics) {
    var score = 0;
    score += Math.min(metrics.interactionCount * 5, 30);
    score += Math.min(metrics.timeSpentMs / 60000, 40);
    score += Math.min(metrics.forumPostsCount * 5, 20);
    score += Math.min(metrics.quizzesAttempted * 5, 10);
    return Math.round(Math.min(score, 100));
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^|;\\\\s*)(" + name + ")=([^;]*)"));
    return match ? decodeURIComponent(match[3]) : "";
  }

  // Zaraz session variables
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
</script>`;
}
