/**
 * learningTracker.js - Moodle LMS Complete Event Tracking
 * Detects all learning activities: Courses, Quizzes, Assignments, Forums, Grades
 * Tracks enrollment status, roles, groups, cohorts, progress
 * Domain: lms.learnsocialstudies.com
 */

export function buildLearningTrackerScript() {
  return `<script>
(function() {
  // ═══════════════════════════════════════════════════════════════════════
  // MOODLE CONTEXT EXTRACTION
  // ═══════════════════════════════════════════════════════════════════════

  function extractMoodleContext() {
    var context = {
      // Current logged-in user ID
      userId: document.querySelector("[data-user-id], .user-data")?.dataset?.userId || null,
      // Course context
      courseId: document.querySelector("[data-course-id], .course-data")?.dataset?.courseId || null,
      courseName: document.querySelector(".page-header h1, .coursename")?.innerText || null,
      // User role in course
      courseRole: document.querySelector("[data-user-role]")?.dataset?.userRole || "student", // student|teacher|admin|manager
      // Group/Cohort
      groupId: document.querySelector("[data-group-id]")?.dataset?.groupId || null,
      groupName: document.querySelector("[data-group-name]")?.dataset?.groupName || null,
      cohortId: document.querySelector("[data-cohort-id]")?.dataset?.cohortId || null,
      cohortName: document.querySelector("[data-cohort-name]")?.dataset?.cohortName || null,
      // Enrollment status
      enrollmentStatus: document.querySelector("[data-enrollment-status]")?.dataset?.enrollmentStatus || "active"
    };
    return context;
  }

  var moodleCtx = extractMoodleContext();

  // ═══════════════════════════════════════════════════════════════════════
  // COURSE ENROLLMENT & STATUS TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  if (moodleCtx.courseId && location.pathname.includes("/course/view.php")) {
    var progress = document.querySelector(".progress-bar, [role='progressbar']");
    var progressPercent = 0;
    if (progress) {
      progressPercent = parseInt(progress.style.width) || parseInt(progress.getAttribute("aria-valuenow")) || 0;
    }

    zaraz?.track("moodle_course_viewed", {
      course_id: moodleCtx.courseId,
      course_name: moodleCtx.courseName,
      user_role: moodleCtx.courseRole,
      group_id: moodleCtx.groupId,
      group_name: moodleCtx.groupName,
      cohort_id: moodleCtx.cohortId,
      cohort_name: moodleCtx.cohortName,
      enrollment_status: moodleCtx.enrollmentStatus,
      progress_percent: progressPercent,
      page_path: location.pathname
    });
  }

  // Course enrollment event
  document.addEventListener("moodle_course_enrolled", function(e) {
    zaraz?.track("moodle_course_enrolled", {
      course_id: e.detail?.course_id || moodleCtx.courseId,
      course_name: e.detail?.course_name || moodleCtx.courseName,
      enrollment_type: e.detail?.enrollment_type || "standard", // standard|self|manual|guest
      role_assigned: e.detail?.role || "student",
      group_id: e.detail?.group_id || moodleCtx.groupId,
      cohort_id: e.detail?.cohort_id || moodleCtx.cohortId,
      timestamp: Date.now()
    });
  });

  // Course unenrollment
  document.addEventListener("moodle_course_unenrolled", function(e) {
    zaraz?.track("moodle_course_unenrolled", {
      course_id: e.detail?.course_id || moodleCtx.courseId,
      course_name: e.detail?.course_name || moodleCtx.courseName,
      unenroll_reason: e.detail?.reason || "unknown",
      timestamp: Date.now()
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LESSON / ACTIVITY TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // General lesson/activity page detection
  var lessonSelector = [
    "/mod/lesson/view.php",
    "/mod/page/view.php",
    "/mod/resource/view.php",
    "/mod/scorm/view.php"
  ];

  lessonSelector.forEach(function(path) {
    if (location.pathname.includes(path)) {
      var activityTitle = document.querySelector(".activityinstance, .modulename, h1.page-title");
      var activities = document.querySelectorAll(".activities li");

      zaraz?.track("moodle_activity_viewed", {
        activity_path: location.pathname,
        activity_title: activityTitle?.innerText || "Activity",
        activity_type: path.split("/mod/")[1]?.split("/")[0] || "unknown",
        activities_completed: document.querySelectorAll(".activity.completed").length,
        total_activities: activities.length,
        course_id: moodleCtx.courseId,
        user_role: moodleCtx.courseRole
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // QUIZ TRACKING (Detailed)
  // ═══════════════════════════════════════════════════════════════════════

  if (location.pathname.includes("/mod/quiz/")) {
    var quizName = document.querySelector(".quizname, .page-title h1");
    var quizId = new URLSearchParams(location.search).get("id") || new URLSearchParams(location.search).get("cmid");

    // Quiz start
    if (location.pathname.includes("/mod/quiz/view.php")) {
      zaraz?.track("moodle_quiz_viewed", {
        quiz_id: quizId,
        quiz_name: quizName?.innerText || "Quiz",
        course_id: moodleCtx.courseId,
        page_path: location.pathname
      });
    }

    // Quiz attempt (during)
    if (location.pathname.includes("/mod/quiz/attempt.php")) {
      var attemptId = new URLSearchParams(location.search).get("attempt");
      var questionCount = document.querySelectorAll("div.qtext, .question").length;

      zaraz?.track("moodle_quiz_attempt_started", {
        quiz_id: quizId,
        quiz_name: quizName?.innerText || "Quiz",
        attempt_id: attemptId,
        attempt_number: document.querySelector("[data-attempt-num]")?.dataset?.attemptNum || 1,
        total_questions: questionCount,
        course_id: moodleCtx.courseId
      });

      // Listen for quiz submission
      document.addEventListener("moodle_quiz_submitted", function(e) {
        zaraz?.track("moodle_quiz_attempt_submitted", {
          quiz_id: quizId,
          score: e.detail?.score || 0,
          passing_score: e.detail?.passingScore || 0,
          time_spent_seconds: e.detail?.timeSpent || 0,
          correct_answers: e.detail?.correctCount || 0,
          total_questions: questionCount,
          attempt_id: attemptId,
          pass: (e.detail?.score || 0) >= (e.detail?.passingScore || 0)
        });
      }, { once: true });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ASSIGNMENT TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  if (location.pathname.includes("/mod/assign/")) {
    var assignmentName = document.querySelector(".assignmentname, .page-title h1");
    var assignmentId = new URLSearchParams(location.search).get("id");

    // Assignment view
    zaraz?.track("moodle_assignment_viewed", {
      assignment_id: assignmentId,
      assignment_name: assignmentName?.innerText || "Assignment",
      course_id: moodleCtx.courseId,
      due_date: document.querySelector("[data-due-date]")?.dataset?.dueDate || null,
      submission_status: document.querySelector("[data-submission-status]")?.dataset?.submissionStatus || "not_submitted",
      grade: document.querySelector("[data-grade]")?.dataset?.grade || null,
      page_path: location.pathname
    });

    // Assignment submission
    document.addEventListener("moodle_assignment_submitted", function(e) {
      zaraz?.track("moodle_assignment_submitted", {
        assignment_id: assignmentId,
        assignment_name: assignmentName?.innerText || "Assignment",
        submission_type: e.detail?.type || "file", // file|text|onlinetext
        submission_time: Date.now(),
        days_before_deadline: e.detail?.daysBeforeDeadline || 0,
        course_id: moodleCtx.courseId
      });
    });

    // Assignment graded
    document.addEventListener("moodle_assignment_graded", function(e) {
      zaraz?.track("moodle_assignment_graded", {
        assignment_id: assignmentId,
        assignment_name: assignmentName?.innerText || "Assignment",
        grade: e.detail?.grade || 0,
        max_grade: e.detail?.maxGrade || 100,
        feedback_provided: Boolean(e.detail?.feedback),
        grading_date: Date.now()
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FORUM TRACKING (Moodle Forums)
  // ═══════════════════════════════════════════════════════════════════════

  if (location.pathname.includes("/mod/forum/")) {
    var forumName = document.querySelector(".forumname, .page-title h1");
    var forumId = new URLSearchParams(location.search).get("id");

    // Forum view
    zaraz?.track("moodle_forum_viewed", {
      forum_id: forumId,
      forum_name: forumName?.innerText || "Forum",
      forum_type: document.querySelector("[data-forum-type]")?.dataset?.forumType || "general",
      course_id: moodleCtx.courseId,
      thread_count: document.querySelectorAll(".forum-thread").length,
      page_path: location.pathname
    });

    // Forum discussion creation
    document.addEventListener("moodle_forum_discussion_created", function(e) {
      zaraz?.track("moodle_forum_discussion_created", {
        forum_id: forumId,
        discussion_id: e.detail?.discussion_id || "",
        discussion_title: e.detail?.title || "",
        course_id: moodleCtx.courseId
      });
    });

    // Forum post/reply
    document.addEventListener("moodle_forum_post_created", function(e) {
      zaraz?.track("moodle_forum_post_created", {
        forum_id: forumId,
        discussion_id: e.detail?.discussion_id || "",
        post_id: e.detail?.post_id || "",
        post_length: e.detail?.content?.length || 0,
        is_reply: Boolean(e.detail?.parent_id),
        course_id: moodleCtx.courseId
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GRADE TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  if (location.pathname.includes("/grade/")) {
    zaraz?.track("moodle_grades_viewed", {
      user_role: moodleCtx.courseRole,
      course_id: moodleCtx.courseId,
      page_path: location.pathname,
      grade_count: document.querySelectorAll("tr[data-itemid]").length
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPLETION TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // Activity/Lesson completion
  document.addEventListener("moodle_activity_completed", function(e) {
    zaraz?.track("moodle_activity_completed", {
      activity_id: e.detail?.activity_id || "",
      activity_type: e.detail?.activity_type || "unknown", // lesson|quiz|assignment|forum|page
      activity_name: e.detail?.activity_name || "",
      course_id: moodleCtx.courseId,
      time_spent_seconds: e.detail?.timeSpent || 0,
      completion_date: Date.now()
    });
  });

  // Course completion
  document.addEventListener("moodle_course_completed", function(e) {
    zaraz?.track("moodle_course_completed", {
      course_id: moodleCtx.courseId,
      course_name: moodleCtx.courseName,
      total_time_seconds: e.detail?.totalTime || 0,
      final_grade: e.detail?.finalGrade || null,
      completion_date: Date.now(),
      completion_type: e.detail?.type || "standard"
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SET GLOBAL ZARAZ VARIABLES
  // ═══════════════════════════════════════════════════════════════════════

  if (window.zaraz && moodleCtx.courseId) {
    zaraz.set("moodle_course_id", moodleCtx.courseId, { scope: "session" });
    zaraz.set("moodle_user_role", moodleCtx.courseRole, { scope: "session" });
    if (moodleCtx.groupId) zaraz.set("moodle_group_id", moodleCtx.groupId, { scope: "session" });
    if (moodleCtx.cohortId) zaraz.set("moodle_cohort_id", moodleCtx.cohortId, { scope: "session" });
    zaraz.set("moodle_active", "true", { scope: "session" });
  }

})();
</script>`
}
