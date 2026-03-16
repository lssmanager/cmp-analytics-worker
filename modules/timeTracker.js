export function buildTimeTrackerScript(sessionId, endpoint) {
  return `
<script>
(function() {
  var SID = ${JSON.stringify(sessionId)};
  var EP  = ${JSON.stringify(endpoint)};
  var startTime = Date.now(), activeTime = 0,
      lastActive = Date.now(), isActive = true;

  function getRoleHints() {
    var classes = (document.body && document.body.className || "").split(/\s+/);
    var roles = [];
    classes.forEach(function(cls) {
      var m = cls.match(/^(?:role|bbp-role)-([a-z0-9_-]+)$/i);
      if (m && roles.indexOf(m[1]) === -1) roles.push(m[1]);
    });
    return roles;
  }

  function getBuddyBossCtx(path) {
    var p = path.toLowerCase();
    var parts = p.replace(/\/$/, "").split("/").filter(Boolean);
    var idxMembers = parts.indexOf("members");
    var idxGroups = parts.indexOf("groups");
    var idxForums = parts.indexOf("forums");

    if (idxMembers >= 0) return {
      network: "buddyboss",
      area: "profile",
      memberSlug: parts[idxMembers + 1] || null,
      groupSlug: null,
      forumSlug: null
    };
    if (idxGroups >= 0) return {
      network: "buddyboss",
      area: "groups",
      memberSlug: null,
      groupSlug: parts[idxGroups + 1] || null,
      forumSlug: null
    };
    if (idxForums >= 0) return {
      network: "buddyboss",
      area: "forums",
      memberSlug: null,
      groupSlug: null,
      forumSlug: parts[idxForums + 1] || null
    };
    if (p.indexOf("/activity") >= 0) return {
      network: "buddyboss",
      area: "social_feed",
      memberSlug: null,
      groupSlug: null,
      forumSlug: null
    };
    return null;
  }

  function getMoodleCtx(path, q) {
    if (path.indexOf("/course/view.php") >= 0)      return {type:"course", id:q("id")};
    if (path.indexOf("/mod/lesson/view.php") >= 0)  return {type:"lesson", id:q("id")};
    if (path.indexOf("/mod/quiz/attempt.php") >= 0) return {type:"quiz_attempt", id:q("attempt")};
    if (path.indexOf("/mod/quiz/view.php") >= 0)    return {type:"quiz", id:q("id")};
    if (path.indexOf("/mod/assign/view.php") >= 0)  return {type:"assignment", id:q("id")};
    if (path.indexOf("/mod/forum/view.php") >= 0)   return {type:"forum", id:q("id")};
    if (path.indexOf("/report/log") >= 0)           return {type:"report_log", id:q("id")};
    if (path.indexOf("/report/outline") >= 0)       return {type:"report_activity", id:q("id")};
    if (path.indexOf("/report/participation") >= 0) return {type:"report_participation", id:q("id")};
    if (path.indexOf("/report/progress") >= 0)      return {type:"report_activity_completion", id:q("course") || q("id")};
    if (path.indexOf("/report/completion") >= 0)    return {type:"report_course_completion", id:q("course") || q("id")};
    if (path.indexOf("/grade/report") >= 0)         return {type:"gradebook", id:q("id")};
    return null;
  }

  function inferPlatform(path) {
    var host = location.hostname.toLowerCase();
    if (host.indexOf("lms.") === 0 || host.indexOf("moodle") >= 0) return "moodle";
    if (path.indexOf("/members/") >= 0 || path.indexOf("/groups/") >= 0 ||
        path.indexOf("/forums/") >= 0 || path.indexOf("/activity/") >= 0) return "buddyboss";
    if (document.querySelector(".woocommerce-checkout") || document.querySelector(".woocommerce-cart")) return "woocommerce";
    return "wordpress";
  }

  ["mousemove","keydown","scroll","click","touchstart"].forEach(function(ev) {
    document.addEventListener(ev, function() {
      lastActive = Date.now(); isActive = true;
    }, { passive: true });
  });

  document.addEventListener("visibilitychange", function() {
    isActive = !document.hidden;
    if (!document.hidden) lastActive = Date.now();
  });

  function getCtx() {
    var p = location.pathname, s = location.search;
    var q = function(k) {
      var m = s.match(new RegExp("[?&]"+k+"=([^&]+)"));
      return m ? m[1] : null;
    };
    var moodle = getMoodleCtx(p, q);
    if (moodle) return {type:moodle.type, id:moodle.id, platform:"moodle", roles:getRoleHints(), buddyboss:null};

    if (document.querySelector(".woocommerce-checkout")) return {type:"checkout",id:null,platform:"woocommerce",roles:getRoleHints(),buddyboss:null};
    if (document.querySelector(".woocommerce-cart"))     return {type:"cart",    id:null,platform:"woocommerce",roles:getRoleHints(),buddyboss:null};

    var buddyboss = getBuddyBossCtx(p);
    if (buddyboss) {
      return {
        type: buddyboss.area,
        id: buddyboss.groupSlug || buddyboss.memberSlug || buddyboss.forumSlug,
        platform: "buddyboss",
        roles: getRoleHints(),
        buddyboss: buddyboss
      };
    }

    return {
      type:"page",
      id:null,
      platform: inferPlatform(p),
      roles:getRoleHints(),
      buddyboss:null
    };
  }

  function send(evType, eventName, extra) {
    var ctx = getCtx();
    navigator.sendBeacon(EP, JSON.stringify({
      type: evType, eventName: eventName || "time_tracking", sessionId: SID,
      page: location.pathname + location.search, host: location.hostname,
      properties: {
        activeSeconds: Math.round(activeTime),
        totalSeconds:  Math.round((Date.now() - startTime) / 1000),
        pageType: ctx.type, contentId: ctx.id, platform: ctx.platform,
        pageTitle: document.title.slice(0, 100),
        roles: ctx.roles || [],
        buddyboss: ctx.buddyboss,
        extra: extra || null
      }
    }));
  }

  function wireEngagementEvents() {
    document.addEventListener("submit", function(e) {
      var form = e.target;
      if (!form || !form.matches) return;

      if (form.matches("form#mformforum, form[action*='/mod/forum/post.php']")) {
        send("interaction", "forum_post", { source: "moodle" });
      }
      if (form.matches("form[action*='/groups/'], form[action*='/members/']")) {
        send("interaction", "social_interaction", { source: "buddyboss" });
      }
    }, true);

    document.addEventListener("click", function(e) {
      var el = e.target && e.target.closest ? e.target.closest("a,button") : null;
      if (!el) return;
      var txt = ((el.innerText || "") + " " + (el.getAttribute("aria-label") || "")).toLowerCase();
      var href = (el.getAttribute("href") || "").toLowerCase();

      if (href.indexOf("/members/") >= 0) {
        send("interaction", "profile_view", { source: "buddyboss", href: href.slice(0, 140) });
      }
      if (href.indexOf("/groups/") >= 0) {
        send("interaction", "group_navigation", { source: "buddyboss", href: href.slice(0, 140) });
      }
      if (href.indexOf("/forums/") >= 0) {
        send("interaction", "forum_navigation", { source: "buddyboss", href: href.slice(0, 140) });
      }
      if (href.indexOf("/achievements") >= 0 || href.indexOf("/points") >= 0 ||
          href.indexOf("/ranks") >= 0 || href.indexOf("gamipress") >= 0 ||
          txt.indexOf("badge") >= 0 || txt.indexOf("achievement") >= 0 || txt.indexOf("points") >= 0) {
        send("interaction", "gamification_interaction", { source: "gamipress", href: href.slice(0, 140) });
      }
      if (href.indexOf("/report/") >= 0 || href.indexOf("/grade/report") >= 0) {
        send("interaction", "moodle_report_navigation", { source: "moodle", href: href.slice(0, 140) });
      }
    }, true);
  }

  setInterval(function() {
    var now = Date.now();
    if (isActive && (now - lastActive) < 60000) activeTime += 30;
    else isActive = false;
    send("heartbeat");
  }, 30000);

  window.addEventListener("beforeunload", function() { send("page_exit"); });
  wireEngagementEvents();
  setTimeout(function() { send("page_enter"); }, 1500);
})();
</script>`
}
