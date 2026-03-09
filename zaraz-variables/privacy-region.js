export default {
  async fetch(request) {
    const { system } = await request.json()
    const c = system.device?.location?.country ?? "OTHER"
    const EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
                "HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK",
                "SI","ES","SE","IS","LI","NO","GB"]
    if (EU.includes(c)) return new Response("eu")
    if (c === "US") return new Response("us")
    if (c === "CA") return new Response("ca")
    return new Response("global")
  }
}