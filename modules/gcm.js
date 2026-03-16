export function generateNonce() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
}

/**
 * Google Consent Mode (GCM) Configuration
 * Compliant with GA4 + Google Ads + GDPR/CCPA/CASL
 * Controls what data Google can collect based on user consent
 */
export function buildGCMScript(rawConsent, region, nonce) {
  const isEU = region === "eu"
  const isCA = region === "ca"
  const isUS = region === "us"
  const needsBanner = isEU || isCA

  // ═══════════════════════════════════════════════════════════════════════
  // DEFAULT CONSENT STATE (before user action)
  // ═══════════════════════════════════════════════════════════════════════

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

  // Track consent change in GA4
  gtag('event', 'consent_changed', {
    'analytics': updatedConsent.analytics ? 'granted' : 'denied',
    'marketing': updatedConsent.marketing ? 'granted' : 'denied',
    'preferences': updatedConsent.preferences ? 'granted' : 'denied'
  });
});

// Log initial consent state for debugging
console.log('[GCM] Consent Mode initialized for region: ${region}', {
  analytics: '${analyticsStorage}',
  ads: '${adStorage}',
  personalization: '${adPersonal}'
});
</script>`
}
