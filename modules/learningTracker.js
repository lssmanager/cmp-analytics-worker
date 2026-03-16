export function buildLearningTrackerScript(endpoint) {
  return `
<script>
(function() {
  var EP = ${JSON.stringify(endpoint)};

  function hasAnalyticsConsent() {
    var c = document.cookie.split("; ").find(function(v){ return v.indexOf("consent=") === 0; });
    return !!(c && c.indexOf("analytics:true") !== -1);
  }

  function emit(eventName, props) {
    if (!hasAnalyticsConsent()) return;
    var payload = {
      type: eventName,
      eventName: eventName,
      page: location.pathname + location.search,
      host: location.hostname,
      properties: props || {}
    };

    if (window.zaraz && typeof window.zaraz.track === "function") {
      window.zaraz.track(eventName, payload.properties);
    }
    if (navigator.sendBeacon) navigator.sendBeacon(EP, JSON.stringify(payload));
  }

  function q(key) {
    return new URLSearchParams(location.search).get(key);
  }

  function detectPageEvent() {
    var p = location.pathname;
    if (p.indexOf("/course/view.php") >= 0) emit("course_progress", { course_id: q("id"), source: "page_load" });
    if (p.indexOf("/mod/lesson/view.php") >= 0) emit("lesson_start", { lesson_id: q("id"), source: "page_load" });
    if (p.indexOf("/mod/quiz/attempt.php") >= 0) emit("quiz_start", { quiz_attempt_id: q("attempt"), source: "page_load" });
    if (p.indexOf("/mod/assign/view.php") >= 0) emit("assignment_submit", { assignment_id: q("id"), source: "page_load_candidate" });
  }

  function bindActionEvents() {
    document.addEventListener("click", function(e) {
      var el = e.target && e.target.closest ? e.target.closest("a,button,[data-event-learning]") : null;
      if (!el) return;

      var custom = el.getAttribute("data-event-learning");
      if (custom) {
        emit(custom, {
          content_id: el.getAttribute("data-content-id") || null,
          content_name: el.getAttribute("data-content-name") || null
        });
        return;
      }

      var txt = ((el.innerText || "") + " " + (el.getAttribute("aria-label") || "")).toLowerCase();
      if (txt.indexOf("enroll") >= 0 || txt.indexOf("matric") >= 0 || txt.indexOf("inscrib") >= 0) emit("course_enrollment", { source: "action" });
      if (txt.indexOf("unenroll") >= 0 || txt.indexOf("withdraw") >= 0 || txt.indexOf("cancelar") >= 0) emit("course_unenroll", { source: "action" });
      if (txt.indexOf("complete lesson") >= 0 || txt.indexOf("mark as done") >= 0 || txt.indexOf("completar") >= 0) emit("lesson_complete", { source: "action" });
      if (txt.indexOf("module complete") >= 0 || txt.indexOf("complete module") >= 0) emit("module_complete", { source: "action" });
      if (txt.indexOf("unenroll lesson") >= 0) emit("lesson_unenroll", { source: "action" });
    }, true);

    document.addEventListener("submit", function(e) {
      var form = e.target;
      if (!form || form.tagName !== "FORM") return;
      var action = (form.getAttribute("action") || "").toLowerCase();

      if (action.indexOf("/mod/quiz/processattempt.php") >= 0 || action.indexOf("quiz") >= 0) {
        var scoreEl = form.querySelector("[name='score'], [name='grade'], [data-score]");
        var score = scoreEl ? Number(scoreEl.value || scoreEl.getAttribute("data-score")) : null;
        emit("quiz_complete", { score: Number.isFinite(score) ? score : null });
        if (Number.isFinite(score) && score < 60) emit("quiz_fail", { score: score });
      }

      if (action.indexOf("/mod/assign") >= 0) {
        emit("assignment_submit", { source: "submit" });
      }
    }, true);

    [
      "moodle:course_enrollment",
      "moodle:course_unenroll",
      "moodle:lesson_complete",
      "moodle:quiz_complete",
      "moodle:assignment_complete"
    ].forEach(function(evtName) {
      window.addEventListener(evtName, function(ev) {
        var mapped = evtName.replace("moodle:", "");
        emit(mapped, (ev && ev.detail) || {});
      });
    });
  }

  detectPageEvent();
  bindActionEvents();
})();
</script>`
}
