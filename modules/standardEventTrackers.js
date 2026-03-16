/**
 * standardEventTrackers.js - GA4 Standard User Lifecycle, Web Vitals, and Engagement Events
 *
 * Captures:
 * - User Lifecycle: login, sign_up, first_visit
 * - Web Vitals: FID (First Input Delay), INP (Interaction to Next Paint), LCP (Largest Contentful Paint)
 * - Engagement: scroll depth tracking at 25%, 50%, 75%, 100% milestones
 * - File Downloads: automatic tracking of downloadable file clicks
 *
 * Integration: Injected by worker.js into all page responses
 */

/**
 * Track user authentication events (login/signup)
 * Listens for custom events or LocalStorage-based auth state changes
 *
 * @param {string} endpoint - Analytics endpoint URL
 * @returns {string} Inline JavaScript for HTML injection
 */
export function buildUserLifecycleTrackerScript(endpoint) {
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

  // ════════════════════════════════════════════════
  // USER LIFECYCLE: LOGIN / SIGNUP
  // ════════════════════════════════════════════════

  // Track login via custom event
  document.addEventListener("user:authenticated", function(e) {
    sendEvent("login", {
      method: e.detail?.authMethod || "password",
      provider: e.detail?.provider || "native"
    });
  });

  // Track signup via custom event
  document.addEventListener("user:registered", function(e) {
    sendEvent("sign_up", {
      method: e.detail?.signupMethod || "email",
      provider: e.detail?.provider || "native"
    });
  });

  // Fallback: Detect login via localStorage changes (e.g., JWT token set)
  var originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if ((key === "auth_token" || key === "user_id" || key === "access_token") && value) {
      var oldValue = this.getItem(key);
      if (!oldValue && value) {
        // Token/ID set for first time in this session = login/signup
        sendEvent("login", { method: "token_auth", source: key });
      }
    }
    return originalSetItem.apply(this, arguments);
  };

  // ════════════════════════════════════════════════
  // FILE DOWNLOAD TRACKING
  // ════════════════════════════════════════════════

  document.addEventListener("DOMContentLoaded", function() {
    // Select all <a> tags with downloadable file extensions
    var downloadExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "zip", "ppt", "pptx", "txt", "csv", "json", "xml", "gz", "rar"];
    var downloadSelector = "a[href*=\\".pdf\\"], a[href*=\\".doc\\"], a[href*=\\".docx\\"], a[href*=\\".xls\\"], a[href*=\\".xlsx\\"], a[href*=\\".zip\\"], a[href*=\\".ppt\\"], a[href*=\\".pptx\\"], a[href*=\\".txt\\"], a[href*=\\".csv\\"]";

    document.querySelectorAll(downloadSelector).forEach(function(link) {
      link.addEventListener("click", function(e) {
        var href = link.getAttribute("href");
        var filename = href.split("/").pop();
        var extension = filename.split(".").pop().toLowerCase();

        sendEvent("file_download", {
          file_name: filename,
          file_extension: extension,
          file_url: href
        });
      });
    });

    // Also track direct download attribute links
    document.querySelectorAll("a[download]").forEach(function(link) {
      link.addEventListener("click", function(e) {
        var href = link.getAttribute("href");
        var filename = link.getAttribute("download") || href.split("/").pop();
        var extension = filename.split(".").pop().toLowerCase();

        sendEvent("file_download", {
          file_name: filename,
          file_extension: extension,
          file_url: href
        });
      });
    });
  }, { once: true });

  // ════════════════════════════════════════════════
  // FIRST VISIT TRACKING
  // ════════════════════════════════════════════════

  var isFirstVisit = !getCookie("cmp_first_visit_tracked");
  if (isFirstVisit && document.readyState === "interactive" || document.readyState === "complete") {
    sendEvent("first_visit", {
      referrer: document.referrer || "direct",
      page: location.pathname
    });
    // Set marker
    document.cookie = "cmp_first_visit_tracked=1; path=/; max-age=" + (86400 * 365);
  } else if (isFirstVisit) {
    document.addEventListener("DOMContentLoaded", function() {
      sendEvent("first_visit", {
        referrer: document.referrer || "direct",
        page: location.pathname
      });
      document.cookie = "cmp_first_visit_tracked=1; path=/; max-age=" + (86400 * 365);
    }, { once: true });
  }
})();
</script>`;
}

/**
 * Track Web Vitals: FID (First Input Delay), INP (Interaction to Next Paint), LCP (Largest Contentful Paint)
 * Uses PerformanceObserver to capture Core Web Vitals
 *
 * @param {string} endpoint - Analytics endpoint URL
 * @returns {string} Inline JavaScript for HTML injection
 */
export function buildWebVitalsTrackerScript(endpoint) {
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

  // ════════════════════════════════════════════════
  // CORE WEB VITALS: FID (First Input Delay)
  // ════════════════════════════════════════════════

  if ("PerformanceObserver" in window) {
    try {
      var fidObserver = new PerformanceObserver(function(entryList) {
        var entries = entryList.getEntries();
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          // FID: time from user input to browser response
          sendEvent("web_vital_fid", {
            metric_type: "first_input_delay",
            metric_value: Math.round(entry.processingStart - entry.startTime),
            metric_unit: "milliseconds"
          });
        }
      });

      // Observe First Input Delay
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      // FID observer not supported
    }
  }

  // ════════════════════════════════════════════════
  // CORE WEB VITALS: INP (Interaction to Next Paint)
  // (Replacement for FID in newer browsers)
  // ════════════════════════════════════════════════

  if ("PerformanceObserver" in window) {
    try {
      var inpObserver = new PerformanceObserver(function(entryList) {
        var entries = entryList.getEntries();
        var maxINP = 0;

        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var inp = Math.max(entry.duration, maxINP);
          maxINP = inp;
        }

        if (maxINP > 0) {
          sendEvent("web_vital_inp", {
            metric_type: "interaction_to_next_paint",
            metric_value: Math.round(maxINP),
            metric_unit: "milliseconds"
          });
        }
      });

      // Observe Interaction to Next Paint (if supported)
      if ("interactionCount" in PerformanceObserver.prototype) {
        inpObserver.observe({ entryTypes: ["interaction"] });
      }
    } catch (e) {
      // INP observer not supported
    }
  }

  // ════════════════════════════════════════════════
  // CORE WEB VITALS: LCP (Largest Contentful Paint)
  // ════════════════════════════════════════════════

  if ("PerformanceObserver" in window) {
    try {
      var lcpObserver = new PerformanceObserver(function(entryList) {
        var entries = entryList.getEntries();
        var lastEntry = entries[entries.length - 1];

        sendEvent("web_vital_lcp", {
          metric_type: "largest_contentful_paint",
          metric_value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
          metric_unit: "milliseconds",
          element: lastEntry.element?.tagName || "unknown"
        });
      });

      // Observe Largest Contentful Paint
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      // LCP observer not supported
    }
  }

  // ════════════════════════════════════════════════
  // CUMULATIVE LAYOUT SHIFT (CLS)
  // ════════════════════════════════════════════════

  if ("PerformanceObserver" in window) {
    try {
      var clsObserver = new PerformanceObserver(function(entryList) {
        var entries = entryList.getEntries();
        var cls = 0;

        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].hadRecentInput) {
            cls += entries[i].value;
          }
        }

        if (cls > 0) {
          sendEvent("web_vital_cls", {
            metric_type: "cumulative_layout_shift",
            metric_value: Math.round(cls * 1000) / 1000, // Round to 3 decimals
            metric_unit: "score"
          });
        }
      });

      // Observe Layout Shift
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      // CLS observer not supported
    }
  }

  // ════════════════════════════════════════════════
  // ENGAGEMENT TIME TRACKING
  // Measure active interaction time per page
  // ════════════════════════════════════════════════

  var engagementStartTime = Date.now();
  var engagementTime = 0;
  var isEngaged = false;
  var engagementTimeout;

  function extendEngagement() {
    clearTimeout(engagementTimeout);

    if (!isEngaged) {
      isEngaged = true;
      engagementStartTime = Date.now();
    }

    // Reset engagement timer after 5 seconds of inactivity
    engagementTimeout = setTimeout(function() {
      if (isEngaged) {
        engagementTime += Date.now() - engagementStartTime;
        isEngaged = false;
      }
    }, 5000);
  }

  // Track engagement triggers
  ["mousedown", "keydown", "scroll", "touchstart"].forEach(function(eventType) {
    document.addEventListener(eventType, extendEngagement, true);
  });

  // Send engagement time on page unload
  window.addEventListener("beforeunload", function() {
    if (isEngaged) {
      engagementTime += Date.now() - engagementStartTime;
    }

    if (engagementTime > 0) {
      sendEvent("page_engagement_time", {
        engagement_time_ms: Math.round(engagementTime),
        engaged: isEngaged,
        page: location.pathname
      });
    }
  });
})();
</script>`;
}

