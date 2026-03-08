export function routePolicies(url, region) {
  if (url.searchParams.get("cmplz_region_redirect") !== "true") return null

  const p = url.pathname.toLowerCase()

  if (p.includes("privacy")) {
    if (region === "eu") return "/privacy-statement-eu"
    if (region === "us") return "/privacy-statement-us"
    if (region === "ca") return "/privacy-statement-ca"
    return "/privacy-statement-us"
  }
  if (p.includes("cookie")) {
    if (region === "eu") return "/cookie-policy-eu"
    if (region === "ca") return "/cookie-policy-ca"
    return "/opt-out-preferences"
  }
  if (p.includes("terms"))     return "/terms-and-conditions"
  if (p.includes("refund"))    return "/refund-policy"
  if (p.includes("disclaimer"))return "/disclaimer"

  return null
}
