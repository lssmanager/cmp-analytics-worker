# 🚀 Zaraz + GA4 Auto-Send Configuration Guide

## Overview

El worker **ya está capturando y enviando eventos** a:
- ✅ **Google Analytics 4 Measurement Protocol** (directo via `ga4MeasurementProtocol.js`)
- ✅ **Zaraz Monitoring** (via `zarazReporter.js` + triggers)

Este documento describe cómo **configurar Zaraz en Cloudflare** para que automáticamente envíe todos los eventos a GA4 sin requerer configuración adicional.

---

## Architecture

```
Worker (Cloudflare)
├─ Captures Events (standardEventTrackers, buddyBossTracker, moodleAdvancedTracker)
├─ Sends to GA4 Measurement Protocol (direct HTTPS POST)
└─ Sends to Zaraz via sendBeacon (__cmp/analytics endpoint)

                    ↓

Zaraz (Cloudflare Edge)
├─ Receives events from worker
├─ Maps to GA4 standard format (via triggers)
├─ Auto-sends to GA4 (Zaraz has GA4 tag pre-configured)
└─ Sends to other destinations (if configured)

                    ↓

Google Analytics 4 Dashboard
+ Custom Analytics API (/api/analytics/moodle/:courseId)
```

---

## What Events Flow Automatically?

### User Lifecycle
- `login` → GA4 `login` event
- `sign_up` → GA4 `sign_up` event
- `first_visit` → GA4 `first_visit` event

### Engagement
- `page_view` → GA4 `page_view`
- `scroll_depth` (25%, 50%, 75%, 100%) → GA4 `scroll`
- `click` → GA4 `click`
- `file_download` → GA4 `file_download`

### Web Vitals
- `web_vital_lcp` → LCP metric to GA4
- `web_vital_fid` → FID metric to GA4
- `web_vital_inp` → INP metric to GA4
- `web_vital_cls` → CLS metric to GA4

### Ecommerce
- `view_item` → GA4 `view_item` (with item details)
- `add_to_cart` → GA4 `add_to_cart`
- `purchase` → GA4 `purchase` (with transaction details)
- `refund` → GA4 `refund`

### Learning (Moodle)
- `course_enrollment` → GA4 custom event
- `quiz_complete` → GA4 custom event
- `moodle_engagement_risk` → GA4 custom event

### Social (BuddyBoss)
- `buddyboss_group_joined` → GA4 custom event
- `buddyboss_profile_viewed` → GA4 custom event
- `buddyboss_activity_posted` → GA4 custom event

---

## Deployment Steps

### Step 1: Get Your GA4 Measurement ID

1. Go to **Google Analytics 4 Dashboard**
2. Navigate to **Admin** → **Data Streams**
3. Select your web data stream
4. Copy **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 2: Configure Worker Environment Variables

Add to `wrangler.toml`:

```toml
[env.production]
vars = {
  GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"  # Replace with your Measurement ID
}
secrets = ["GA4_API_SECRET"]  # For direct GA4 Measurement Protocol API
```

Set the secret:

```bash
wrangler secret put GA4_API_SECRET
```

When prompted, get your **GA4 API Secret** from:
- GA4 Admin → Data Streams → Measurement Protocol → Create
- Or use an existing one if already configured

### Step 3: Deploy Worker

```bash
wrangler deploy
```

Verify deployment:

```bash
curl https://your-domain.com/__cmp/test
# Should respond with worker HTML/response
```

### Step 4: Configure Zaraz in Cloudflare Dashboard

#### Option A: Manual Configuration (Recommended for Production)

1. **Go to Cloudflare Dashboard** → Select your domain
2. **Navigate to** Speed → Zaraz
3. **Create New Tag: Google Analytics 4**
   - **Tag Name**: "Google Analytics 4"
   - **Destination**: Select "Google Analytics 4" from dropdown
   - **Measurement ID**: Paste `G-XXXXXXXXXX`
   - **Configuration**:
     - ✅ Send Page View
     - ✅ Allow Google Signals
     - Allow Ad Personalization: (your choice)

4. **Create Triggers** for each event type:

```
Trigger: Login Event
├─ Condition: Event type equals "login"
├─ Action: Send to GA4
├─ Event Name: login
└─ Parameters:
    ├─ method: {{event.detail.method}}
    ├─ session_id: {{session_id}}
    └─ engagement_time_msec: {{engagement_time_msec}}

Trigger: Page View Event
├─ Condition: Event type equals "page_view"
├─ Action: Send to GA4
├─ Event Name: page_view
└─ Parameters:
    ├─ page_location: {{page_location}}
    ├─ page_title: {{page_title}}
    └─ page_referrer: {{page_referrer}}

[... repeat for each event type ...]
```

#### Option B: Programmatic Configuration (API)

Use Zaraz API to create triggers from `zarasConfiguration.js`:

```bash
# Get your zone_id and API token from Cloudflare Dashboard

curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/zaraz/configs" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d @zaras-config.json
```

Convert `zarasConfiguration.js` to JSON format and upload.

### Step 5: Verify Events Flow to GA4

1. **Go to GA4 Dashboard** → Real-time Report
2. **Open your website** and perform actions:
   - Load a page → `page_view` event
   - Click a link → `click` event
   - Download a file → `file_download` event
   - Login → `login` event

