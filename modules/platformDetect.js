import { MOODLE_COOKIES, WC_COOKIES, WP_COOKIES } from "../config/regions.js"

export function detectPlatforms(request) {
  const url     = new URL(request.url)
  const cookies = request.headers.get("cookie") || ""
  const has     = (names) => names.some(n => cookies.includes(n))

  return {
    isMoodle       : url.hostname === "lms.learnsocialstudies.com" || has(MOODLE_COOKIES),
    isWooCommerce  : has(WC_COOKIES),
    isWordPress    : has(WP_COOKIES),
    isLoggedInWP   : cookies.includes("wordpress_logged_in"),
    isLoggedInMoodle: cookies.includes("MoodleSession"),
    hasCartItems   : cookies.includes("woocommerce_items_in_cart") &&
                     !cookies.includes("woocommerce_items_in_cart=0"),
    host           : url.hostname
  }
}
