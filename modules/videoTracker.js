export function buildVideoTrackerScript(endpoint) {
  return `
<script>
(function() {
  var EP = ${JSON.stringify(endpoint)};
  var progressMap = new WeakMap();

  function hasAnalyticsConsent() {
    var c = document.cookie.split("; ").find(function(v){ return v.indexOf("cmp_consent=") === 0; });
    return !!(c && c.indexOf("analytics:true") !== -1);
  }

  function emit(eventName, props) {
    if (!hasAnalyticsConsent()) return;
    var payload = {
      type: eventName,
      eventName: eventName,
      page: location.pathname + location.search,
      host: location.hostname,
      properties: props || {}
    };
    if (window.zaraz && typeof window.zaraz.track === "function") window.zaraz.track(eventName, payload.properties);
    if (navigator.sendBeacon) navigator.sendBeacon(EP, JSON.stringify(payload));
  }

  function meta(video) {
    return {
      video_title: video.getAttribute("title") || video.getAttribute("aria-label") || document.title,
      video_src: video.currentSrc || video.getAttribute("src") || null,
      video_duration: Number.isFinite(video.duration) ? Math.round(video.duration) : null
    };
  }

  function bindVideo(video) {
    if (progressMap.has(video)) return;
    progressMap.set(video, { p25: false, p50: false, p75: false });

    video.addEventListener("play", function() { emit("video_start", meta(video)); });

    video.addEventListener("timeupdate", function() {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      var pct = (video.currentTime / video.duration) * 100;
      var m = progressMap.get(video);
      if (!m.p25 && pct >= 25) { m.p25 = true; emit("video_progress", { percent: 25, video_src: meta(video).video_src }); }
      if (!m.p50 && pct >= 50) { m.p50 = true; emit("video_progress", { percent: 50, video_src: meta(video).video_src }); }
      if (!m.p75 && pct >= 75) { m.p75 = true; emit("video_progress", { percent: 75, video_src: meta(video).video_src }); }
    });

    video.addEventListener("ended", function() { emit("video_complete", meta(video)); });
  }

  function scan() {
    document.querySelectorAll("video").forEach(bindVideo);
  }

  scan();
  var obs = new MutationObserver(scan);
  obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
})();
</script>`
}