3. **Check Real-time Report** → Should see events arriving in 1-2 seconds

### Step 6: Verify Zaraz Monitoring

1. **Go to Cloudflare Zaraz Dashboard**
2. **Check Recent Events**:
   - Should see all events flowing through Zaraz
   - Tags should show successful sends to GA4

---

## Event Parameter Mapping

### GA4 Standard Parameters Auto-Sent by Worker

Every event includes:
```json
{
  "timestamp_micros": 1708000000000000,  // Required for GA4
  "session_id": "session_1708000000000_abc123...",
  "engagement_time_msec": 100,
  "page_location": "https://example.com/courses/123",
  "page_title": "Course Title",
  "page_referrer": "https://referrer.com",

  "browser": "chrome",
  "operating_system": "macos",
  "device_category": "desktop",
  "language": "en",
  "screen_resolution": "1920x1080",

  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "summer_2024",

  "user_language": "en",
  "user_country": "US",
  "user_segment": "student",
  "subscription_status": "premium"
}
```

### Custom Event Parameters

**Ecommerce:**
```json
{
  "item_id": "product_123",
  "item_name": "Advanced Calculus",
  "value": 99.99,
  "currency": "USD",
  "quantity": 1,
  "discount": 0,
  "tax": 8.50
}
```

**Learning (Moodle):**
```json
{
  "course_id": "456",
  "course_name": "Biology 101",
  "quiz_score": 85,
  "total_points": 100,
  "risk_level": "low"
}
```

**Social (BuddyBoss):**
```json
{
  "group_id": "789",
  "group_name": "Study Group - Biology",
  "profile_user_id": "user_123",
  "activity_type": "post"
}
```

---

## Testing Checklist

- [ ] Worker deployed to Cloudflare
- [ ] GA4_MEASUREMENT_ID configured in wrangler.toml
- [ ] GA4_API_SECRET set in Cloudflare secrets
- [ ] Zaraz GA4 tag created with Measurement ID
- [ ] Events appearing in GA4 Real-time Report
- [ ] Page views showing correct page_title and page_location
- [ ] Custom events (login, purchase, etc.) firing correctly
- [ ] Web Vitals metrics (LCP, FID, INP) being captured
- [ ] Moodle events flowing (if using Moodle)
- [ ] BuddyBoss events flowing (if using BuddyBoss)
- [ ] Zaraz dashboard showing recent event activity

---

## Troubleshooting

### Events not appearing in GA4 Real-time Report

**Check:**
1. GA4_MEASUREMENT_ID is correct (format: `G-XXXXXXXXXX`)
2. Zaraz GA4 tag is enabled
3. Worker is deployed and responding to `/__cmp/analytics` POST
4. Check browser console for JavaScript errors
5. Check Zaraz dashboard for "Recent Events" section

**Debug:**
```javascript
// In browser console:
// Check if worker receives data
fetch('/__cmp/analytics', {
  method: 'POST',
  body: JSON.stringify({
    type: 'test_event',
    eventName: 'test_event',
    properties: { test: true }
  })
}).then(r => r.json()).then(console.log)
```

### GA4 Measurement Protocol returns 400 error

**Check:**
1. GA4_API_SECRET is correct
2. Payload structure matches GA4 spec (timestamp_micros in microseconds)
3. client_id is not empty
4. Events array is not empty

**Verify:**
```bash
# Check GA4 config from worker
curl https://your-domain.com/api/analytics/validate-ga4
```

### Zaraz events not flowing to GA4

**Check:**
1. Zaraz trigger conditions match event type names
2. GA4 Event Name in trigger is correct
3. Parameters are correctly mapped from variables
4. No JavaScript errors in browser console

**Debug:**
1. Open Cloudflare Zaraz dashboard
2. Check "Recent Events" section
3. Look for failed tags or dropped events
4. Verify trigger rule conditions

---

## Scaling Considerations

### Event Volume

- **Small site** (<1M pageviews/month): No issues
- **Medium site** (1-10M): Monitor GA4 quota usage
- **Large site** (>10M): Consider event sampling or batch processing

GA4 Measurement Protocol limits:
- Max 25 events per request ✅ (worker batches)
- Max 10MB request body ✅ (handled)
- No daily quotas (unlimited)

### Regional Compliance

Worker automatically handles:
- ✅ EU anonymization (removes userId, granular geo)
- ✅ CA strict mode (blocks direct GA4 without consent)
- ✅ GDPR compliance (raw data in KV, anonimized export)

---

## Next Steps

1. **Set up custom dashboards** using GA4 Analysis Hub
2. **Train ML models** using `/api/analytics/ml/dataset` export
3. **Configure alerts** for risk events (Moodle engagement risk)
4. **Create BI reports** using `/api/analytics/moodle/:courseId` endpoint
5. **Monitor Core Web Vitals** in GA4 Insights

---

## Support & Documentation

- **Zaraz Docs**: https://developers.cloudflare.com/zaraz/
- **GA4 Measurement Protocol**: https://developers.google.com/analytics/devguides/collection/protocol/ga4
- **Worker Code**: See `/modules/ga4MeasurementProtocol.js`
- **Configuration Reference**: See `/modules/zarasConfiguration.js`

---

**Status**: ✅ All events configured for automatic GA4 transmission
**Last Updated**: 2024
**Version**: 2.0 (GA4 + Multi-Platform)
