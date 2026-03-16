/**
 * formTracker.js - Form Submission & Lead Generation Tracking
 * Auto-detects forms, tracks full lifecycle, sends to analytics
 */

export function buildFormTrackerScript(endpoint = "/__cmp/analytics") {
  return `<script>
(function() {
  var endpoint = "${endpoint}";
  var formStarted = {};
  var formFieldCount = {};

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-DETECT & LABEL FORMS
  // ═══════════════════════════════════════════════════════════════════════

  function classifyFormType(form) {
    var html = form.outerHTML.toLowerCase();
    var fieldNames = Array.from(form.querySelectorAll("input, textarea")).map(f => f.name || f.id).join(" ").toLowerCase();

    // Contact form
    if (html.includes("contact") || fieldNames.includes("message") || fieldNames.includes("phone")) {
      return "contact";
    }

    // Signup form
    if (html.includes("signup") || html.includes("register") || fieldNames.includes("password")) {
      return "signup";
    }

    // Newsletter
    if (html.includes("newsletter") || html.includes("subscribe")) {
      return "newsletter";
    }

    // Demo request
    if (html.includes("demo") || html.includes("trial")) {
      return "demo";
    }

    // Checkout (WooCommerce)
    if (form.classList.contains("checkout") || html.includes("payment")) {
      return "checkout";
    }

    // Search
    if (form.method === "get" && (html.includes("search") || fieldNames.includes("s") || fieldNames.includes("q"))) {
      return "search";
    }

    return "contact"; // default
  }

  function getFormId(form) {
    return form.id || form.name || form.dataset.formId || "form_" + Date.now();
  }

  function getFormName(form) {
    return form.dataset.formName || form.getAttribute("aria-label") || form.name || classifyFormType(form);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FORM START DETECTION (First field focus)
  // ═══════════════════════════════════════════════════════════════════════

  document.addEventListener("focusin", function(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
      var form = e.target.closest("form");
      if (!form) return;

      var formId = getFormId(form);

      if (!formStarted[formId]) {
        formStarted[formId] = {
          startTime: Date.now(),
          firstField: e.target.name || e.target.id,
          fieldCount: form.querySelectorAll("input, textarea, select").length
        };

        var formType = classifyFormType(form);
        var formName = getFormName(form);

        // Send form_start event
        navigator.sendBeacon(endpoint, JSON.stringify({
          type: "form_start",
          eventName: "Form Started",
          page: location.pathname,
          sessionId: getCookie("cmp_uid"),
          properties: {
            form_id: formId,
            form_name: formName,
            form_type: formType,
            field_count: formStarted[formId].fieldCount,
            first_field: formStarted[formId].firstField
          }
        }));
      }
    }
  }, { passive: true });

  // ═══════════════════════════════════════════════════════════════════════
  // FORM SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════

  document.addEventListener("submit", function(e) {
    if (e.target.tagName !== "FORM") return;

    var form = e.target;
    var formId = getFormId(form);
    var formType = classifyFormType(form);
    var formName = getFormName(form);
    var startData = formStarted[formId] || {};

    var timeSpent = startData.startTime ? Math.round((Date.now() - startData.startTime) / 1000) : 0;

    // Collect form field values (non-sensitive)
    var formData = new FormData(form);
    var values = {};
    for (let [key, value] of formData.entries()) {
      if (!["password", "cc", "cvv", "card", "creditcard"].some(s => key.toLowerCase().includes(s))) {
        values[key] = String(value).slice(0, 50);
      }
    }

    // Send form_submit event
    navigator.sendBeacon(endpoint, JSON.stringify({
      type: "form_submit",
      eventName: "Form Submitted",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        form_id: formId,
        form_name: formName,
        form_type: formType,
        time_spent_seconds: timeSpent,
        field_values: Object.keys(values).join(","),
        field_count: form.querySelectorAll("input, textarea, select").length
      }
    }));

    // Lead generation if form has monetary value
    var leadValue = form.dataset.leadValue || parseFloat(form.querySelector("[data-lead-value]")?.dataset.leadValue) || 0;
    if (leadValue > 0 || ["checkout", "demo", "contact"].includes(formType)) {
      navigator.sendBeacon(endpoint, JSON.stringify({
        type: "lead_generation",
        eventName: "Lead Generated",
        page: location.pathname,
        sessionId: getCookie("cmp_uid"),
        properties: {
          value: leadValue,
          currency: form.dataset.currency || "USD",
          lead_type: formType,
          form_id: formId,
          form_name: formName
        }
      }));
    }

    // Delete form starter reference
    delete formStarted[formId];
  });

  // ═══════════════════════════════════════════════════════════════════════
  // FORM ABANDON DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  window.addEventListener("beforeunload", function() {
    Object.keys(formStarted).forEach(function(formId) {
      var form = document.querySelector("#" + formId + ", [name='" + formId + "']");
      if (form && form.querySelectorAll("input:filled, textarea:not(:empty)").length > 0) {
        // Form had input but wasn't submitted
        var startData = formStarted[formId];
        var lastFieldEl = document.activeElement;

        navigator.sendBeacon(endpoint, JSON.stringify({
          type: "form_abandon",
          eventName: "Form Abandoned",
          page: location.pathname,
          sessionId: getCookie("cmp_uid"),
          properties: {
            form_id: formId,
            last_field: lastFieldEl?. name || lastFieldEl?.id || "unknown",
            time_spent_seconds: Math.round((Date.now() - startData.startTime) / 1000)
          }
        }));
      }
    });
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
