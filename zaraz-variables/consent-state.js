export default {
  async fetch(request) {
    const { system } = await request.json()
    const cookie = system.cookies?.consent
    if (!cookie) return new Response("denied")
    const parts = Object.fromEntries(cookie.split(",").map(p => p.split(":")))
    return new Response(JSON.stringify({
      analytics: parts.analytics === "true",
      marketing: parts.marketing === "true"
    }))
  }
}