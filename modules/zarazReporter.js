export function buildZarazScript({ consent, geo, sessionId, region }) {
  const ctx = JSON.stringify({
    session_id : sessionId        || "",
    country    : geo?.country     || "",
    region     : region           || "global",
    analytics  : !!(consent?.analytics),
    marketing  : !!(consent?.marketing),
  })

  return `<script>
(function(){
  function waitZaraz(fn, tries) {
    if (window.zaraz) { fn(); return; }
    if ((tries||0) > 20) return;
    setTimeout(() => waitZaraz(fn, (tries||0)+1), 200);
  }
  waitZaraz(function(){
  var ctx = ${ctx};

  /* ── 1. zaraz.set() — propiedades globales persistentes ── */
  zaraz.set("session_id",  ctx.session_id,  { scope: "session" });
  zaraz.set("country",     ctx.country,     { scope: "session" });
  zaraz.set("privacy_region", ctx.region,  { scope: "session" });
  zaraz.set("consent_analytics", ctx.analytics, { scope: "page" });
  zaraz.set("consent_marketing", ctx.marketing, { scope: "page" });

  /* ── 2. zaraz.track("pageview") ── */
  zaraz.track("pageview", {
    page     : location.pathname,
    title    : document.title,
    referrer : document.referrer,
    url      : location.href
  });

  /* ── 3. zaraz.track("campaign_hit") — UTM ── */
  var p = new URLSearchParams(location.search);
  if (p.get("utm_source")) {
    zaraz.track("campaign_hit", {
      utm_source   : p.get("utm_source")   || "",
      utm_medium   : p.get("utm_medium")   || "",
      utm_campaign : p.get("utm_campaign") || "",
      utm_content  : p.get("utm_content")  || "",
      utm_term     : p.get("utm_term")     || "",
      page         : location.pathname
    });
  }

  /* ── 4. zaraz.track("consent_loaded") ── */
  zaraz.track("consent_loaded", {
    analytics : ctx.analytics,
    marketing : ctx.marketing,
    region    : ctx.region
  });

  /* ── 5. zaraz.track("scroll_depth") — 25/50/75/90 ── */
  var seen = {};
  window.addEventListener("scroll", function () {
    var el  = document.documentElement;
    var pct = Math.round(el.scrollTop / (el.scrollHeight - el.clientHeight) * 100);
    [25, 50, 75, 90].forEach(function (m) {
      if (pct >= m && !seen[m]) {
        seen[m] = true;
        zaraz.track("scroll_depth", { depth: m, page: location.pathname });
      }
    });
  }, { passive: true });

  /* ── 6. zaraz.track("time_on_page") — al salir ── */
  var t0 = Date.now();
  window.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      zaraz.track("time_on_page", {
        seconds : Math.round((Date.now() - t0) / 1000),
        page    : location.pathname
      });
    }
  });

  /* ── 7. zaraz.track("click") ── */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("a, button, [data-track]");
    if (!el) return;
    zaraz.track("click", {
      id    : el.id       || "",
      cls   : el.className || "",
      href  : el.href     || "",
      text  : (el.innerText || "").slice(0, 60),
      page  : location.pathname
    });
  });

  /* ── 8. zaraz.ecommerce() — WooCommerce ── */
  document.addEventListener("wc_add_to_cart", function (e) {
    var d = e.detail || {};
    zaraz.ecommerce("Product Added", {
      product_id : String(d.product_id || ""),
      name       : d.product_name || "",
      price      : parseFloat(d.product_price) || 0,
      quantity   : parseInt(d.quantity) || 1,
      currency   : "USD"
    });
  });

  /* Product Viewed — páginas de producto WooCommerce */
  if (document.body.classList.contains("single-product")) {
    var pid  = (document.querySelector("[data-product_id]") || {}).dataset || {};
    var name = (document.querySelector(".product_title") || {}).innerText || "";
    var priceEl = document.querySelector(".price .woocommerce-Price-amount");
    zaraz.ecommerce("Product Viewed", {
      product_id : pid.product_id || "",
      name       : name,
      price      : parseFloat((priceEl || {}).innerText) || 0,
      currency   : "USD"
    });
  }

  /* Cart Viewed */
  if (document.body.classList.contains("woocommerce-cart")) {
    zaraz.ecommerce("Cart Viewed", {});
  }

  /* Checkout Started */
  if (document.body.classList.contains("woocommerce-checkout")) {
    zaraz.ecommerce("Checkout Started", {
      step : 1
    });
  }

  /* Order Completed — página thank you */
  if (document.body.classList.contains("woocommerce-order-received")) {
    var orderId = (document.querySelector("[data-order-id]") || {}).dataset || {};
    var total   = (document.querySelector(".woocommerce-order-overview__total .woocommerce-Price-amount") || {}).innerText || "0";
    zaraz.ecommerce("Order Completed", {
      order_id : orderId.orderId || "",
      total    : parseFloat(total.replace(/[^0-9.]/g, "")) || 0,
      currency : "USD"
    });
  }

  }, 0); // end waitZaraz
})();
</script>`
}
