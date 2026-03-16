export default {
  async fetch(request) {
    const { system } = await request.json()
    const ip = (system.device?.ip ?? "unknown").replace(/\.\d+$/, ".0")
    const raw = ip + (system.device?.userAgent ?? "") + new Date().toDateString()
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))
    const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("")
    return new Response(hash.substring(0, 16))
  }
}