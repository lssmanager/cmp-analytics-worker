export async function blockScripts(response, consent) {
  return new HTMLRewriter()
    .on("script", {
      element(el) {
        const category = el.getAttribute("data-consent")
        if (!category) return
        if (!consent || !consent[category]) {
          const src = el.getAttribute("src")
          if (src) {
            el.setAttribute("type", "text/plain")
            el.setAttribute("data-src", src)
            el.removeAttribute("src")
          } else {
            el.setAttribute("type", "text/plain")
          }
        }
      }
    })
    .transform(response)
}

export async function restoreScriptsRuntime(response) {
  const script = `
<script>
(function() {
  function restore(cat) {
    var val = document.cookie.split("; ").find(function(v){ return v.startsWith("consent="); });
    if (!val || !val.includes(cat+":true")) return;
    document.querySelectorAll('script[data-consent="'+cat+'"][data-src]').forEach(function(s) {
      if (s.dataset.restored === "1") return;
      var n = document.createElement("script");
      n.src = s.dataset.src; n.async = true;
      s.dataset.restored = "1";
      document.head.appendChild(n);
    });
  }
  restore("analytics"); restore("marketing"); restore("preferences");
})();
</script>`
  return new HTMLRewriter()
    .on("body", { element(el) { el.append(script, { html: true }) } })
    .transform(response)
}
