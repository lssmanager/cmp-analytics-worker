export function buildTimeTrackerScript(sessionId, endpoint) {
  return `
<script>
(function() {
  var SID = ${JSON.stringify(sessionId)};
  var EP  = ${JSON.stringify(endpoint)};
  var startTime = Date.now(), activeTime = 0,
      lastActive = Date.now(), isActive = true;

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
    if (p.includes("/course/view.php"))      return {type:"course",      id:q("id"),      platform:"moodle"};
    if (p.includes("/mod/lesson/view.php"))  return {type:"lesson",      id:q("id"),      platform:"moodle"};
    if (p.includes("/mod/quiz/attempt.php")) return {type:"quiz_attempt",id:q("attempt"), platform:"moodle"};
    if (p.includes("/mod/quiz/view.php"))    return {type:"quiz",        id:q("id"),      platform:"moodle"};
    if (p.includes("/mod/assign/view.php"))  return {type:"assignment",  id:q("id"),      platform:"moodle"};
    if (document.querySelector(".woocommerce-checkout")) return {type:"checkout",id:null,platform:"woocommerce"};
    if (document.querySelector(".woocommerce-cart"))     return {type:"cart",    id:null,platform:"woocommerce"};
    return {type:"page", id:null,
      platform: location.hostname.includes("lms.") ? "moodle" : "wordpress"};
  }

  function send(evType) {
    var ctx = getCtx();
    navigator.sendBeacon(EP, JSON.stringify({
      type: evType, eventName: "time_tracking", sessionId: SID,
      page: location.pathname + location.search, host: location.hostname,
      properties: {
        activeSeconds: Math.round(activeTime),
        totalSeconds:  Math.round((Date.now() - startTime) / 1000),
        pageType: ctx.type, contentId: ctx.id, platform: ctx.platform,
        pageTitle: document.title.slice(0, 100)
      }
    }));
  }

  setInterval(function() {
    var now = Date.now();
    if (isActive && (now - lastActive) < 60000) activeTime += 30;
    else isActive = false;
    send("heartbeat");
  }, 30000);

  window.addEventListener("beforeunload", function() { send("page_exit"); });
  setTimeout(function() { send("page_enter"); }, 1500);
})();
</script>`
}
