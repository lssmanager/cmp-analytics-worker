export function buildFormTrackerScript(endpoint) {
  return `
<script>
(function() {
  var EP = ${JSON.stringify(endpoint)};
  var started = new Map();
  var submitted = new Set();

  function hasAnalyticsConsent() {
    var c = document.cookie.split("; ").find(function(v){ return v.indexOf("consent=") === 0; });
    return !!(c && c.indexOf("analytics:true") !== -1);
  }

  function formMeta(form) {
    var id = form.getAttribute("id") || "anonymous_form";
    var name = form.getAttribute("name") || id;
    var fields = Array.prototype.slice.call(form.querySelectorAll("input,select,textarea"));
    var fieldNames = fields.map(function(el) { return el.name || el.id || el.type || "field"; }).slice(0, 40);
    var type = "generic";
    var s = (id + " " + name + " " + fieldNames.join(" ")).toLowerCase();
    if (s.indexOf("contact") >= 0) type = "contact";
    else if (s.indexOf("newsletter") >= 0 || s.indexOf("subscribe") >= 0) type = "newsletter";
    else if (s.indexOf("demo") >= 0) type = "demo";

    return {
      form_id: id,
      form_name: name,
      form_type: type,
      form_field_count: fields.length,
      form_field_names: fieldNames,
      form_location: form.closest("[role='dialog'], .modal, .sidebar") ? "modal_or_sidebar" : "page"
    };
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
    if (navigator.sendBeacon) {
      navigator.sendBeacon(EP, JSON.stringify(payload));
    }
  }

  document.addEventListener("focusin", function(e) {
    var form = e.target && e.target.form;
    if (!form) return;
    var meta = formMeta(form);
    if (started.has(meta.form_id)) return;
    started.set(meta.form_id, { meta: meta, at: Date.now(), lastField: e.target.name || e.target.id || null });
    emit("form_start", meta);
  }, true);

  document.addEventListener("input", function(e) {
    var form = e.target && e.target.form;
    if (!form) return;
    var id = form.getAttribute("id") || "anonymous_form";
    var rec = started.get(id);
    if (!rec) return;
    rec.lastField = e.target.name || e.target.id || rec.lastField;
  }, true);

  document.addEventListener("submit", function(e) {
    var form = e.target;
    if (!form || form.tagName !== "FORM") return;
    var meta = formMeta(form);
    submitted.add(meta.form_id);

    emit("form_submit", meta);

    if (meta.form_type === "contact") emit("contact_form_submit", meta);
    if (meta.form_type === "newsletter") emit("newsletter_signup", meta);
    if (meta.form_type === "demo") emit("demo_request", meta);

    var hasValue = !!form.querySelector("[name*='value'], [name*='amount'], [name*='budget']");
    if (hasValue || meta.form_type !== "generic") {
      emit("lead_generation", meta);
    }
  }, true);

  window.addEventListener("beforeunload", function() {
    started.forEach(function(rec, formId) {
      if (submitted.has(formId)) return;
      emit("form_abandon", {
        form_id: formId,
        form_name: rec.meta.form_name,
        form_type: rec.meta.form_type,
        dropoff_field: rec.lastField,
        active_ms: Date.now() - rec.at
      });
    });
  });
})();
</script>`
}
