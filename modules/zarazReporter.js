export function buildZarazReporterScript(endpoint) {
  return `
<script>
(function() {
  var EP = ${JSON.stringify(endpoint)};

  // ════════════════════════════════════════════════
  // GA4 STANDARD PARAMETERS & DEVICE INFO
  // ════════════════════════════════════════════════

  /**
   * Get or create session ID
   */
  function getSessionId() {
    var sid = sessionStorage.getItem("cmp_session_id");
    if (!sid) {
      sid = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("cmp_session_id", sid);
    }
    return sid;
  }

  /**
   * Parse User-Agent for device info
   */
  function parseUA() {
    var ua = navigator.userAgent.toLowerCase();
    var result = {
      browser: ua.includes("firefox") ? "firefox" : ua.includes("edg") ? "edge"
               : ua.includes("chrome") ? "chrome" : ua.includes("safari") ? "safari" : "other",
      os: ua.includes("android") ? "android" : (ua.includes("iphone") || ua.includes("ipad")) ? "ios"
          : ua.includes("windows") ? "windows" : ua.includes("mac") ? "macos"
          : ua.includes("linux") ? "linux" : "other",
      device: (ua.includes("mobile") || ua.includes("iphone")) ? "mobile"
              : (ua.includes("tablet") || ua.includes("ipad")) ? "tablet" : "desktop"
    };
    return result;
  }

  /**
   * Get device parameters for GA4
   */
  function getDeviceParams() {
    var ua = parseUA();
    return {
      browser: ua.browser,
      operating_system: ua.os,
      device_category: ua.device,
      screen_resolution: window.screen ? (window.screen.width + "x" + window.screen.height) : null,
      language: navigator.language || "unknown"
    };
  }

  /**
   * Get UTM parameters from URL
   */
  function getUTMParams() {
    var params = new URLSearchParams(location.search);
    return {
      utm_source: params.get("utm_source") || null,
      utm_medium: params.get("utm_medium") || null,
      utm_campaign: params.get("utm_campaign") || null,
      utm_content: params.get("utm_content") || null,
      utm_term: params.get("utm_term") || null
    };
  }

  /**
   * Set global user properties in Zaraz
   */
  function setGlobalUserProperties() {
    if (!window.zaraz) return;

    // Get HTML lang attribute
    var language = document.documentElement.lang || navigator.language || "en";
    zaraz.set("user_language", language, { scope: "user" });

    // Get country from page context or default
    var country = document.querySelector("[data-user-country]")?.dataset?.userCountry || "unknown";
    zaraz.set("user_country", country, { scope: "user" });

    // Get user segment from page context
    var segment = document.querySelector("[data-user-segment]")?.dataset?.userSegment || "visitor";
    zaraz.set("user_segment", segment, { scope: "user" });

    // Get subscription status
    var subscriptionStatus = document.querySelector("[data-subscription-status]")?.dataset?.subscriptionStatus || "free";
    zaraz.set("subscription_status", subscriptionStatus, { scope: "user" });
  }

  /**
   * Set device properties in Zaraz session
   */
  function setDeviceProperties() {
    if (!window.zaraz) return;

    var deviceParams = getDeviceParams();
    Object.entries(deviceParams).forEach(function(entry) {
      var key = entry[0];
      var value = entry[1];
      if (value) {
        zaraz.set(key, value, { scope: "session" });
      }
    });
  }

  function hasAnalyticsConsent() {
    var c = document.cookie.split("; ").find(function(v){ return v.indexOf("consent=") === 0; });
    return !!(c && c.indexOf("analytics:true") !== -1);
  }

  /**
   * Enhanced emit with GA4 standard parameters
   */
  function emit(eventName, props) {
    var sessionId = getSessionId();
    var timestamp = Date.now();
    var deviceParams = getDeviceParams();
    var utmParams = getUTMParams();

    // Combine properties with GA4 standard parameters
    var ga4Props = Object.assign({}, props || {}, {
      // GA4 Required Parameters
      event_name: eventName,
      timestamp_micros: timestamp * 1000, // Convert to microseconds
      session_id: sessionId,
      engagement_time_msec: props?.engagement_time_msec || 100,

      // Device info
      browser: deviceParams.browser,
      operating_system: deviceParams.os,
      device_category: deviceParams.device,
      language: deviceParams.language,

      // Page context
      page_location: location.href,
      page_path: location.pathname,
      page_title: document.title,
      page_referrer: document.referrer || null,

      // UTM parameters
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_content: utmParams.utm_content,
      utm_term: utmParams.utm_term
    });

    var payload = {
      type: eventName,
      eventName: eventName,
      page: location.pathname + location.search,
      host: location.hostname,
      sessionId: sessionId,
      timestamp: timestamp,
      properties: ga4Props
    };

    if (hasAnalyticsConsent() && window.zaraz && typeof window.zaraz.track === "function") {
      window.zaraz.track(eventName, ga4Props);
    }

    if (hasAnalyticsConsent() && navigator.sendBeacon) {
      navigator.sendBeacon(EP, JSON.stringify(payload));
    }
  }

  function fireOnce(key, eventName, props) {
    var k = "cmp_evt_" + key;
    if (sessionStorage.getItem(k) === "1") return;
    sessionStorage.setItem(k, "1");
    emit(eventName, props);
  }

  function parseMoney(value) {
    if (!value) return null;
    var num = Number(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : null;
  }

  function detectEcommerceViews() {
    if (document.querySelector("[data-product-id], .product, .single-product")) {
      fireOnce("view_item:" + location.pathname, "view_item", {
        item_id: document.querySelector("[data-product-id]") && document.querySelector("[data-product-id]").getAttribute("data-product-id") || null,
        item_name: document.title
      });
    }

    if (document.querySelector(".products, .product-category, [data-item-list-name]")) {
      fireOnce("view_item_list:" + location.pathname, "view_item_list", {
        item_list_name: document.querySelector("[data-item-list-name]") && document.querySelector("[data-item-list-name]").getAttribute("data-item-list-name") || document.title
      });
    }

    if (document.querySelector(".woocommerce-checkout, form.checkout")) {
      fireOnce("begin_checkout:" + location.pathname, "begin_checkout", { currency: "USD" });
    }
  }

  function bindDelegatedEvents() {
    document.addEventListener("click", function(e) {
      var el = e.target && e.target.closest ? e.target.closest("a,button,[data-event-name],[data-ga4-event]") : null;
      if (!el) return;

      var evt = el.getAttribute("data-event-name") || el.getAttribute("data-ga4-event") || null;
      if (evt) {
        emit(evt, {
          item_id: el.getAttribute("data-item-id") || null,
          item_name: el.getAttribute("data-item-name") || null,
          value: parseMoney(el.getAttribute("data-value")),
          currency: el.getAttribute("data-currency") || null
        });
        return;
      }

      var txt = ((el.innerText || "") + " " + (el.getAttribute("aria-label") || "")).toLowerCase();
      var href = (el.getAttribute("href") || "").toLowerCase();

      if (txt.indexOf("add to cart") !== -1 || txt.indexOf("agregar") !== -1) {
        emit("add_to_cart", { item_name: document.title });
      }
      if (txt.indexOf("remove") !== -1 || txt.indexOf("eliminar") !== -1) {
        emit("remove_from_cart", { item_name: document.title });
      }
      if (href.indexOf("shipping") !== -1) {
        emit("add_shipping_info", { source: "navigation" });
      }
      if (href.indexOf("payment") !== -1) {
        emit("add_payment_info", { source: "navigation" });
      }
      if (el.hasAttribute("data-promo-id")) {
        emit("select_promotion", {
          promotion_id: el.getAttribute("data-promo-id"),
          promotion_name: el.getAttribute("data-promo-name") || null
        });
      }
      if (el.hasAttribute("data-item-id")) {
        emit("select_item", {
          item_id: el.getAttribute("data-item-id"),
          item_name: el.getAttribute("data-item-name") || null
        });
      }
    }, true);
  }

  function bindPurchaseSignals() {
    var body = document.body || document.documentElement;
    if (!body) return;

    var orderId = body.getAttribute("data-order-id") || null;
    var orderTotal = parseMoney(body.getAttribute("data-order-total"));
    var currency = body.getAttribute("data-order-currency") || "USD";

    if (orderId || location.pathname.indexOf("order-received") !== -1) {
      fireOnce("purchase:" + (orderId || location.pathname), "purchase", {
        transaction_id: orderId || null,
        value: orderTotal,
        currency: currency
      });
    }
  }

  // ════════════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════════════

  setGlobalUserProperties();
  setDeviceProperties();

  fireOnce("session_start", "session_start", {
    page_title: document.title,
    page_location: location.href
  });
  emit("view_promotion", { placement: "page_load" });
  detectEcommerceViews();
  bindDelegatedEvents();
  bindPurchaseSignals();

  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "hidden") {
      emit("user_engagement", { engagement_time_msec: Math.round(performance.now()) });
    }
  });
})();
</script>`
}
