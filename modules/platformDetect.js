import { MOODLE_COOKIES, WC_COOKIES, WP_COOKIES } from "./regions.js"

export function detectPlatforms(request) {
  const url     = new URL(request.url)
  const path    = url.pathname.toLowerCase()
  const cookies = request.headers.get("cookie") || ""
  const has     = (names) => names.some(n => cookies.includes(n))
  const isBuddyBossPath = ["/members/", "/groups/", "/forums/", "/activity/", "/profile/"]
    .some(fragment => path.includes(fragment))
  const isGamipressPath = ["/achievements", "/points", "/ranks", "/badges"]
    .some(fragment => path.includes(fragment))

  return {
    isMoodle       : url.hostname === "lms.learnsocialstudies.com" || has(MOODLE_COOKIES),
    isWooCommerce  : has(WC_COOKIES),
    isWordPress    : has(WP_COOKIES),
    isBuddyBoss    : isBuddyBossPath || path.includes("/buddyboss") ||
                     (has(WP_COOKIES) && path.includes("/members/")),
    hasGamiPress   : isGamipressPath || path.includes("gamipress") ||
                     cookies.includes("gamipress_"),
    isLoggedInWP   : cookies.includes("wordpress_logged_in"),
    isLoggedInMoodle: cookies.includes("MoodleSession"),
    hasCartItems    : cookies.includes("woocommerce_items_in_cart") &&
                      !cookies.includes("woocommerce_items_in_cart=0"),
    host            : url.hostname
  }
}
