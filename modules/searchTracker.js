/**
 * searchTracker.js - Site Search Event Tracking
 * Detects site search submissions, result counts, and filters applied
 */

export function buildSearchTrackerScript(endpoint = "/__cmp/analytics") {
  return `<script>
(function() {
  var endpoint = "${endpoint}";

  // Detect search on results page
  var searchParams = new URLSearchParams(location.search);
  var searchTerm = searchParams.get("s") || searchParams.get("q") || searchParams.get("search") || "";
  var resultCount = document.querySelectorAll(".post, .product, .course-item, .search-result, .wp-block-query").length;

  if (searchTerm && resultCount > 0) {
    navigator.sendBeacon(endpoint, JSON.stringify({
      type: "search",
      eventName: "Site Search",
      page: location.pathname,
      sessionId: getCookie("cmp_uid"),
      properties: {
        search_term: searchTerm,
        search_result_count: resultCount,
        page_path: location.pathname
      }
    }));
  }

  // Track search form submission
  document.querySelectorAll('form[role="search"], .search-form, form.wp-block-search__button-outside').forEach(function(form) {
    form.addEventListener("submit", function(e) {
      var input = form.querySelector("input[name='s'], input[name='q'], input[name='search']");
      if (input && input.value) {
        navigator.sendBeacon(endpoint, JSON.stringify({
          type: "search",
          eventName: "Search Submitted",
          page: location.pathname,
          sessionId: getCookie("cmp_uid"),
          properties: {
            search_term: input.value,
            search_source: "form_submission"
          }
        }));
      }
    });
  });

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
    return match ? match[3] : "";
  }

})();
</script>`
}
