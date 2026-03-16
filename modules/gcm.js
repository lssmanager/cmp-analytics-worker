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

  const defaultAnalytics = needsBanner ? "denied" : "granted"
  const defaultAds       = needsBanner ? "denied" : "granted"

  // ═══════════════════════════════════════════════════════════════════════
  // USER CONSENT STATE (after user action)
  // ═══════════════════════════════════════════════════════════════════════

  const analyticsStorage = rawConsent?.analytics ? "granted" : "denied"
  const adStorage        = rawConsent?.marketing  ? "granted" : "denied"
  const adUserData       = rawConsent?.marketing  ? "granted" : "denied"
  const adPersonal       = rawConsent?.marketing  ? "granted" : "denied"

  // ═══════════════════════════════════════════════════════════════════════
  // PREFERENCES/FUNCTIONALITY CONSENT
  // ═══════════════════════════════════════════════════════════════════════

  const functionalityStorage = rawConsent?.preferences ? "granted" : "denied"

  const nonceAttr = nonce ? ` nonce="${nonce}"` : ""

  return `<script${nonceAttr}>
// ═════════════════════════════════════════════════════════════════════════
// GOOGLE CONSENT MODE (GA4 + Google Ads Compliance)
// ═════════════════════════════════════════════════════════════════════════

window.dataLayer = window.dataLayer || [];

function gtag() {
  dataLayer.push(arguments);
}

gtag('consent', 'default', {
  'ad_storage':           '${defaultAds}',
  'ad_user_data':         '${defaultAds}',
  'ad_personalization':   '${defaultAds}',
  'analytics_storage':    '${defaultAnalytics}',
  'functionality_storage': '${defaultAnalytics}',
  'personalization_storage': '${defaultAnalytics}',
  'security_storage':     'granted',
  'wait_for_update':      500
});

// ─── Regional Consent Configuration ───────────────────────────────────────
// EU + CA: All advertising/analytics denied by default until consent
// US: Assumed granted unless strict opt-in required
// Global: Assumed granted

${isEU ? `
// GDPR Compliance - EU countries
gtag('consent', 'default', {
  'analytics_storage':  'denied',
  'ad_storage':         'denied',
  'ad_user_data':       'denied',
  'ad_personalization': 'denied',
  'region': ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB']
});
` : ""}

${isCA ? `
// CASL/PIPEDA Compliance - Canada
gtag('consent', 'default', {
  'analytics_storage':  'denied',
  'ad_storage':         'denied',
  'ad_user_data':       'denied',
  'ad_personalization': 'denied',
  'region': ['CA']
});
` : ""}

// ─── User Consent Update (after banner action) ───────────────────────────
${rawConsent ? `
gtag('consent', 'update', {
  'ad_storage':           '${adStorage}',
  'ad_user_data':         '${adUserData}',
  'ad_personalization':   '${adPersonal}',
  'analytics_storage':    '${analyticsStorage}',
  'functionality_storage': '${functionalityStorage}',
  'personalization_storage': '${functionalityStorage}'
});

// Event to track consent update
gtag('event', 'consent_update', {
  'analytics_consent': ${rawConsent?.analytics ? "true" : "false"},
  'marketing_consent': ${rawConsent?.marketing ? "true" : "false"},
  'preferences_consent': ${rawConsent?.preferences ? "true" : "false"}
});
` : ""}

// ─── Google Ads/Analytics Configuration ──────────────────────────────────

// IP and user data passthrough (helps with matching)
gtag('set', {
  'url_passthrough': true,
  'allow_google_signals': ${rawConsent?.marketing ? "true" : "false"}
});

// Ads data redaction (redacts user IP in Google Ads if marketing consent denied)
${!rawConsent?.marketing ? "gtag('set', 'ads_data_redaction', true);" : ""}

// ─── Session-level consent tracking ──────────────────────────────────────

// Set user properties for audience segmentation
gtag('config', 'GA_MEASUREMENT_ID', {
  'anonymize_ip': true,
  'allow_google_signals': ${rawConsent?.marketing ? "true" : "false"},
  'cookie_flags': 'SameSite=None;Secure'
});

// ─── Consent State Change Listener (for banner interactions) ──────────────

window.addEventListener('cmp:consent_updated', function(e) {
  var updatedConsent = e.detail || {};

  gtag('consent', 'update', {
    'ad_storage':           updatedConsent.marketing ? 'granted' : 'denied',
    'ad_user_data':         updatedConsent.marketing ? 'granted' : 'denied',
    'ad_personalization':   updatedConsent.marketing ? 'granted' : 'denied',
    'analytics_storage':    updatedConsent.analytics ? 'granted' : 'denied',
    'functionality_storage': updatedConsent.preferences ? 'granted' : 'denied'
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
