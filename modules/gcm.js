export function generateNonce() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
}

export function buildGCMScript(rawConsent, region, nonce) {
  const isEU = region === "eu"
  const isCA = region === "ca"
  const needsBanner = isEU || isCA

  const defaultAnalytics = needsBanner ? "denied" : "granted"
  const defaultAds       = needsBanner ? "denied" : "granted"

  const analyticsStorage = rawConsent?.analytics ? "granted" : "denied"
  const adStorage        = rawConsent?.marketing  ? "granted" : "denied"
  const adUserData       = rawConsent?.marketing  ? "granted" : "denied"
  const adPersonal       = rawConsent?.marketing  ? "granted" : "denied"

  const nonceAttr = nonce ? ` nonce="${nonce}"` : ""

  return `<script${nonceAttr}>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'analytics_storage':  '${defaultAnalytics}',
  'ad_storage':         '${defaultAds}',
  'ad_user_data':       '${defaultAds}',
  'ad_personalization': '${defaultAds}',
  'wait_for_update': 500
});
${isEU ? `gtag('consent','default',{'analytics_storage':'denied','ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','region':['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB']});` : ""}
${isCA ? `gtag('consent','default',{'analytics_storage':'denied','ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','region':['CA']});` : ""}
${rawConsent ? `gtag('consent','update',{'analytics_storage':'${analyticsStorage}','ad_storage':'${adStorage}','ad_user_data':'${adUserData}','ad_personalization':'${adPersonal}'});` : ""}
gtag('set','url_passthrough',true);
${!rawConsent?.marketing ? "gtag('set','ads_data_redaction',true);" : ""}
</script>`
}
