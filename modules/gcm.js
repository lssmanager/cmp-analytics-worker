export function buildGCMScript(consent) {
  // Con googleConsentV2Default:true, Zaraz ya niega todo por defecto.
  // Solo necesitamos el UPDATE si ya hay cookie de consentimiento.
  if (!consent) return ""

  const update = {
    ad_storage         : consent.marketing  ? "granted" : "denied",
    ad_user_data       : consent.marketing  ? "granted" : "denied",
    ad_personalization : consent.marketing  ? "granted" : "denied",
    analytics_storage  : consent.analytics  ? "granted" : "denied"
  }

  return `
<script>
(function() {
  var U = ${JSON.stringify(update)};

  function applyUpdate() {
    if (window.zaraz) {
      zaraz.set("google_consent_update", U);
      window.dispatchEvent(new CustomEvent("cmp:analytics_consent_changed", {
        detail: { analytics: U.analytics_storage === "granted", marketing: U.ad_storage === "granted" }
      }));
    } else {
      setTimeout(applyUpdate, 100);
    }
  }

  /* Listener para actualización en tiempo real desde el banner */
  window.addEventListener("cmp:consent_updated", function(ev) {
    if (!ev.detail || !window.zaraz) return;
    var c = ev.detail;
    zaraz.set("google_consent_update", {
      ad_storage         : c.marketing  ? "granted" : "denied",
      ad_user_data       : c.marketing  ? "granted" : "denied",
      ad_personalization : c.marketing  ? "granted" : "denied",
      analytics_storage  : c.analytics  ? "granted" : "denied"
    });

    window.dispatchEvent(new CustomEvent("cmp:analytics_consent_changed", {
      detail: { analytics: !!c.analytics, marketing: !!c.marketing }
    }));

    if (!c.marketing) {
      ["_gcl_au", "_fbp"].forEach(function(name) {
        document.cookie = name + "=; Max-Age=0; Path=/";
      });
    }
  });

  applyUpdate();
})();
</script>`
}
