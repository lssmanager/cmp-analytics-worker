export function buildErrorTrackerScript(endpoint) {
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

  window.addEventListener("error", function(ev) {
    var target = ev && ev.target;
    if (target && target !== window) {
      emit("page_error", {
        severity: "warning",
        error_type: "resource_error",
        source: target.src || target.href || target.tagName || "resource"
      });
      return;
    }

    emit("page_error", {
      severity: "critical",
      error_type: "js_error",
      message: ev && ev.message || "unknown_error",
      source: ev && ev.filename || null,
      line: ev && ev.lineno || null,
      col: ev && ev.colno || null
    });
  }, true);

  window.addEventListener("unhandledrejection", function(ev) {
    emit("page_error", {
      severity: "critical",
      error_type: "promise_rejection",
      message: ev && ev.reason && (ev.reason.message || String(ev.reason)) || "unknown_rejection"
    });
  });

  if ("PerformanceObserver" in window) {
    try {
      var cls = 0;
      new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          if (!entry.hadRecentInput) cls += entry.value || 0;
        });
      }).observe({ type: "layout-shift", buffered: true });

      new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        var lcp = entries[entries.length - 1];
        if (!lcp) return;
        emit("user_engagement", { metric: "lcp", value: Math.round(lcp.startTime) });
      }).observe({ type: "largest-contentful-paint", buffered: true });

      window.addEventListener("beforeunload", function() {
        emit("user_engagement", { metric: "cls", value: Number(cls.toFixed(4)) });
      });
    } catch (e) {}
  }

  window.addEventListener("load", function() {
    var nav = performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (!nav) return;
    emit("user_engagement", {
      metric: "page_load",
      dom_complete_ms: Math.round(nav.domComplete),
      response_ms: Math.round(nav.responseEnd - nav.requestStart)
    });
  });
})();
</script>`
}
