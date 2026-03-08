export function corsHeaders() {
  return {
    "access-control-allow-origin" : "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "content-type": "application/json; charset=utf-8" }
  })
}

export function applyHeaders(response, region) {
  const h = new Headers(response.headers)
  h.set("X-Privacy-Region",       region)
  h.set("Referrer-Policy",        "strict-origin-when-cross-origin")
  h.set("X-Frame-Options",        "SAMEORIGIN")
  h.set("X-Content-Type-Options", "nosniff")
  h.set("Permissions-Policy",     "interest-cohort=()")
  return new Response(response.body, {
    status: response.status, statusText: response.statusText, headers: h
  })
}
