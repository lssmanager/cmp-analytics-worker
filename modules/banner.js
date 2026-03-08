export function buildBannerHTML({ region, consent, endpoint, legalHubPath }) {
  const shown = !consent || (!consent.analytics && !consent.marketing)

  const msgs = {
    eu:     "To provide the best experiences, we use technologies like cookies to store and/or access device information. Consenting to these technologies will allow us to process data such as browsing behavior or unique IDs on this site.",
    us:     "You may opt out of the sale or sharing of your personal data under CCPA. We use cookies to improve your experience.",
    ca:     "We require your consent to use cookies under Canadian privacy law. You can choose which categories to accept.",
    global: "To provide the best experiences, we use technologies like cookies to store and/or access device information."
  }

  return `
<style>
  #cmp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(2, 28, 68, 0.55);
    z-index: 999998;
    display: ${shown ? "flex" : "none"};
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  #cmp-modal {
    background: #ffffff;
    border-radius: 12px;
    max-width: 480px;
    width: calc(100% - 32px);
    padding: 28px 28px 24px;
    box-shadow: 0 20px 60px rgba(2, 28, 68, 0.18);
    position: relative;
    color: #021c44;
  }

  #cmp-close {
    position: absolute;
    top: 14px;
    right: 16px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #021c44;
    line-height: 1;
    padding: 4px;
  }

  #cmp-close:hover { color: #f3b723; }

  #cmp-logo {
    display: block;
    height: 36px;
    width: auto;
    margin-bottom: 16px;
  }

  #cmp-title {
    font-size: 16px;
    font-weight: 700;
    color: #021c44;
    margin: 0 0 10px;
  }

  #cmp-text {
    font-size: 13px;
    line-height: 1.6;
    color: #021c44;
    margin: 0 0 16px;
  }

  #cmp-links {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  #cmp-links a {
    font-size: 12px;
    color: #2259f2;
    text-decoration: underline;
    cursor: pointer;
  }

  #cmp-links a:hover { color: #f3b723; }

  #cmp-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 0;
  }

  .cmp-btn {
    flex: 1;
    min-width: 100px;
    padding: 11px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: background 0.2s, color 0.2s;
    text-align: center;
  }

  #cmp-btn-accept {
    background: #052490;
    color: #ffffff;
  }

  #cmp-btn-accept:hover { background: #f3b723; color: #021c44; }

  #cmp-btn-deny {
    background: #052490;
    color: #ffffff;
  }

  #cmp-btn-deny:hover { background: #f3b723; color: #021c44; }

  #cmp-btn-prefs {
    background: #f2f4f5;
    color: #021c44;
    border: 1px solid #d0d5dd;
  }

  #cmp-btn-prefs:hover { background: #f3b723; color: #021c44; border-color: #f3b723; }

  /* Panel de preferencias */
  #cmp-prefs-panel {
    display: none;
    margin-top: 16px;
    border-top: 1px solid #f2f4f5;
    padding-top: 16px;
  }

  #cmp-prefs-panel.open { display: block; }

  .cmp-check-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f2f4f5;
    font-size: 13px;
    color: #021c44;
  }

  .cmp-check-row:last-child { border-bottom: none; }

  .cmp-check-label { font-weight: 600; }

  .cmp-check-desc {
    font-size: 11px;
    color: #6b7280;
    margin-top: 2px;
  }

  /* Toggle switch */
  .cmp-toggle {
    position: relative;
    width: 40px;
    height: 22px;
    flex-shrink: 0;
    margin-left: 12px;
  }

  .cmp-toggle input { opacity: 0; width: 0; height: 0; }

  .cmp-slider {
    position: absolute;
    inset: 0;
    background: #d0d5dd;
    border-radius: 22px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .cmp-slider:before {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    left: 3px;
    top: 3px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .cmp-toggle input:checked + .cmp-slider { background: #052490; }
  .cmp-toggle input:checked + .cmp-slider:before { transform: translateX(18px); }
  .cmp-toggle input:disabled + .cmp-slider { background: #052490; opacity: 0.6; cursor: not-allowed; }

  #cmp-btn-save {
    margin-top: 14px;
    width: 100%;
    background: #052490;
    color: #ffffff;
  }

  #cmp-btn-save:hover { background: #f3b723; color: #021c44; }

  @media (max-width: 480px) {
    #cmp-modal { padding: 20px 16px 18px; }
    .cmp-btn { font-size: 13px; padding: 10px 10px; }
  }
</style>

<div id="cmp-overlay">
  <div id="cmp-modal" role="dialog" aria-modal="true" aria-labelledby="cmp-title">

    <button id="cmp-close" aria-label="Close">&#x2715;</button>

    <img
      id="cmp-logo"
      src="https://media.learnsocialstudies.com/wp-content/uploads/2026/03/Complianz%20Logo%20(1).avif"
      alt="Learn Social Studies"
      onerror="this.style.display='none'"
    />

    <p id="cmp-title">Manage Cookie Consent</p>

    <p id="cmp-text">${msgs[region] || msgs.global}</p>

    <div id="cmp-links">
      <a href="/cookie-policy-eu?cmplz_region_redirect=true">Cookie policy</a>
      <a href="/privacy-statement-eu?cmplz_region_redirect=true">Privacy statement</a>
      <a href="/disclaimer?cmplz_region_redirect=true">Imprint</a>
      <a href="${legalHubPath}">Manage services</a>
    </div>

    <div id="cmp-buttons">
      <button class="cmp-btn" id="cmp-btn-accept">Accept</button>
      <button class="cmp-btn" id="cmp-btn-deny">Deny</button>
      <button class="cmp-btn" id="cmp-btn-prefs">View preferences</button>
    </div>

    <!-- Panel de preferencias granulares -->
    <div id="cmp-prefs-panel">

      <div class="cmp-check-row">
        <div>
          <div class="cmp-check-label">Functional (required)</div>
          <div class="cmp-check-desc">Essential cookies for the site to work.</div>
        </div>
        <label class="cmp-toggle">
          <input type="checkbox" id="cmp-t-necessary" checked disabled>
          <span class="cmp-slider"></span>
        </label>
      </div>

      <div class="cmp-check-row">
        <div>
          <div class="cmp-check-label">Analytics</div>
          <div class="cmp-check-desc">Help us understand how visitors interact with the site.</div>
        </div>
        <label class="cmp-toggle">
          <input type="checkbox" id="cmp-t-analytics" ${consent?.analytics ? "checked" : ""}>
          <span class="cmp-slider"></span>
        </label>
      </div>

      <div class="cmp-check-row">
        <div>
          <div class="cmp-check-label">Marketing</div>
          <div class="cmp-check-desc">Used to deliver relevant ads and track campaign effectiveness.</div>
        </div>
        <label class="cmp-toggle">
          <input type="checkbox" id="cmp-t-marketing" ${consent?.marketing ? "checked" : ""}>
          <span class="cmp-slider"></span>
        </label>
      </div>

      <div class="cmp-check-row">
        <div>
          <div class="cmp-check-label">Preferences</div>
          <div class="cmp-check-desc">Remember your settings and personalize your experience.</div>
        </div>
        <label class="cmp-toggle">
          <input type="checkbox" id="cmp-t-preferences" ${consent?.preferences ? "checked" : ""}>
          <span class="cmp-slider"></span>
        </label>
      </div>

      <button class="cmp-btn" id="cmp-btn-save">Save preferences</button>
    </div>

  </div>
</div>

<script>
(function() {
  var EP = ${JSON.stringify(endpoint)};

  async function cmpSend(payload) {
    try {
      var res = await fetch(EP, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return;
      window.dispatchEvent(new CustomEvent("cmp:consent_updated", { detail: payload }));
      if (window.zaraz) {
        zaraz.set("google_consent_update", {
          ad_storage         : payload.marketing  ? "granted" : "denied",
          ad_user_data       : payload.marketing  ? "granted" : "denied",
          ad_personalization : payload.marketing  ? "granted" : "denied",
          analytics_storage  : payload.analytics  ? "granted" : "denied"
        });
      }
      document.getElementById("cmp-overlay").style.display = "none";
      setTimeout(function() { location.reload(); }, 300);
    } catch(e) {}
  }

  function g(id) { return document.getElementById(id); }

  g("cmp-close") && g("cmp-close").addEventListener("click", function() {
    cmpSend({ necessary:true, analytics:false, marketing:false, preferences:false });
  });

  g("cmp-btn-accept") && g("cmp-btn-accept").addEventListener("click", function() {
    cmpSend({ necessary:true, analytics:true, marketing:true, preferences:true });
  });

  g("cmp-btn-deny") && g("cmp-btn-deny").addEventListener("click", function() {
    cmpSend({ necessary:true, analytics:false, marketing:false, preferences:false });
  });

  g("cmp-btn-prefs") && g("cmp-btn-prefs").addEventListener("click", function() {
    var panel = g("cmp-prefs-panel");
    panel.classList.toggle("open");
  });

  g("cmp-btn-save") && g("cmp-btn-save").addEventListener("click", function() {
    cmpSend({
      necessary   : true,
      analytics   : !!(g("cmp-t-analytics")   && g("cmp-t-analytics").checked),
      marketing   : !!(g("cmp-t-marketing")   && g("cmp-t-marketing").checked),
      preferences : !!(g("cmp-t-preferences") && g("cmp-t-preferences").checked)
    });
  });
})();
</script>`
}

export async function injectBanner(response, options) {
  const html = buildBannerHTML(options)
  return new HTMLRewriter()
    .on("body", { element(el) { el.append(html, { html: true }) } })
    .transform(response)
}
