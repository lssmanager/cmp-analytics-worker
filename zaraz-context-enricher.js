export default {
  async fetch(request) {
    const { system, client } = await request.json()

    const country = system?.device?.location?.country ?? "OTHER"
    const EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
                "HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK",
                "SI","ES","SE","IS","LI","NO","GB"]

    // Enriquecer client con datos de privacidad
    client.privacy_region  = EU.includes(country) ? "eu" : country === "US" ? "us" : country === "CA" ? "ca" : "global"
    client.consent_source  = system?.cookies?.consent ? "cookie" : "default"
    client.consent_version = "2"

    // Hashed client_id para GA4 (GDPR safe)
    const ip  = (system?.device?.ip ?? "unknown").replace(/\.\d+$/, ".0")
    const raw = ip + (system?.device?.userAgent ?? "") + new Date().toDateString()
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))
    client.hashed_client_id = Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2,"0")).join("").substring(0, 16)

    return new Response(JSON.stringify({ system, client }))
  }
}
