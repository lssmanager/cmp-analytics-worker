/**
 * Zaraz Analytics Reporter - GA4 Complete Event Tracking
 * Replaces Analytify with native GA4 standard events
 * Sends real-time events to Google Analytics 4 + Google Ads
 */

export function buildZarazScript({ consent, geo, sessionId, region }) {
  const ctx = JSON.stringify({
    session_id: sessionId || "",
    country: geo?.country || "",
    timezone: geo?.timezone || "",
    region: region || "global",
    analytics: !!(consent?.analytics),
    marketing: !!(consent?.marketing),
    preferences: !!(consent?.preferences),
  })

  return `<script>
(function(){
  // ═══════════════════════════════════════════════════════════════════════
  // ZARAZ INITIALIZATION & CONTEXT
  // ═══════════════════════════════════════════════════════════════════════

  function waitZaraz(fn, tries) {
    if (window.zaraz) { fn(); return; }
    if ((tries||0) > 20) return;
    setTimeout(() => waitZaraz(fn, (tries||0)+1), 200);
  }

  waitZaraz(function(){
    var ctx = ${ctx};

    // ═ GLOBAL CONTEXT — Set once per session ═
    zaraz.set("session_id", ctx.session_id, { scope: "session" });
    zaraz.set("country", ctx.country, { scope: "session" });
    zaraz.set("timezone", ctx.timezone, { scope: "session" });
    zaraz.set("privacy_region", ctx.region, { scope: "session" });
    zaraz.set("consent_analytics", ctx.analytics, { scope: "page" });
    zaraz.set("consent_marketing", ctx.marketing, { scope: "page" });
    zaraz.set("consent_preferences", ctx.preferences, { scope: "page" });

    // ═══════════════════════════════════════════════════════════════════════
    // 1. PAGEVIEW & SESSION (GA4 Standard)
    // ═══════════════════════════════════════════════════════════════════════

    zaraz.track("page_view", {
      page_title: document.title,
      page_path: location.pathname,
      page_location: location.href,
      page_referrer: document.referrer
    });

    // Session start indicator (first page only)
    if (!window.cmpAnalyticsSessionStarted) {
      window.cmpAnalyticsSessionStarted = true;
      zaraz.track("session_start", {
        session_id: ctx.session_id
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. CAMPAIGN & ATTRIBUTION (UTM Tracking)
    // ═══════════════════════════════════════════════════════════════════════

    var p = new URLSearchParams(location.search);
    if (p.get("utm_source")) {
      zaraz.track("campaign_hit", {
        utm_source: p.get("utm_source") || "",
        utm_medium: p.get("utm_medium") || "",
        utm_campaign: p.get("utm_campaign") || "",
        utm_content: p.get("utm_content") || "",
        utm_term: p.get("utm_term") || "",
        page_path: location.pathname
      });
    }

    // gclid / fbclid attribution
    if (p.get("gclid")) zaraz.set("gclid", p.get("gclid"));
    if (p.get("fbclid")) zaraz.set("fbclid", p.get("fbclid"));

    // ═══════════════════════════════════════════════════════════════════════
    // 3. CONSENT & COMPLIANCE Event
    // ═══════════════════════════════════════════════════════════════════════

    zaraz.track("consent_loaded", {
      analytics_consent: ctx.analytics,
      marketing_consent: ctx.marketing,
      preferences_consent: ctx.preferences,
      consent_region: ctx.region
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 4. ENGAGEMENT TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    // Scroll Depth (25%, 50%, 75%, 90%)
    var scrollSeen = {};
    window.addEventListener("scroll", function () {
      var el = document.documentElement;
      var pct = Math.round(el.scrollTop / (el.scrollHeight - el.clientHeight) * 100);
      [25, 50, 75, 90].forEach(function (m) {
        if (pct >= m && !scrollSeen[m]) {
          scrollSeen[m] = true;
          zaraz.track("scroll", {
            percent_scrolled: m,
            page_path: location.pathname
          });
        }
      });
    }, { passive: true });

    // Time on Page (when leaving tab)
    var pageStartTime = Date.now();
    window.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        var timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
        zaraz.track("user_engagement", {
          engagement_time_msec: timeSpent * 1000,
          page_path: location.pathname
        });
      }
    });

    // Click Tracking
    document.addEventListener("click", function (e) {
      var el = e.target.closest("a, button, [data-track]");
      if (!el) return;

      var href = el.href || el.dataset.href || "";
      var text = (el.innerText || el.textContent || "").slice(0, 100).trim();
      var id = el.id || el.dataset.eventId || "";

      zaraz.track("click", {
        link_id: id,
        link_url: href,
        link_text: text,
        element_class: el.className,
        page_path: location.pathname
      });
    }, { passive: true });

    // ═══════════════════════════════════════════════════════════════════════
    // 5. FORM TRACKING (Auto-detect all forms)
    // ═══════════════════════════════════════════════════════════════════════

    document.addEventListener("focusin", function (e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        var form = e.target.closest("form");
        if (form) {
          var formId = form.id || form.dataset.formId || "unknown";
          var formName = form.dataset.formName || form.name || formId;
          var formType = form.dataset.formType || "contact";

          // Fire form_start only once per form
          var trackKey = "cmpFormStarted_" + formId;
          if (!window[trackKey]) {
            window[trackKey] = true;
            zaraz.track("form_start", {
              form_id: formId,
              form_name: formName,
              form_type: formType
            });
          }
        }
      }
    }, { passive: true });

    // Form submission
    document.addEventListener("submit", function (e) {
      if (e.target.tagName === "FORM") {
        var form = e.target;
        var formId = form.id || form.dataset.formId || "unknown";
        var formName = form.dataset.formName || form.name || formId;
        var formType = form.dataset.formType || "contact";

        zaraz.track("form_submit", {
          form_id: formId,
          form_name: formName,
          form_type: formType,
          form_destination: form.action || location.href
        });

        // Lead generation if form has value
        if (form.dataset.leadValue) {
          zaraz.track("lead_generation", {
            value: parseFloat(form.dataset.leadValue) || 0,
            currency: form.dataset.currency || "USD",
            lead_type: formType,
            form_id: formId
          });
        }
      }
    }, { passive: true });

    // ═══════════════════════════════════════════════════════════════════════
    // 6. E-COMMERCE TRACKING (WooCommerce)
    // ═══════════════════════════════════════════════════════════════════════

    // View Item (product page)
    if (document.body.classList.contains("single-product")) {
      var pid = (document.querySelector("[data-product_id]") || {}).dataset || {};
      var pname = (document.querySelector(".product_title") || {}).innerText || "";
      var ppriceEl = document.querySelector(".price .woocommerce-Price-amount");
      var pprice = parseFloat((ppriceEl || {}).innerText) || 0;
      var pcategory = (document.querySelector(".posted_in a") || {}).innerText || "";

      zaraz.track("view_item", {
        items: [{
          item_id: pid.product_id || "",
          item_name: pname,
          price: pprice,
          currency: "USD",
          item_category: pcategory
        }],
        value: pprice,
        currency: "USD"
      });
    }

    // View Item List (product category/shop)
    if (document.body.classList.contains("archive") || document.body.classList.contains("shop")) {
      var products = document.querySelectorAll(".product");
      if (products.length > 0) {
        zaraz.track("view_item_list", {
          item_list_name: document.querySelector("h1")?.innerText || "Products",
          page_path: location.pathname,
          item_count: products.length
        });
      }
    }

    // Add to Cart
    document.addEventListener("wc_add_to_cart", function (e) {
      var d = e.detail || {};
      zaraz.track("add_to_cart", {
        items: [{
          item_id: String(d.product_id || ""),
          item_name: d.product_name || "",
          price: parseFloat(d.product_price) || 0,
          quantity: parseInt(d.quantity) || 1,
          currency: "USD"
        }],
        value: (parseFloat(d.product_price) * parseInt(d.quantity)) || 0,
        currency: "USD"
      });
    });

    // Remove from Cart
    document.addEventListener("wc_remove_from_cart", function (e) {
      var d = e.detail || {};
      zaraz.track("remove_from_cart", {
        items: [{
          item_id: String(d.product_id || ""),
          item_name: d.product_name || "",
          price: parseFloat(d.product_price) || 0,
          currency: "USD"
        }],
        value: parseFloat(d.product_price) || 0,
        currency: "USD"
      });
    });

    // View Cart
    if (document.body.classList.contains("woocommerce-cart")) {
      var cartItems = document.querySelectorAll("tr[data-product_id]");
      zaraz.track("view_cart", {
        item_count: cartItems.length,
        page_path: location.pathname
      });
    }

    // Begin Checkout
    if (document.body.classList.contains("woocommerce-checkout")) {
      zaraz.track("begin_checkout", {
        page_path: location.pathname
      });
    }

    // Purchase (Order Received page)
    if (document.body.classList.contains("woocommerce-order-received")) {
      var orderId = (document.querySelector("[data-order-id]") || {}).dataset || {};
      var totalEl = document.querySelector(".woocommerce-order-overview__total .woocommerce-Price-amount");
      var total = parseFloat((totalEl || {}).innerText?.replace(/[^0-9.]/g, "")) || 0;

      zaraz.track("purchase", {
        transaction_id: orderId.orderId || String(Date.now()),
        value: total,
        currency: "USD",
        page_path: location.pathname
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. E-LEARNING TRACKING (Moodle LMS)
    // ═══════════════════════════════════════════════════════════════════════

    // Detect Moodle context
    var courseEl = document.querySelector("[data-courseid], .course-item");
    var courseId = courseEl?.dataset?.courseid || "";
    var courseName = (document.querySelector(".course-title, .coursename") || {}).innerText || "";

    if (courseId) {
      // Course page detected
      zaraz.track("course_enrollment", {
        course_id: courseId,
        course_name: courseName,
        page_path: location.pathname
      });
    }

    // Lesson / Module tracking
    var lessonEl = document.querySelector("[data-lessonid], .lesson-content");
    if (lessonEl) {
      var lessonId = lessonEl.dataset.lessonid || "";
      var lessonName = (document.querySelector(".lesson-title") || {}).innerText || "";

      zaraz.track("lesson_start", {
        lesson_id: lessonId,
        lesson_name: lessonName,
        course_id: courseId,
        page_path: location.pathname
      });
    }

    // Quiz detection
    if (document.body.classList.contains("quiz") || document.querySelector(".quiz-container")) {
      var quizId = (document.querySelector("[data-quizid]") || {}).dataset?.quizid || "";
      var quizName = (document.querySelector(".quiz-title, .quizname") || {}).innerText || "";

      zaraz.track("quiz_start", {
        quiz_id: quizId,
        quiz_name: quizName,
        course_id: courseId,
        page_path: location.pathname
      });

      // Listen for quiz submission
      document.addEventListener("quizSubmitted", function (e) {
        var score = e.detail?.score || 0;
        var passingScore = e.detail?.passingScore || 0;

        zaraz.track("quiz_complete", {
          quiz_id: quizId,
          score: score,
          passing_score: passingScore,
          page_path: location.pathname
        });

        if (score < passingScore) {
          zaraz.track("quiz_fail", {
            quiz_id: quizId,
            score: score,
            passing_score: passingScore
          });
        }
      }, { once: true });
    }

    // Assignment detection
    if (document.body.classList.contains("assignment") || document.querySelector(".assignment-container")) {
      var assignmentId = (document.querySelector("[data-assignmentid]") || {}).dataset?.assignmentid || "";
      var assignmentName = (document.querySelector(".assignment-title") || {}).innerText || "";

      document.addEventListener("assignmentSubmitted", function (e) {
        zaraz.track("assignment_submit", {
          assignment_id: assignmentId,
          assignment_name: assignmentName,
          course_id: courseId,
          submission_type: e.detail?.type || "text"
        });
      }, { once: true });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 8. SEARCH TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    // Detect search on results page
    var searchParams = new URLSearchParams(location.search);
    if (searchParams.has("s") || searchParams.has("q") || location.pathname.includes("/search")) {
      var searchTerm = searchParams.get("s") || searchParams.get("q") || "";
      var resultCount = document.querySelectorAll(".post, .product, .course-item, .search-result").length;

      zaraz.track("search", {
        search_term: searchTerm,
        search_result_count: resultCount,
        page_path: location.pathname
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 9. VIDEO TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    // HTML5 video tracking
    document.querySelectorAll("video").forEach(function (video, idx) {
      var videoId = video.id || "video_" + idx;
      var videoTitle = video.dataset.title || (document.querySelector("h1, .video-title") || {}).innerText || "Unnamed Video";

      video.addEventListener("play", function () {
        zaraz.track("video_start", {
          video_id: videoId,
          video_title: videoTitle,
          video_duration: Math.round(video.duration)
        });
      }, { once: true });

      video.addEventListener("ended", function () {
        zaraz.track("video_complete", {
          video_id: videoId,
          video_title: videoTitle,
          video_duration: Math.round(video.duration)
        });
      }, { once: true });

      // Progress tracking (25%, 50%, 75%)
      var progressTracked = {};
      video.addEventListener("timeupdate", function () {
        var percent = Math.round((video.currentTime / video.duration) * 100);
        [25, 50, 75].forEach(function (p) {
          if (percent >= p && !progressTracked[p]) {
            progressTracked[p] = true;
            zaraz.track("video_progress", {
              video_id: videoId,
              progress_percent: p,
              video_duration: Math.round(video.duration)
            });
          }
        });
      }, { passive: true });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 10. ERROR TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    window.addEventListener("error", function (e) {
      zaraz.track("page_error", {
        error_type: e.error?.name || "Error",
        error_message: (e.error?.message || e.message || "").slice(0, 256),
        error_source: e.filename || location.pathname,
        error_line: e.lineno || 0
      });
    });

    window.addEventListener("unhandledrejection", function (e) {
      zaraz.track("page_error", {
        error_type: "UnhandledRejection",
        error_message: (e.reason?.message || String(e.reason) || "").slice(0, 256),
        error_source: location.pathname
      });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 11. MOODLE EVENT LISTENERS (Custom Events)
    // ═══════════════════════════════════════════════════════════════════════

    // Listen for native Moodle events
    document.addEventListener("cm_event_course_completed", function (e) {
      zaraz.track("course_progress", {
        course_id: e.detail?.courseid || courseId,
        progress_percent: 100
      });
    });

    document.addEventListener("cm_event_lesson_completed", function (e) {
      zaraz.track("lesson_complete", {
        lesson_id: e.detail?.lessonid || "",
        lesson_name: e.detail?.lessonname || "",
        course_id: courseId
      });
    });

  }, 0); // end waitZaraz
})();
</script>`
}
