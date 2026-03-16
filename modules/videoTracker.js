/**
 * videoTracker.js - Video Engagement Tracking
 * Tracks video start, progress, and completion for all video types
 * Supports HTML5 video, YouTube iframes, Vimeo embeds
 */

export function buildVideoTrackerScript(endpoint = "/__cmp/analytics") {
  return `<script>
(function() {
  var endpoint = "${endpoint}";

  // ═══════════════════════════════════════════════════════════════════════
  // HTML5 VIDEO TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  document.querySelectorAll("video").forEach(function(video, idx) {
    var videoId = video.id || video.dataset.videoId || "html5_video_" + idx;
    var videoTitle = video.dataset.title || video.title || document.querySelector("h1, .video-title")?.innerText || "Video";
    var videoDuration = 0;
    var progressTracked = {};
    var videoStarted = false;

    video.addEventListener("loadedmetadata", function() {
      videoDuration = Math.round(video.duration);
    });

    // Video start
    video.addEventListener("play", function() {
      if (!videoStarted) {
        videoStarted = true;
        navigator.sendBeacon(endpoint, JSON.stringify({
          type: "video_start",
          eventName: "Video Started",
          page: location.pathname,
          sessionId: getCookie("cmp_uid"),
          properties: {
            video_id: videoId,
            video_title: videoTitle,
            video_duration: videoDuration,
            video_provider: "html5"
          }
        }));
      }
    }, { once: true });

    // Video progress (25%, 50%, 75%)
    video.addEventListener("timeupdate", function() {
      if (videoDuration > 0) {
        var percent = Math.round((video.currentTime / videoDuration) * 100);
        [25, 50, 75].forEach(function(p) {
          if (percent >= p && !progressTracked[p]) {
            progressTracked[p] = true;
            navigator.sendBeacon(endpoint, JSON.stringify({
              type: "video_progress",
              eventName: "Video Progress",
              page: location.pathname,
              sessionId: getCookie("cmp_uid"),
              properties: {
                video_id: videoId,
                progress_percent: p,
                watched_time: Math.round(video.currentTime),
                video_duration: videoDuration
              }
            }));
          }
        });
      }
    }, { passive: true });

    // Video complete
    video.addEventListener("ended", function() {
      navigator.sendBeacon(endpoint, JSON.stringify({
        type: "video_complete",
        eventName: "Video Completed",
        page: location.pathname,
        sessionId: getCookie("cmp_uid"),
        properties: {
          video_id: videoId,
          video_title: videoTitle,
          video_duration: videoDuration,
          watched_time: videoDuration
        }
      }));
    }, { once: true });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // YOUTUBE IFRAME TRACKING (IFrame API)
  // ═══════════════════════════════════════════════════════════════════════

  window.addEventListener("load", function() {
    document.querySelectorAll("iframe[src*='youtube']").forEach(function(iframe, idx) {
      var videoId = extractYouTubeId(iframe.src) || "youtube_" + idx;
      var videoTitle = iframe.dataset.title || "YouTube Video";
      var progressTracked = {};

      // YouTube IFrame API setup
      if (window.YT && window.YT.Player) {
        var player = new YT.Player(iframe, {
          events: {
            onReady: function(e) {
              var duration = e.target.getDuration();
              iframe.dataset.duration = duration;
            },
            onStateChange: function(e) {
              var states = { 0: "ended", 1: "playing", 2: "paused", 3: "buffering", 5: "video_cued" };
              if (e.data === 1) { // PLAYING
                if (!iframe.dataset.started) {
                  iframe.dataset.started = "1";
                  navigator.sendBeacon(endpoint, JSON.stringify({
                    type: "video_start",
                    eventName: "YouTube Video Started",
                    page: location.pathname,
                    sessionId: getCookie("cmp_uid"),
                    properties: {
                      video_id: videoId,
                      video_title: videoTitle,
                      video_duration: parseInt(iframe.dataset.duration || 0),
                      video_provider: "youtube"
                    }
                  }));
                }
              }
              if (e.data === 0) { // ENDED
                navigator.sendBeacon(endpoint, JSON.stringify({
                  type: "video_complete",
                  eventName: "YouTube Video Completed",
                  page: location.pathname,
                  sessionId: getCookie("cmp_uid"),
                  properties: {
                    video_id: videoId,
                    video_provider: "youtube"
                  }
                }));
              }
            }
          }
        });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // VIMEO IFRAME TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  window.addEventListener("load", function() {
    document.querySelectorAll("iframe[src*='vimeo']").forEach(function(iframe, idx) {
      var videoId = extractVimeoId(iframe.src) || "vimeo_" + idx;
      var videoTitle = iframe.dataset.title || "Vimeo Video";

      // Load Vimeo Player API if available
      if (window.Vimeo && window.Vimeo.Player) {
        var player = new Vimeo.Player(iframe);

        player.on("play", function() {
          if (!iframe.dataset.started) {
            iframe.dataset.started = "1";
            player.getDuration().then(function(duration) {
              navigator.sendBeacon(endpoint, JSON.stringify({
                type: "video_start",
                eventName: "Vimeo Video Started",
                page: location.pathname,
                sessionId: getCookie("cmp_uid"),
                properties: {
                  video_id: videoId,
                  video_title: videoTitle,
                  video_duration: Math.round(duration),
                  video_provider: "vimeo"
                }
              }));
            });
          }
        });

        player.on("ended", function() {
          navigator.sendBeacon(endpoint, JSON.stringify({
            type: "video_complete",
            eventName: "Vimeo Video Completed",
            page: location.pathname,
            sessionId: getCookie("cmp_uid"),
            properties: {
              video_id: videoId,
              video_provider: "vimeo"
            }
          }));
        });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  function extractYouTubeId(url) {
    var match = url.match(/(?:youtube.com\\/watch\\?v=|youtu.be\\/)([\\w-]{11})/);
    return match ? match[1] : null;
  }

  function extractVimeoId(url) {
    var match = url.match(/vimeo.com\\/(\\d+)/);
    return match ? match[1] : null;
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
    return match ? match[3] : "";
  }

})();
</script>`
}
