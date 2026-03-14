export default {
async fetch(request, env, ctx) {

const url = new URL(request.url)

/* FAST BYPASS - assets, crawlers y cf-workers */
const cfWorker = request.headers.get("cf-worker") || ""
const isAsset = /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp|map|txt|xml)(\?|$)/i.test(url.pathname)
if (cfWorker || isAsset) return fetch(request)

/* VARIABLES */
const country = request.cf?.country || "OTHER"
const ip = request.headers.get("cf-connecting-ip")

/* REGION DETECTION */
const EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"]

function detectRegion(c){
  if(EU.includes(c)) return "eu"
  if(c==="US") return "us"
  if(c==="CA") return "ca"
  return "global"
}

const region = detectRegion(country)

/* IP ANONYMIZATION */
function anonymizeIP(ip){
  if(!ip) return ip
  if(ip.includes(".")){
    let p = ip.split(".")
    p[3]="0"
    return p.join(".")
  }
  return ip
}

let visitorIP = region==="eu" ? anonymizeIP(ip) : ip

/* CONSENT COOKIE */
function parseConsent(cookie){
  if(!cookie) return null
  const match = cookie.match(/consent=([^;]+)/)
  if(!match) return null
  const obj={}
  match[1].split(",").forEach(p=>{
    let [k,v]=p.split(":")
    obj[k]=v==="true"
  })
  return obj
}

const cookieHeader = request.headers.get("cookie") || ""
let consent = parseConsent(cookieHeader)

/* DEFAULT CONSENT */
if(!consent){
  if(region==="eu"||region==="ca"){
    consent={necessary:true,analytics:false,marketing:false}
  } else {
    consent={necessary:true,analytics:true,marketing:true}
  }
}

/* POLICY REDIRECT */
if(url.searchParams.get("cmplz_region_redirect")==="true"){
  const path = url.pathname
  let redirect = null
  if(path.includes("privacy")){
    if(region==="eu") redirect="/privacy-statement-eu"
    else if(region==="us") redirect="/privacy-statement-us"
    else if(region==="ca") redirect="/privacy-statement-ca"
    else redirect="/privacy-statement-us"
  }
  if(path.includes("cookie")){
    if(region==="eu") redirect="/cookie-policy-eu"
    else if(region==="ca") redirect="/cookie-policy-ca"
    else redirect="/opt-out-preferences"
  }
  if(path.includes("terms")) redirect="/terms-and-conditions"
  if(path.includes("refund")) redirect="/refund-policy"
  if(path.includes("disclaimer")) redirect="/disclaimer"
  if(redirect){
    return Response.redirect("https://www.learnsocialstudies.com"+redirect,302)
  }
}

/* FETCH ORIGIN */
let response = await fetch(request)

/* SECURITY HEADERS */
let headers = new Headers(response.headers)
headers.set("X-Privacy-Region", region)
headers.set("X-Visitor-IP", visitorIP)
headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
headers.set("X-Frame-Options", "SAMEORIGIN")
headers.set("X-Content-Type-Options", "nosniff")
headers.set("Permissions-Policy", "interest-cohort=()")

/* INJECT BANNER */
const contentType = headers.get("content-type") || ""
if(contentType.includes("text/html")){
  const banner = buildBanner(region)
  return new HTMLRewriter()
    .on("body",{
      element(el){ el.append(banner,{html:true}) }
    })
    .transform(new Response(response.body,{status:response.status,headers}))
}

return new Response(response.body,{status:response.status,headers})

}}

function buildBanner(region){
let text=""
if(region==="eu") text="We use cookies for analytics and improving your learning experience. Consent required under GDPR."
else if(region==="us") text="This site may share data for analytics. You can opt-out under CCPA."
else if(region==="ca") text="This website uses cookies and requires consent under Canadian privacy law."
else text="This website uses cookies."

return `<div id="cookie-consent" style="position:fixed;bottom:0;left:0;right:0;background:#111;color:white;padding:20px;z-index:9999;font-family:system-ui;"><div style="max-width:1100px;margin:auto"><p style="margin-bottom:10px">${text}</p><button onclick="acceptAll()" style="margin-right:10px">Accept</button><button onclick="rejectAll()" style="margin-right:10px">Reject</button><a href="/legal-hub" style="color:#ccc">Legal hub</a></div></div><script>function setConsent(obj){let parts=[];for(let k in obj){parts.push(k+":"+obj[k])}document.cookie="consent="+parts.join(",")+";path=/;max-age="+(60*60*24*365);location.reload()}function acceptAll(){setConsent({necessary:true,analytics:true,marketing:true})}function rejectAll(){setConsent({necessary:true,analytics:false,marketing:false})}<\/script>`
}
