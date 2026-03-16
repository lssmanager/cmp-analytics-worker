/**
 * buddyBossTracker.js - BuddyBoss Social Platform Event Tracking
 *
 * Captures all social engagement events from BuddyBoss:
 * - Profile events: viewed, updated, completion_percentage
 * - Group events: joined, left, post_created
 * - Activity events: posted, reacted/liked, commented
 * - Messaging events: message_sent, dm_thread interaction
 * - Connection events: requested, accepted
 * - Advanced metrics: engagement scores, member activity
 *
 * Integration: Called from worker.js if platforms.isBuddyBoss detected
 */

export function buildBuddyBossTrackerScript(endpoint) {
  return `<script>
(function() {
  var EP = ${JSON.stringify(endpoint)};
  if (!EP) return;

  /**
   * Helper: Send analytics event
   */
  function sendEvent(type, properties) {
    var payload = {
      type: type,
      eventName: type,
      page: location.pathname,
      host: location.hostname,
      sessionId: getCookie("cmp_uid"),
      userId: getCookie("cmp_user_id"),
      properties: properties || {}
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(EP, JSON.stringify(payload));
    }
  }

  /**
   * Helper: Get cookie value
   */
  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^|;\\\\s*)(" + name + ")=([^;]*)"));
    return match ? decodeURIComponent(match[3]) : "";
  }

  /**
   * Helper: Safe text extraction
   */
  function safeText(selector) {
    var el = document.querySelector(selector);
    return el && el.innerText ? el.innerText.trim().slice(0, 255) : null;
  }

  /**
   * Extract BuddyBoss context from page
   */
  function extractBuddyBossContext() {
    var ctx = {
      currentUserId: document.querySelector("[data-user-id]")?.dataset?.userId || getCookie("cmp_user_id") || null,
      currentUserName: document.querySelector("[data-user-name]")?.dataset?.userName || null,
      currentUserRole: document.querySelector("[data-user-role]")?.dataset?.userRole || "member",
      isMember: !document.body.classList.contains("logged-out"),
      pageType: null, // 'profile', 'group', 'activity', 'messages', 'members', etc.
      objectId: null // profile_id, group_id, activity_id, etc.
    };

    // Detect page type
    if (location.pathname.includes("/members/")) {
      ctx.pageType = "profile";
      var matches = location.pathname.match(/\\/members\\/([^\\/]+)/);
      ctx.objectId = matches ? matches[1] : null;
    } else if (location.pathname.includes("/groups/")) {
      ctx.pageType = "group";
      var matches = location.pathname.match(/\\/groups\\/([^\\/]+)/);
      ctx.objectId = matches ? matches[1] : null;
    } else if (location.pathname.includes("/activity/")) {
      ctx.pageType = "activity";
    } else if (location.pathname.includes("/messages/")) {
      ctx.pageType = "messages";
    }

    return ctx;
  }

  var bbContext = extractBuddyBossContext();

  // ════════════════════════════════════════════════
  // BUDDYBOSS PROFILE TRACKING
  // ════════════════════════════════════════════════

  // Profile Viewed
  if (bbContext.pageType === "profile" && bbContext.isMember) {
    var viewedUserId = safeText("[data-profile-id]") || bbContext.objectId;
    var viewedUserName = safeText(".profile-header h2, .member-name") || null;

    sendEvent("buddyboss_profile_viewed", {
      profile_user_id: viewedUserId,
      profile_user_name: viewedUserName,
      viewer_role: bbContext.currentUserRole,
      is_own_profile: bbContext.currentUserId === viewedUserId
    });
  }

  // Profile Edit Detection
  var profileEditButton = document.querySelector("a.edit-profile-link, [href*='edit_profile'], .btn-edit-profile");
  if (profileEditButton) {
    profileEditButton.addEventListener("click", function() {
      sendEvent("buddyboss_profile_edit_started", {
        profile_user_id: bbContext.currentUserId,
        page_type: "profile_edit"
      });
    });
  }

  // Profile Save Detection (form submission)
  document.querySelectorAll("form[action*='profile'], .profile-form").forEach(function(form) {
    form.addEventListener("submit", function(e) {
      // Extract which fields were modified
      var changedFields = [];
      form.querySelectorAll("input[type='text'], textarea, select").forEach(function(field) {
        if (field.classList.contains("changed") || field.getAttribute("data-changed")) {
          changedFields.push(field.name || field.id);
        }
      });

      sendEvent("buddyboss_profile_updated", {
        profile_user_id: bbContext.currentUserId,
        updated_fields: changedFields.slice(0, 10), // Cap at 10 fields
        completion_percentage: getProfileCompletionPercentage()
      });
    });
  });

  /**
   * Calculate profile completion percentage
   * Estimates based on filled-out profile fields
   */
  function getProfileCompletionPercentage() {
    var completedFields = 0;
    var totalPossibleFields = 0;

    // Check common profile fields
    var fieldSelectors = [
      "[name='display_name']",
      "[name='xprofile_name']",
      "[name='profile_photo']",
      "[name='user_bio']",
      "[name='user_location']",
      "[name='user_website']",
      ".profile-section input:not([type='hidden'])",
      ".profile-section textarea"
    ];

    fieldSelectors.forEach(function(selector) {
      var fields = document.querySelectorAll(selector);
      fields.forEach(function(field) {
        totalPossibleFields++;
        if (field.value && field.value.trim().length > 0) {
          completedFields++;
        }
      });
    });

    if (totalPossibleFields === 0) return 0;
    return Math.round((completedFields / totalPossibleFields) * 100);
  }

  // ════════════════════════════════════════════════
  // BUDDYBOSS GROUP TRACKING
  // ════════════════════════════════════════════════

  // Group Joined - detect via button click
  document.querySelectorAll(".join-group-btn, [data-action='join-group'], [class*='join-button']").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var groupId = btn.getAttribute("data-group-id") || safeText("[data-group-id]");
      var groupName = safeText(".group-name, h2.group-title");

      sendEvent("buddyboss_group_joined", {
        group_id: groupId,
        group_name: groupName,
        group_type: btn.getAttribute("data-group-type") || "public",
        group_privacy: btn.getAttribute("data-privacy") || "public"
      });
    });
  });

  // Group Left - detect via leave button
  document.querySelectorAll(".leave-group-btn, [data-action='leave-group'], [class*='leave-button']").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var groupId = btn.getAttribute("data-group-id") || safeText("[data-group-id]");
      var groupName = safeText(".group-name, h2.group-title");

      sendEvent("buddyboss_group_left", {
        group_id: groupId,
        group_name: groupName,
        membership_duration_days: parseInt(btn.getAttribute("data-membership-days")) || 0
      });
    });
  });

  // Group Post Created - detect form submission
  document.querySelectorAll(".group-form, [data-form='group-post'], [class*='new-post-form']").forEach(function(form) {
    form.addEventListener("submit", function(e) {
      var postContent = form.querySelector("textarea[name='content'], .post-content")?.value || "";
      var groupId = form.getAttribute("data-group-id") || safeText("[data-group-id]");

      sendEvent("buddyboss_group_post_created", {
        post_id: "pending_" + Date.now(), // Temp ID until server response
        group_id: groupId,
        post_type: form.getAttribute("data-post-type") || "status",
        post_length_chars: postContent.length,
        has_media: form.querySelectorAll("input[type='file']").length > 0,
        attachment_count: form.querySelectorAll("input[type='file']:not([disabled])").length
      });
    });
  });

  // ════════════════════════════════════════════════
  // BUDDYBOSS ACTIVITY TRACKING
  // ════════════════════════════════════════════════

  // Activity Posted
  document.querySelectorAll("[data-form='activity-form'], .activity-form").forEach(function(form) {
    form.addEventListener("submit", function(e) {
      var activityContent = form.querySelector("textarea")?.value || "";
      var mentions = (activityContent.match(/@\\w+/g) || []).length;

      sendEvent("buddyboss_activity_posted", {
        activity_id: "pending_" + Date.now(),
        activity_type: form.getAttribute("data-activity-type") || "activity",
        activity_component: form.getAttribute("data-component") || "activity",
        activity_length_chars: activityContent.length,
        contains_mention: mentions > 0,
        mention_count: mentions,
        contains_media: form.querySelectorAll("input[type='file']:not([disabled])").length > 0,
        attachment_count: form.querySelectorAll("input[type='file']:not([disabled])").length
      });
    });
  });

  // Activity Liked / Reacted - detect via like buttons
  document.querySelectorAll("[data-action='like'], [class*='like-btn'], [class*='reaction-btn']").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      var activityId = btn.getAttribute("data-activity-id") || btn.closest(".activity")?.getAttribute("data-id");
      var reactionType = btn.getAttribute("data-reaction") || "like";

      sendEvent("buddyboss_activity_reacted", {
        activity_id: activityId,
        reaction_type: reactionType,
        activity_type: btn.getAttribute("data-activity-type") || "activity"
      });
    });
  });

  // Activity Commented
  document.querySelectorAll("[data-form='comment-form'], .comment-form").forEach(function(form) {
    form.addEventListener("submit", function(e) {
      var commentContent = form.querySelector("textarea")?.value || "";
      var activityId = form.getAttribute("data-activity-id") || form.closest(".activity")?.getAttribute("data-id");

      sendEvent("buddyboss_activity_commented", {
        activity_id: activityId,
        comment_id: "pending_" + Date.now(),
        activity_type: form.getAttribute("data-activity-type") || "activity",
        comment_length_chars: commentContent.length
      });
    });
  });

  // ════════════════════════════════════════════════
  // BUDDYBOSS MESSAGING / DM TRACKING
  // ════════════════════════════════════════════════

  // Private Message Sent
  document.querySelectorAll("[data-form='message-form'], .message-form, .dm-form").forEach(function(form) {
    form.addEventListener("submit", function(e) {
      var messageContent = form.querySelector("textarea[name='content']")?.value || "";
      var recipientIds = form.getAttribute("data-recipient-ids")?.split(",") || [];

      sendEvent("buddyboss_message_sent", {
        thread_id: form.getAttribute("data-thread-id") || "temp_" + Date.now(),
        recipient_user_id: recipientIds[0] || null,
        message_length_chars: messageContent.length,
        has_attachment: form.querySelectorAll("input[type='file']:not([disabled])").length > 0,
        is_group_message: recipientIds.length > 1,
        participant_count: recipientIds.length
      });
    });
  });

  // Message/Thread View Time Tracking
  var threadViewStart = Date.now();
  window.addEventListener("beforeunload", function() {
    if (bbContext.pageType === "messages") {
      var timeInThread = Math.round((Date.now() - threadViewStart) / 1000);

      sendEvent("buddyboss_message_thread_viewed", {
        time_spent_seconds: timeInThread,
        thread_type: document.body.classList.contains("single-thread") ? "one_on_one" : "group"
      });
    }
  });

  // ════════════════════════════════════════════════
  // BUDDYBOSS SOCIAL CONNECTIONS
  // ════════════════════════════════════════════════

  // Connection/Friend Request Sent
  document.querySelectorAll("[data-action='add-friend'], [class*='connect-btn'], .friend-request-btn").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      var targetUserId = btn.getAttribute("data-user-id");
      var targetUserName = btn.getAttribute("data-user-name") || safeText(".profile-name");

      sendEvent("buddyboss_connection_requested", {
        target_user_id: targetUserId,
        target_user_name: targetUserName,
        direction: "outgoing"
      });
    });
  });

  // Connection Request Accepted
  document.querySelectorAll("[data-action='accept-request'], [class*='accept-conn'], .accept-friend").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      var fromUserId = btn.getAttribute("data-user-id");

      sendEvent("buddyboss_connection_accepted", {
        connected_user_id: fromUserId,
        total_connections: getTotalConnections()
      });
    });
  });

  /**
   * Count user's total connections
   */
  function getTotalConnections() {
    var connectionCount = document.querySelector(".friends-count, [data-friends-count], .connection-count");
    if (connectionCount) {
      var count = connectionCount.innerText.match(/\\d+/);
      return count ? parseInt(count[0]) : 0;
    }
    return 0;
  }

  // ════════════════════════════════════════════════
  // BUDDYBOSS PROFILE COMPLETION TRACKING
  // ════════════════════════════════════════════════

  document.addEventListener("buddyboss:profile:completion_changed", function(e) {
    sendEvent("buddyboss_profile_completion", {
      completion_percentage: e.detail?.completionPercent || 0,
      completed_fields: e.detail?.completedFields || [],
      total_fields: e.detail?.totalFields || 0
    });
  });

  // ════════════════════════════════════════════════
  // ADVANCED ENGAGEMENT TRACKING
  // ════════════════════════════════════════════════

  var sessionMetrics = {
    sessionStart: Date.now(),
    profilesViewed: 0,
    groupsInteracted: 0,
    activitiesInteracted: 0,
    messagesViewed: 0,
    connectionsAdded: 0,
    totalEngagementTime: 0
  };

  // Track profile views
  document.querySelectorAll(".bp-member-item, .member-card, [data-member-id]").forEach(function(el) {
    el.addEventListener("click", function() {
      sessionMetrics.profilesViewed++;
    });
  });

  // Track group interactions
  document.querySelectorAll(".bp-group, .group-card, [data-group-id]").forEach(function(el) {
    el.addEventListener("click", function() {
      sessionMetrics.groupsInteracted++;
    });
  });

  // Session summary on unload
  window.addEventListener("beforeunload", function() {
    sessionMetrics.totalEngagementTime = Math.round((Date.now() - sessionMetrics.sessionStart) / 1000);

    if (bbContext.isMember && sessionMetrics.totalEngagementTime > 0) {
      sendEvent("buddyboss_session_summary", {
        session_duration_seconds: sessionMetrics.totalEngagementTime,
        profiles_viewed: sessionMetrics.profilesViewed,
        groups_interacted: sessionMetrics.groupsInteracted,
        activities_interacted: sessionMetrics.activitiesInteracted,
        messages_viewed: sessionMetrics.messagesViewed,
        connections_added: sessionMetrics.connectionsAdded,
        user_role: bbContext.currentUserRole
      });
    }
  });

  // ════════════════════════════════════════════════
  // ZARAZ INTEGRATION
  // ════════════════════════════════════════════════

  if (window.zaraz && bbContext.isMember) {
    zaraz.set("buddyboss_member", "true", { scope: "session" });
    zaraz.set("buddyboss_user_role", bbContext.currentUserRole, { scope: "session" });
    if (bbContext.currentUserId) {
      zaraz.set("buddyboss_user_id", bbContext.currentUserId, { scope: "session" });
    }
  }
})();
</script>`;
}
