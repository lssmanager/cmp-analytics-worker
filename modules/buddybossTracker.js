/**
 * buddybossTracker.js - BuddyBoss Social Community Tracking
 * Tracks: Foros, Grupos, Actividades, Gamification (GamiPress), Mensajes
 * Evento: Site: www.learnsocialstudies.com
 */

export function buildBuddyBossTrackerScript() {
  return `<script>
(function() {
  var endpoint = "/__cmp/analytics";

  // ═══════════════════════════════════════════════════════════════════════
  // BUDDYBOSS FORUM TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // Forum topic creation / reply
  document.addEventListener("bbp_topic_created", function(e) {
    zaraz?.track("bp_forum_topic_created", {
      topic_id: e.detail?.topic_id || "",
      forum_id: e.detail?.forum_id || "",
      topic_title: e.detail?.topic_title || "",
      page_path: location.pathname
    });
  });

  document.addEventListener("bbp_reply_created", function(e) {
    zaraz?.track("bp_forum_reply_created", {
      reply_id: e.detail?.reply_id || "",
      topic_id: e.detail?.topic_id || "",
      forum_id: e.detail?.forum_id || "",
      page_path: location.pathname
    });
  });

  // Forum page detection
  if (document.body.classList.contains("bbp-forum") || location.pathname.includes("/forums/")) {
    var forumTitle = document.querySelector("h1.page-title, .bbp-forum-title");
    zaraz?.track("bp_forum_viewed", {
      forum_type: "forum",
      page_path: location.pathname,
      page_title: forumTitle?.innerText || "Forum"
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BUDDYBOSS GROUPS TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // Group join/leave
  document.addEventListener("bp_group_joined", function(e) {
    zaraz?.track("bp_group_joined", {
      group_id: e.detail?.group_id || "",
      group_name: e.detail?.group_name || "",
      group_type: e.detail?.group_type || "public",
      page_path: location.pathname
    });
  });

  document.addEventListener("bp_group_left", function(e) {
    zaraz?.track("bp_group_left", {
      group_id: e.detail?.group_id || "",
      group_name: e.detail?.group_name || "",
      page_path: location.pathname
    });
  });

  // Group page detection
  if (document.body.classList.contains("bp-group") || location.pathname.includes("/groups/")) {
    var groupName = document.querySelector(".group-title, h1.bp-group-name");
    var groupType = document.querySelector("[data-group-type]")?.dataset.groupType || "standard";

    zaraz?.track("bp_group_viewed", {
      group_id: location.pathname.split("/groups/")[1]?.split("/")[0] || "",
      group_name: groupName?.innerText || "Group",
      group_type: groupType,
      page_path: location.pathname
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BUDDYBOSS MEMBER/PROFILE TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // Member profile view
  if (document.body.classList.contains("bp-member") || location.pathname.includes("/members/")) {
    var memberName = document.querySelector(".member-name, .bp-member-name, h1.page-title");
    var memberId = location.pathname.split("/members/")[1]?.split("/")[0] || "";

    zaraz?.track("bp_member_viewed", {
      member_id: memberId,
      member_name: memberName?.innerText || "",
      page_path: location.pathname
    });
  }

  // Member follow/unfollow
  document.addEventListener("bp_member_followed", function(e) {
    zaraz?.track("bp_member_followed", {
      followed_user_id: e.detail?.user_id || "",
      followed_user_name: e.detail?.user_name || "",
      page_path: location.pathname
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BUDDYBOSS ACTIVITY TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // Activity stream posts
  document.addEventListener("bp_activity_posted", function(e) {
    var activityType = e.detail?.activity_type || "activity_post";
    zaraz?.track("bp_activity_posted", {
      activity_id: e.detail?.activity_id || "",
      activity_type: activityType, // 'status_update', 'activity_post', 'group_updated', etc
      activity_content: (e.detail?.content || "").slice(0, 100),
      page_path: location.pathname
    });
  });

  // Activity comments
  document.addEventListener("bp_activity_comment_posted", function(e) {
    zaraz?.track("bp_activity_comment_posted", {
      activity_id: e.detail?.activity_id || "",
      comment_id: e.detail?.comment_id || "",
      page_path: location.pathname
    });
  });

  // Activity likes
  document.addEventListener("bp_activity_liked", function(e) {
    zaraz?.track("bp_activity_liked", {
      activity_id: e.detail?.activity_id || "",
      page_path: location.pathname
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BUDDYBOSS MESSAGES (PRIVATE CHAT)
  // ═══════════════════════════════════════════════════════════════════════

  document.addEventListener("bp_message_sent", function(e) {
    zaraz?.track("bp_message_sent", {
      thread_id: e.detail?.thread_id || "",
      recipient_id: e.detail?.recipient_id || "",
      recipient_count: e.detail?.recipient_count || 1,
      page_path: location.pathname
    });
  });

  // Messages list view
  if (location.pathname.includes("/messages/")) {
    zaraz?.track("bp_messages_viewed", {
      page_path: location.pathname
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GAMIPRESS GAMIFICATION TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // Achievement/Badge earned
  document.addEventListener("gamipress_achievement_unlocked", function(e) {
    zaraz?.track("gp_achievement_unlocked", {
      achievement_id: e.detail?.achievement_id || "",
      achievement_title: e.detail?.achievement_title || "",
      points_earned: parseInt(e.detail?.points) || 0,
      page_path: location.pathname
    });
  });

  // Points earned
  document.addEventListener("gamipress_points_awarded", function(e) {
    zaraz?.track("gp_points_awarded", {
      points_type: e.detail?.points_type || "default",
      points_amount: parseInt(e.detail?.amount) || 0,
      event_trigger: e.detail?.trigger || "",
      page_path: location.pathname
    });
  });

  // Rank progression
  document.addEventListener("gamipress_rank_achieved", function(e) {
    zaraz?.track("gp_rank_achieved", {
      rank_id: e.detail?.rank_id || "",
      rank_title: e.detail?.rank_title || "",
      total_points: parseInt(e.detail?.total_points) || 0,
      page_path: location.pathname
    });
  });

  // Leaderboard view (if accessed)
  if (location.pathname.includes("/leaderboard")) {
    zaraz?.track("gp_leaderboard_viewed", {
      leaderboard_type: document.querySelector("[data-leaderboard-type]")?.dataset.leaderboardType || "points",
      page_path: location.pathname
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BUDDYBOSS NOTIFICATIONS TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  // Notification click/interaction
  document.addEventListener("bp_notification_clicked", function(e) {
    zaraz?.track("bp_notification_clicked", {
      notification_id: e.detail?.notification_id || "",
      notification_type: e.detail?.type || "",
      page_path: location.pathname
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BUDDYBOSS PAGE TYPE DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  // Activity stream (home/timeline)
  if (location.pathname.includes("/activity/") || location.pathname === "/") {
    zaraz?.track("bp_activity_stream_viewed", {
      stream_type: "activity",
      page_path: location.pathname
    });
  }

  // Members directory
  if (location.pathname.includes("/members/")) {
    zaraz?.track("bp_members_directory_viewed", {
      page_path: location.pathname
    });
  }

  // Groups directory
  if (location.pathname.includes("/groups/")) {
    zaraz?.track("bp_groups_directory_viewed", {
      page_path: location.pathname
    });
  }

  // Set global Zaraz variables for BuddyBoss context
  if (window.zaraz) {
    var bpUserId = document.querySelector("[data-bp-user-id]")?.dataset.bpUserId || null;
    var bpGroupId = document.querySelector("[data-bp-group-id]")?.dataset.bpGroupId || null;

    if (bpUserId) zaraz.set("bp_user_id", bpUserId, { scope: "session" });
    if (bpGroupId) zaraz.set("bp_group_id", bpGroupId, { scope: "page" });
    zaraz.set("bp_active", "true", { scope: "session" }); // Indica que BuddyBoss está activo
  }

})();
</script>`
}
