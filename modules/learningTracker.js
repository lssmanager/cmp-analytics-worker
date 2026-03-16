/**
 * learningTracker.js - E-Learning Event Detection & Tracking
 * Detects Moodle/LMS activity via page type detection + native event listeners
 * Hybrid approach: DOM parsing + event delegation
 */

export function buildLearningTrackerScript() {
  return `<script>
(function() {
  var analytics_endpoint = "/__cmp/analytics";
  var learning_context = {};

  // ═══════════════════════════════════════════════════════════════════════
  // MOODLE PAGE TYPE DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  function detectLearningPage() {
    var pathname = location.pathname;
    var search = location.search;

    // Course page
    if (pathname.includes("/course/view.php")) {
      var courseId = new URLSearchParams(search).get("id");
      var courseName = document.querySelector(".page-title, .coursename, h1");
      return {
        type: "course",
        page_type: "course",
        id: courseId,
        name: courseName?.innerText || "",
        page_path: pathname + search
      };
    }

    // Lesson page
    if (pathname.includes("/mod/lesson/view.php")) {
      var lessonId = new URLSearchParams(search).get("id");
      var lessonName = document.querySelector(".page-title, .lessonname, h2");
      return {
        type: "lesson",
        page_type: "lesson",
        id: lessonId,
        name: lessonName?.innerText || "",
        page_path: pathname + search
      };
    }

    // Quiz attempt
    if (pathname.includes("/mod/quiz/attempt.php")) {
      var attemptId = new URLSearchParams(search).get("attempt");
      var quizId = new URLSearchParams(search).get("cmid");
      var quizName = document.querySelector(".page-title, .quizname, h2");
      return {
        type: "quiz_attempt",
        page_type: "quiz",
        quiz_id: quizId,
        attempt_id: attemptId,
        name: quizName?.innerText || "",
        page_path: pathname + search
      };
    }

    // Quiz view
    if (pathname.includes("/mod/quiz/view.php")) {
      var quizId = new URLSearchParams(search).get("id");
      var quizName = document.querySelector(".page-title, .quizname, h2");
      return {
        type: "quiz",
        page_type: "quiz",
        id: quizId,
        name: quizName?.innerText || "",
        page_path: pathname + search
      };
    }

    // Assignment
    if (pathname.includes("/mod/assign/view.php")) {
      var assignmentId = new URLSearchParams(search).get("id");
      var assignmentName = document.querySelector(".page-title, .assignmentname, h2");
      return {
        type: "assignment",
        page_type: "assignment",
        id: assignmentId,
        name: assignmentName?.innerText || "",
        page_path: pathname + search
      };
    }

    // Forum
    if (pathname.includes("/mod/forum/view.php")) {
      var forumId = new URLSearchParams(search).get("id");
      var forumName = document.querySelector(".page-title, .forumname, h2");
      return {
        type: "forum",
        page_type: "forum",
        id: forumId,
        name: forumName?.innerText || "",
        page_path: pathname + search
      };
    }

    // Grades report
    if (pathname.includes("/grade/report")) {
      return {
        type: "grades",
        page_type: "grades",
        id: null,
        name: "Grade Report",
        page_path: pathname
      };
    }

    // User profile
    if (pathname.includes("/user/profile.php")) {
      var userId = new URLSearchParams(search).get("id");
      return {
        type: "profile",
        page_type: "profile",
        id: userId,
        name: "User Profile",
        page_path: pathname
      };
    }

    // Dashboard / Home
    if (pathname.includes("/my/") || pathname.includes("/dashboard")) {
      return {
        type: "dashboard",
        page_type: "dashboard",
        id: null,
        name: "Dashboard",
        page_path: pathname
      };
    }

    return null;
  }

  learning_context = detectLearningPage();

  // ═══════════════════════════════════════════════════════════════════════
  // MOODLE NATIVE EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════

  // Course enrollment event
  document.addEventListener("courseuserenlisted", function(e) {
    fetch(analytics_endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "course_enrollment",
        eventName: "Course Enrolled",
        page: location.pathname,
        properties: {
          course_id: e.detail?.courseid || (learning_context?.id),
          course_name: e.detail?.coursename || (learning_context?.name),
          enrollment_type: e.detail?.type || "standard"
        }
      })
    }).catch(function() {});
  });

  // Lesson completion
  document.addEventListener("lesson_viewed", function(e) {
    fetch(analytics_endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "lesson_complete",
        eventName: "Lesson Completed",
        page: location.pathname,
        properties: {
          lesson_id: e.detail?.lessonid || (learning_context?.id),
          lesson_name: e.detail?.lessonname || (learning_context?.name),
          course_id: e.detail?.courseid || "",
          duration_seconds: e.detail?.duration || 0
        }
      })
    }).catch(function() {});
  });

  // Quiz submission
  document.addEventListener("quiz_submitted", function(e) {
    var score = e.detail?.score || 0;
    var passingScore = e.detail?.passingScore || 0;

    fetch(analytics_endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "quiz_complete",
        eventName: "Quiz Completed",
        page: location.pathname,
        properties: {
          quiz_id: e.detail?.quizid || (learning_context?.quiz_id),
          quiz_name: e.detail?.quizname || (learning_context?.name),
          score: score,
          passing_score: passingScore,
          attempt_number: e.detail?.attemptNumber || 1
        }
      })
    }).catch(function() {});

    // Also track failure if below passing
    if (score < passingScore) {
      fetch(analytics_endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "quiz_fail",
          eventName: "Quiz Failed",
          page: location.pathname,
          properties: {
            quiz_id: e.detail?.quizid || (learning_context?.quiz_id),
            attempt_number: e.detail?.attemptNumber || 1,
            score: score
          }
        })
      }).catch(function() {});
    }
  });

  // Assignment submission
  document.addEventListener("assignment_submitted", function(e) {
    fetch(analytics_endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "assignment_submit",
        eventName: "Assignment Submitted",
        page: location.pathname,
        properties: {
          assignment_id: e.detail?.assignmentid || (learning_context?.id),
          assignment_name: e.detail?.assignmentname || (learning_context?.name),
          course_id: e.detail?.courseid || "",
          submission_type: e.detail?.type || "text"
        }
      })
    }).catch(function() {});
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LEARNING PAGE START EVENT
  // ═══════════════════════════════════════════════════════════════════════

  if (learning_context) {
    // Track lesson/content start
    if (["lesson", "quiz", "assignment", "forum"].includes(learning_context.type)) {
      fetch(analytics_endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "lesson_start",
          eventName: "Learning Content Viewed",
          page: location.pathname,
          properties: {
            lesson_id: learning_context.id,
            lesson_name: learning_context.name,
            lesson_type: learning_context.type,
            course_id: learning_context.parent_id || ""
          }
        })
      }).catch(function() {});
    }

    // Track enrollment/course view
    if (learning_context.type === "course") {
      fetch(analytics_endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "course_enrollment",
          eventName: "Course Viewed",
          page: location.pathname,
          properties: {
            course_id: learning_context.id,
            course_name: learning_context.name,
            page_path: learning_context.page_path
          }
        })
      }).catch(function() {});
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LESSON COMPLETE DETECTION (DOM Parsing)
  // ═══════════════════════════════════════════════════════════════════════

  // Check if lesson shows "completed" badge or message
  var completedBadge = document.querySelector(".badge-success, .badge-primary, [data-completed], .lesson-completed");
  if (completedBadge && learning_context?.type === "lesson") {
    // Already completed on page load - fire event
    fetch(analytics_endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "lesson_complete",
        eventName: "Lesson Marked Complete",
        page: location.pathname,
        properties: {
          lesson_id: learning_context.id,
          lesson_name: learning_context.name,
          auto_detected: true
        }
      })
    }).catch(function() {});
  }

  // Listen for completion button clicks
  document.querySelectorAll("[data-action='mark-complete'], .btn-mark-complete").forEach(function(btn) {
    btn.addEventListener("click", function() {
      setTimeout(function() {
        fetch(analytics_endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type: "lesson_complete",
            eventName: "Lesson Marked Complete",
            page: location.pathname,
            properties: {
              lesson_id: learning_context?.id || "",
              lesson_name: learning_context?.name || "",
              via_button: true
            }
          })
        }).catch(function() {});
      }, 500);
    }, { once: true });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // COURSE PROGRESS TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // Extract progress percentage from DOM
  var progressBar = document.querySelector(".progress-bar, [role='progressbar']");
  if (progressBar) {
    var progressPercent = parseInt(progressBar.style.width) ||
                         parseInt(progressBar.getAttribute("aria-valuenow")) || 0;

    if (progressPercent > 0) {
      fetch(analytics_endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "course_progress",
          eventName: "Course Progress Updated",
          page: location.pathname,
          properties: {
            course_id: learning_context?.id || "",
            progress_percent: progressPercent
          }
        })
      }).catch(function() {});
    }
  }

})();
</script>`
}