/**
 * Track Scroll Depth engagement
 * Measures how far down the page users scroll and reports at key milestones
 *
 * @param {string} endpoint - Analytics endpoint URL
 * @returns {string} Inline JavaScript for HTML injection
 */
export function buildScrollDepthTrackerScript(endpoint) {
  return `<script>
(function() {
  var EP = ${JSON.stringify(endpoint)};
  if (!EP) return;

  var scrollTracked = {
    "25": false,
    "50": false,
    "75": false,
    "100": false
  };

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
   * Calculate scroll percentage
   * @returns {number} 0-100
   */
  function getScrollPercentage() {
    var windowHeight = window.innerHeight;
    var documentHeight = document.documentElement.scrollHeight;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Account for viewport height
    var totalScrollableHeight = documentHeight - windowHeight;

    if (totalScrollableHeight <= 0) {
      return 100; // Already at bottom (short page)
    }

    var percentage = Math.round((scrollTop / totalScrollableHeight) * 100);
    return Math.min(percentage, 100);
  }

  /**
   * Check scroll depth milestones
   */
  function checkScrollDepth() {
    var scrollPercent = getScrollPercentage();

    // Check each threshold
    var thresholds = [
      { percent: 25, key: "25" },
      { percent: 50, key: "50" },
      { percent: 75, key: "75" },
      { percent: 100, key: "100" }
    ];

    for (var i = 0; i < thresholds.length; i++) {
      var threshold = thresholds[i];
      if (scrollPercent >= threshold.percent && !scrollTracked[threshold.key]) {
        scrollTracked[threshold.key] = true;

        sendEvent("scroll_depth", {
          scroll_percent: threshold.percent,
          max_scroll_percent: scrollPercent,
          page: location.pathname
        });
      }
    }
  }

  // ════════════════════════════════════════════════
  // SCROLL EVENT TRACKING
  // ════════════════════════════════════════════════

  var scrollTimeout;
  window.addEventListener("scroll", function() {
    // Debounce scroll events (check every 250ms)
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      checkScrollDepth();
    }, 250);
  }, { passive: true });

  // Check on page load in case content is short
  document.addEventListener("DOMContentLoaded", function() {
    checkScrollDepth();
  });

  // Check periodically in case user returns to page
  setInterval(function() {
    checkScrollDepth();
  }, 10000); // Every 10 seconds

  // Final check on unload
  window.addEventListener("beforeunload", function() {
    checkScrollDepth();
  });
})();
</script>`;
}
