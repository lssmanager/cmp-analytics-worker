/**
 * errorTracker.js - Error & Performance Monitoring
 * Captures JS errors, API failures, and Core Web Vitals
 */

export function buildErrorTrackerScript(endpoint = "/__cmp/analytics") {
  return `<script>
(function() {
  var endpoint = "${endpoint}";
  var errorCount = 0;
  var maxErrors = 50; // Limit errors to prevent spam

  // ═══════════════════════════════════════════════════════════════════════
  // JAVASCRIPT ERROR TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  window.addEventListener("error", function(e) {
    if (errorCount >= maxErrors) return;
    errorCount++;

    var error = e.error || {};
    navigator.sendBeacon(endpoint, JSON.stringify({
      type: "page_error",
      eventName: "JavaScript Error",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        error_type: error.name || "Error",
        error_message: (error.message || e.message || "Unknown error").slice(0, 256),
        error_source: (e.filename || location.pathname).slice(-100),
        error_line: e.lineno || 0,
        error_column: e.colno || 0,
        severity: "error"
      }
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════
  // UNHANDLED PROMISE REJECTION
  // ═══════════════════════════════════════════════════════════════════════

  window.addEventListener("unhandledrejection", function(e) {
    if (errorCount >= maxErrors) return;
    errorCount++;

    var reason = e.reason || {};
    var message = reason.message || String(reason) || "Unknown rejection";

    navigator.sendBeacon(endpoint, JSON.stringify({
      type: "page_error",
      eventName: "Unhandled Promise Rejection",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        error_type: "UnhandledRejection",
        error_message: message.slice(0, 256),
        error_source: location.pathname,
        severity: "warning"
      }
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PERFORMANCE MONITORING (Core Web Vitals)
  // ═══════════════════════════════════════════════════════════════════════

  // Largest Contentful Paint (LCP)
  if (window.PerformanceObserver) {
    try {
      var lcpObserver = new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        var lastEntry = entries[entries.length - 1];
        navigator.sendBeacon(endpoint, JSON.stringify({
          type: "page_error",
          eventName: "Core Web Vitals - LCP",
          page: location.pathname,
          sessionId: getCookie("cmp_uid"),
          properties: {
            metric_type: "lcp",
            metric_value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
            threshold: 2500,
            page_path: location.pathname
          }
        }));
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"], buffered: true });
    } catch (e) {}
  }

  // First Input Delay (FID) / Interaction to Next Paint (INP)
  if (window.PerformanceObserver) {
    try {
      var fidObserver = new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          navigator.sendBeacon(endpoint, JSON.stringify({
            type: "page_error",
            eventName: "Core Web Vitals - FID",
            page: location.pathname,
            sessionId: getCookie("cmp_uid"),
            properties: {
              metric_type: "fid",
              metric_value: Math.round(entry.processingDuration),
              threshold: 100,
              page_path: location.pathname
            }
          }));
        });
      });
      fidObserver.observe({ entryTypes: ["first-input", "longtask"], buffered: true });
    } catch (e) {}
  }

  // Cumulative Layout Shift (CLS)
  var clsValue = 0;
  if (window.PerformanceObserver) {
    try {
      var clsObserver = new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });
      clsObserver.observe({ entryTypes: ["layout-shift"], buffered: true });

      window.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "hidden") {
          navigator.sendBeacon(endpoint, JSON.stringify({
            type: "page_error",
            eventName: "Core Web Vitals - CLS",
            page: location.pathname,
            sessionId: getCookie("cmp_uid"),
            properties: {
              metric_type: "cls",
              metric_value: Math.round(clsValue * 1000) / 1000,
              threshold: 0.1,
              page_path: location.pathname
            }
          }));
        }
      });
    } catch (e) {}
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NETWORK ERROR MONITORING
  // ═══════════════════════════════════════════════════════════════════════

  // Track failed fetch requests
  var originalFetch = window.fetch;
  window.fetch = function() {
    return originalFetch.apply(this, arguments)
      .catch(function(error) {
        if (errorCount < maxErrors) {
          errorCount++;
          navigator.sendBeacon(endpoint, JSON.stringify({
            type: "api_error",
            eventName: "Network Error - Fetch Failed",
            page: location.pathname,
            sessionId: getCookie("cmp_uid"),
            properties: {
              error_message: (error.message || "Network error").slice(0, 256),
              error_type: "FetchError",
              severity: "warning"
            }
          }));
        }
        throw error;
      });
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE LOAD TIME
  // ═══════════════════════════════════════════════════════════════════════

  window.addEventListener("load", function() {
    setTimeout(function() {
      var perfData = window.performance.timing;
      var pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      var ttfb = perfData.responseStart - perfData.navigationStart;
      var dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;

      if (pageLoadTime > 0) {
        navigator.sendBeacon(endpoint, JSON.stringify({
          type: "page_error",
          eventName: "Page Load Performance",
          page: location.pathname,
          sessionId: getCookie("cmp_uid"),
          properties: {
            metric_type: "page_load_time",
            page_load_time_ms: pageLoadTime,
            ttfb_ms: ttfb,
            dns_time_ms: dnsTime,
            page_path: location.pathname
          }
        }));
      }
    }, 0);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
    return match ? match[3] : "";
  }

})();
</script>`
}
