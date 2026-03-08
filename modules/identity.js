import { parseCookieHeader, randomId, anonymizeIP,
         hashSimple, ONE_MONTH } from "./utils.js"

export function readSessionId(request) {
  const cookies = parseCookieHeader(request.headers.get("cookie") || "")
  return cookies["cmp_uid"] || null
}

export function buildSessionCookie(uid) {
  return [
    `cmp_uid=${uid}`,
    `Path=/`,
    `Max-Age=${ONE_MONTH}`,
    `SameSite=None`,
    `Secure`,
    `Domain=.learnsocialstudies.com`
  ].join("; ")
}

export function buildUserIdentity(request, geo, platforms, region) {
  const url     = new URL(request.url)
  const ua      = request.headers.get("user-agent") || ""
  const ip      = anonymizeIP(request.headers.get("cf-connecting-ip"), region)
  const cookies = parseCookieHeader(request.headers.get("cookie") || "")

  const wpUser = cookies["wordpress_logged_in"]
    ? cookies["wordpress_logged_in"].split("%7C")[0] : null
  const moodleSession = Boolean(cookies["MoodleSession"])

  const fingerprint = hashSimple([
    geo.country, geo.city, geo.timezone,
    ua.slice(0, 80),
    request.headers.get("accept-language")?.split(",")[0] || ""
  ].join("|"))

  return {
    userId          : wpUser || null,
    isAuthenticated : Boolean(wpUser),
    isMoodleActive  : moodleSession,
    fingerprint,
    platform        : platforms.isMoodle ? "moodle" : "wordpress",
    host            : url.hostname,
    path            : url.pathname,
    referrer        : request.headers.get("referer"),
    ip,
    moodleContext   : detectMoodlePageType(url),
    wooContext      : detectWooPageType(request)
  }
}

function detectMoodlePageType(url) {
  const p = url.pathname
  const q = (key) => url.searchParams.get(key)

  if (p.includes("/course/view.php"))      return { type: "course",      id: q("id") }
  if (p.includes("/mod/lesson/view.php"))  return { type: "lesson",      id: q("id") }
  if (p.includes("/mod/quiz/attempt.php")) return { type: "quiz_attempt",id: q("attempt") }
  if (p.includes("/mod/quiz/view.php"))    return { type: "quiz",        id: q("id") }
  if (p.includes("/mod/assign/view.php"))  return { type: "assignment",  id: q("id") }
  if (p.includes("/mod/forum/view.php"))   return { type: "forum",       id: q("id") }
  if (p.includes("/grade/report"))         return { type: "grades",      id: null }
  if (p.includes("/user/profile.php"))     return { type: "profile",     id: null }
  if (p.includes("/my/"))                  return { type: "dashboard",   id: null }
  return null
}

function detectWooPageType(request) {
  const cookies = parseCookieHeader(request.headers.get("cookie") || "")
  const url     = new URL(request.url)
  const p       = url.pathname

  return {
    isCheckout : p.includes("/checkout"),
    isCart     : p.includes("/cart"),
    isAccount  : p.includes("/my-account"),
    hasCart    : Boolean(cookies["woocommerce_items_in_cart"] &&
                         cookies["woocommerce_items_in_cart"] !== "0"),
    cartHash   : cookies["woocommerce_cart_hash"] || null
  }
}
