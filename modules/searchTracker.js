export function buildSearchTrackerScript(endpoint) {
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
    if (window.zaraz && typeof window.zaraz.track === "function") window.zaraz.track(eventName, payload.properties);
    if (navigator.sendBeacon) navigator.sendBeacon(EP, JSON.stringify(payload));
  }

  function detectSearchFromQuery() {
    var sp = new URLSearchParams(location.search);
    var term = sp.get("s") || sp.get("search") || sp.get("q") || "";
    if (!term) return;
    emit("search", { search_term: term.slice(0, 120), source: "querystring" });
    emit("view_search_results", { search_term: term.slice(0, 120), source: "querystring" });
  }

  document.addEventListener("submit", function(e) {
    var form = e.target;
    if (!form || form.tagName !== "FORM") return;
    var input = form.querySelector("input[type='search'], input[name='s'], input[name='search'], input[name='q']");
    if (!input || !input.value) return;
    emit("search", { search_term: String(input.value).slice(0, 120), source: "form_submit" });
  }, true);

  detectSearchFromQuery();
})();
</script>`
}
