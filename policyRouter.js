export function routePolicies(url, region) {
  if (url.searchParams.get("cmplz_region_redirect") !== "true") return null

  const p = url.pathname.toLowerCase()

  if (p.includes("privacy")) {
    if (region === "eu") return "/legal-hub/privacy-statement-eu/"
    if (region === "us") return "/legal-hub/privacy-statement-us/"
    if (region === "ca") return "/legal-hub/privacy-statement-ca/"
    return "/legal-hub/privacy-statement-us/"
  }

  if (p.includes("cookie")) {
    if (region === "eu") return "/legal-hub/cookie-policy-eu/"
    if (region === "ca") return "/legal-hub/cookie-policy-ca/"
    return "/legal-hub/opt-out-preferences/"
  }

  if (p.includes("terms")) return "/legal-hub/terms-and-conditions/"
  if (p.includes("refund")) return "/legal-hub/refund-policy/"
  if (p.includes("disclaimer")) return "/legal-hub/disclaimer/"

  return null
}
