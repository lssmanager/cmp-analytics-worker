export default {
async fetch(request, env, ctx) {

const url = new URL(request.url)

/* -------------------------
FAST BYPASS - assets y crawlers
------------------------- */
const cfWorker = request.headers.get("cf-worker") || ""
const isAsset = /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp|map|txt|xml)(\?|$)/i.test(url.pathname)
if (cfWorker || isAsset) return fetch(request)

/* -------------------------
VARIABLES
------------------------- */
const country = request.cf?.country || "OTHER"
const ip = request.headers.get("cf-connecting-ip")

