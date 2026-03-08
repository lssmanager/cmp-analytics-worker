import { MOODLE_COOKIES, WC_COOKIES, WP_COOKIES } from "../config/regions.js"

export function detectPlatforms(request) {
  const url     = new URL(request.url)
  const cookies = request.headers.get("cookie") || ""

  const moodle = Array.isArray(MOODLE_COOKIES) ? MOODLE_COOKIES : []
  const wc     = Array.isArray(WC_COOKIES)     ? WC_COOKIES     : []
  const wp     = Array.isArray(WP_COOKIES)     ? WP_COOKIES     : []

  const has = (names) => names.some(n => cookies.includes(n))

  return {
    isMoodle        : url.hostname.includes("lms.") || has(moodle),
    isWooCommerce   : has(wc),
    isWordPress     : has(wp),
    isLoggedInWP    : cookies.includes("wordpress_logged_in"),
    isLoggedInMoodle: cookies.includes("MoodleSession"),
    hasCartItems    : cookies.includes("woocommerce_items_in_cart") &&
                      !cookies.includes("woocommerce_items_in_cart=0"),
    host            : url.hostname
  }
}
