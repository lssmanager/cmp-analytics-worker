export function buildUTMScript(endpoint) {
  return `
<script>
(function() {
  var UTM_KEYS = [
    "utm_source","utm_medium","utm_campaign",
    "utm_content","utm_term","gclid","fbclid","ref"
  ];
  var params = new URLSearchParams(location.search);
  var utms = {}, found = false;

  UTM_KEYS.forEach(function(k) {
    if (params.has(k)) { utms[k] = params.get(k); found = true; }
  });

  if (found) {
    document.cookie = "cmp_utms=" +
      encodeURIComponent(JSON.stringify(utms)) +
      ";path=/;max-age=2592000;secure;domain=.learnsocialstudies.com";

    navigator.sendBeacon(${JSON.stringify(endpoint)}, JSON.stringify({
      type: "attribution", eventName: "utm_captured",
      page: location.pathname, properties: utms
    }));

    if (window.zaraz) {
      Object.keys(utms).forEach(function(k) {
        zaraz.set(k, utms[k]);
      });
    }
  }
})();
</script>`
}
