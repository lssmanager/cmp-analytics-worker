# Zaraz + GA4 Complete Implementation Guide

## Overview

This guide walks you through setting up complete event tracking for www.learnsocialstudies.com (WordPress/WooCommerce + BuddyBoss) and lms.learnsocialstudies.com (Moodle LMS) using Google Analytics 4 (GA4) via Cloudflare's Zaraz tag management system.

**Key Components:**
- ✅ **Zaraz** - Client-side real-time event tracking
- ✅ **GA4** - Google Analytics 4 property (50+ event types)
- ✅ **Google Ads** - Conversion tracking for e-commerce & leads
- ✅ **Custom Dashboards** - Pre-built dashboards for Moodle, BuddyBoss, E-Commerce
- ✅ **GDPR/CASL/CCPA Compliance** - Regional consent handling

---

## Phase 1: Setup Google Analytics 4

### Step 1.1: Create GA4 Property

1. Go to **Google Analytics** → https://analytics.google.com
2. Click **Admin** (bottom left)
3. Click **Create Property** (under "Property" column)
4. Enter details:
   - Property name: `Learn Social Studies - Main`
   - Reporting timezone: (select your timezone)
   - Currency: `USD`
5. Click **Create**

### Step 1.2: Get Your GA4 Measurement ID

1. In your new GA4 property, go to **Admin** > **Data Streams**
2. Click on your website data stream
3. Look for **Measurement ID** (format: `G-XXXXXXXXXX`)
4. **Copy and save this ID** - you'll need it in Step 5

**Example:** `G-ABC123DEFGH`

### Step 1.3: Enable Enhanced E-Commerce (Optional, for WooCommerce)

1. In GA4, go to **Admin** > **Data Streams** > Select your stream
2. Scroll down to **Enhanced measurement**
3. Toggle **ON** for:
   - ✅ Page views and scrolls
   - ✅ Outbound clicks
   - ✅ Site search
   - ✅ Video engagement
   - ✅ File downloads
4. Click **Save**

---

## Phase 2: Setup Google Ads Conversion Tracking

### Step 2.1: Get Your Google Ads IDs

#### For Account ID:
1. Go to **Google Ads** → https://ads.google.com
2. Click **Tools & Settings** (top right)
3. Under "Setup," click **Conversions**
4. Your Customer ID is displayed (e.g., `123-456-7890`, remove hyphens: `1234567890`)
5. **Copy and save this**

#### For Conversion Tracking ID:
1. In **Conversions**, note your **Conversion Tracking ID** (format: `AW-XXXXXXXXXX`)
2. **Copy and save this**

### Step 2.2: Create Conversion Actions

Create conversion tracking for each event type. In Google Ads > Tools > Conversions:

**E-Commerce Conversions:**

| Conversion Name | Category | Conversion Action ID |
|---|---|---|
| Purchase | Sales | `AW-XXXXXXXXXX/conversion_id_purchase` |
| Add to Cart | Sales | `AW-XXXXXXXXXX/conversion_id_add_to_cart` |
| Begin Checkout | Sales | `AW-XXXXXXXXXX/conversion_id_checkout` |

**Learning Conversions:**

| Conversion Name | Category | Conversion Action ID |
|---|---|---|
| Course Enrollment | Lead | `AW-XXXXXXXXXX/conversion_id_enrollment` |
| Quiz Complete | Lead | `AW-XXXXXXXXXX/conversion_id_quiz` |
| Course Complete | Lead | `AW-XXXXXXXXXX/conversion_id_course_complete` |

**Lead Generation Conversions:**

| Conversion Name | Category | Conversion Action ID |
|---|---|---|
| Lead Generated | Lead | `AW-XXXXXXXXXX/conversion_id_lead` |
| Contact Form Submit | Lead | `AW-XXXXXXXXXX/conversion_id_contact` |
| Newsletter Signup | Lead | `AW-XXXXXXXXXX/conversion_id_newsletter` |

**To create each:**
1. Click **Create Conversion**
2. Select **Event** (not "Website" or "App")
3. Enter conversion name
4. Set conversion counting: `Every conversion counts` or `Count unique conversions per user`
5. Set value: Check "Use the value from my conversion event" → Metric: `value`
6. Click **Create and continue**
7. **Note the Conversion ID displayed**

---

## Phase 3: Configure Zaraz (Cloudflare)

### Step 3.1: Access Zaraz in Cloudflare

1. Log into **Cloudflare Dashboard** → https://dash.cloudflare.com
2. Select your domain (learnsocialstudies.com)
3. Go to **Speed** > **Zaraz** (left sidebar)
4. Click **Get Started** or **Edit Configuration**

### Step 3.2: Update GA4 Measurement ID in Code

In your worker code (`modules/zaraz-config.js`):

```javascript
// BEFORE:
ga4: {
  measurementId: "G-XXXXXXXXXX", // ← REPLACE THIS
}

// AFTER:
ga4: {
  measurementId: "G-ABC123DEFGH", // ← Your actual ID
}
```

### Step 3.3: Update Google Ads IDs in Code

In `modules/zaraz-config.js`:

```javascript
// BEFORE:
googleAds: {
  customerId: "XXXXXXXXXX", // ← REPLACE
  conversionTrackingId: "AW-XXXXXXXXXX", // ← REPLACE
  conversions: {
    "purchase": {
      conversionId: "AW-XXXXXXXXXX/CONVERSION_ACTION_ID_PURCHASE", // ← REPLACE
    }
  }
}

// AFTER:
googleAds: {
  customerId: "1234567890", // ← Your actual ID (no hyphens)
  conversionTrackingId: "AW-1234567890", // ← Your tracking ID
  conversions: {
    "purchase": {
      conversionId: "AW-1234567890/purchase_conversion_id_12345", // ← Your actual conversion ID
    }
  }
}
```

### Step 3.4: Deploy Updated Worker

1. Push your code changes to your Git repository
2. Your Cloudflare Worker auto-deploys
3. Zaraz automatically picks up the new GA4 Measurement ID

---

## Phase 4: Setup GA4 Custom Dimensions

Custom dimensions allow you to segment data by important attributes (user role, course ID, etc.).

### Step 4.1: Create Custom Dimensions

1. In GA4, go to **Admin** > **Custom Definitions** > **Custom Dimensions**
2. Click **Create Custom Dimension**
3. Fill in:
   - **Dimension name:** `user_segment`
   - **Scope:** `User`
   - **Event parameter:** `user_segment`
   - **Description:** `Segment: student, customer, instructor, admin`
4. Click **Save**

**Repeat for each:**

| Dimension Name | Scope | Event Parameter | Description |
|---|---|---|---|
| user_segment | User | user_segment | student, customer, instructor, admin |
| moodle_user_role | User | moodle_user_role | student, teacher, admin, manager |
| course_id | Event | course_id | Course/Product ID |
| privacy_region | User | privacy_region | eu, us, ca, global |
| enrollment_status | User | enrollment_status | active, inactive, completed |
| platform_type | User | platform_type | wordpress, moodle, buddyboss |
| group_id | User | group_id | BuddyBoss/Moodle group ID |
| cohort_id | User | cohort_id | Moodle cohort ID |
| device_category | User | device_category | mobile, tablet, desktop |
| content_type | Event | content_type | course, product, article, forum |

### Step 4.2: Create Custom Metrics

1. In GA4, go to **Admin** > **Custom Definitions** > **Custom Metrics**
2. Click **Create Custom Metric**
3. Fill in:
   - **Metric name:** `engagement_score`
   - **Scope:** `Event`
   - **Event parameter:** `engagement_score`
   - **Unit of measurement:** `Standard`
4. Click **Save**

**Repeat for each:**

| Metric Name | Scope | Event Parameter | Unit |
|---|---|---|---|
| engagement_score | Event | engagement_score | Standard |
| session_duration_seconds | Event | session_duration_seconds | Time |
| course_progress_percent | Event | course_progress_percent | Percentage |
| quiz_average_score | Event | quiz_average_score | Standard |
| form_completion_time_seconds | Event | form_completion_time_seconds | Time |

---

## Phase 5: Mark Events as Conversions

This enables conversion rate calculations in GA4 reports.

1. In GA4, go to **Admin** > **Conversions**
2. Click **Create New Conversion Event**
3. For each event, enter:
   - **purchase**
   - **course_enrollment**
   - **quiz_complete**
   - **lead_generation**
   - **contact_form_submit**
   - **newsletter_signup**
   - **demo_request**

4. Click **Create**

---

## Phase 6: Test Events in Real-Time

### Step 6.1: Enable DebugView

1. In GA4, go to **Admin** > **DebugView**
2. This shows events in real-time as they're sent

### Step 6.2: Test Event Firing

1. Visit your site: https://www.learnsocialstudies.com
2. Open **Browser DevTools** → **Console**
3. Trigger events:
   - **Page View:** Just load any page
   - **Form Submit:** Fill and submit a form
   - **Product View:** Click a product
   - **E-Course Activity:** If on Moodle, visit a course page

4. In GA4 DebugView, you should see events appear within 1-2 seconds:
   ```
   page_view
   user_engagement
   scroll
   form_submit
   purchase (if applicable)
   ```

### Step 6.3: Verify Parameters

Each event should include parameters:

**Page View event should have:**
```
- page_path: /my-page
- page_title: My Page Title
- moodle_course_id: 123 (if on Moodle)
- privacy_region: us
```

**Form Submit event should have:**
```
- form_type: contact
- form_id: my_form
- platform_type: wordpress
```

**Purchase event should have:**
```
- transaction_id: order_12345
- value: 99.99
- currency: USD
- items: [array of products]
```

---

## Phase 7: Create Custom Dashboards

### Step 7.1: Access Dashboards

1. In GA4, go to **Dashboards** (left sidebar)
2. Click **Create Dashboard**
3. Select **Blank Dashboard**

### Step 7.2: Import Dashboard Templates

Use the pre-configured dashboards in `modules/ga4-dashboard-setup.js`:

**Dashboard 1: Moodle Learning Analytics**
- Active learners
- Course enrollments & completion rate
- Quiz performance by course
- Students at risk
- Assignment submission tracking

**Dashboard 2: BuddyBoss Community**
- Forum activity trends
- Most active groups
- Member engagement
- Gamification (achievements, ranks)
- Discussion participation

**Dashboard 3: E-Commerce Funnel**
- Revenue & AOV
- Conversion funnel (View → Cart → Checkout → Purchase)
- Product performance
- Cart abandonment rate

**Dashboard 4: User Engagement**
- Sessions & session duration
- Bounce rate & scroll depth
- Page performance
- Core Web Vitals (LCP, CLS, FID)

**Dashboard 5: Compliance & Consent**
- Consent acceptance rates by region
- Privacy region distribution
- Banner impressions

### Step 7.3: Add Cards to Dashboard

For each dashboard:

1. Click **Add Widget**
2. Select card type (Scorecard, Table, Line Chart, Pie Chart, Funnel, etc.)
3. **Metric:** Select from dropdown (e.g., "Active Users", "Event Count")
4. **Dimensions:** Select from dropdown (e.g., "Date", "Page Path")
5. **Filters:** Add filters as needed:
   - Event name = "moodle_course_viewed"
   - Custom dimension "platform_type" = "moodle"
   - etc.
6. **Styling:** Configure colors, formatting, labels
7. Click **Save**

**Example: "Course Enrollments Over Time"**
```
Card type: Line Chart
Metric: Event Count
Dimensions: Date
Filter: Event Name CONTAINS "course_enrolled"
Date Range: 28 days
Breakdown: By Event Name (3 results)
```

---

## Phase 8: Configure Conversions in GA4

This enables GA4 to recognize when goals are achieved.

1. In GA4, go to **Admin** > **Conversions**
2. Click **Create New Conversion Event**
3. Enter these event names (one at a time):
   - `purchase`
   - `course_enrollment`
   - `quiz_complete`
   - `lead_generation`
   - `contact_form_submit`
   - `newsletter_signup`

Each event will now appear in:
- Conversion Rate reports
- Attribution models
- Audience definitions
- Funnel analysis

---

## Phase 9: Setup Google Ads Conversion Tracking

### Step 9.1: Link GA4 to Google Ads

1. In GA4, go to **Admin** > **Google Ads Links**
2. Click **Link**
3. Select your Google Ads account
4. Check ✅ "Auto-tag from Google Ads"
5. Check ✅ "Import conversions from GA4"
6. Click **Link**

### Step 9.2: Verify Conversion Data Flow

1. In Google Ads, go to **Tools** > **Conversions**
2. You should see conversion data appearing from GA4:
   - **purchase** - E-commerce revenue tracking
   - **course_enrollment** - Lead generation
   - **lead_generation** - Form submissions

---

## Phase 10: Troubleshooting & Verification

### Common Issues

**Issue: Events not appearing in GA4**

Checklist:
- [ ] GA4 Measurement ID correctly configured in `zaraz-config.js`
- [ ] Site using HTTPS (required for Zaraz)
- [ ] JavaScript enabled in browser
- [ ] No Content Security Policy (CSP) blocking Zaraz
- [ ] Check DebugView for event details
- [ ] Check browser Console for errors

**Resolution:**
```javascript
// Test if Zaraz is loaded
console.log(window.zaraz); // Should not be undefined

// Test if GA4 dataLayer exists
console.log(window.dataLayer); // Should be array

// Check for JS errors
// DevTools → Console → Look for red errors
```

**Issue: Conversion IDs not tracking**

Checklist:
- [ ] Google Ads Conversion ID format: `AW-XXXXXXXXXX/conversion_action_id`
- [ ] Event names match exactly: `purchase`, `course_enrollment`, etc.
- [ ] Custom conversion properties included (value, currency for purchase)

**Issue: Custom dimensions not appearing**

Checklist:
- [ ] Custom dimension created in GA4 Admin
- [ ] Event parameter name matches dimension config
- [ ] Wait 24-48 hours for data processing (first time)
- [ ] Check if events actually contain that parameter

### Validation Checklist

Before going live:

- [ ] GA4 Measurement ID configured and working
- [ ] Events appearing in DebugView in real-time
- [ ] Custom dimensions visible in reports
- [ ] Conversions marked in GA4 admin
- [ ] Google Ads conversion tracking linked
- [ ] Dashboards created and populated with data
- [ ] Consent handling working (banner shows/hides events correctly)
- [ ] Mobile and desktop tracking both working
- [ ] Regional compliance verified (EU consent required, US auto-accept, etc.)

### Test Event Checklist

Trigger these events and verify they appear:

**General:**
- [ ] Page view on homepage
- [ ] Page view on product page
- [ ] Scroll 50% down page
- [ ] Click button/link

**E-Commerce (if available):**
- [ ] View product
- [ ] Add to cart
- [ ] Begin checkout
- [ ] Purchase (complete order)

**Forms:**
- [ ] Open form
- [ ] Submit form (should show `form_submit` + `lead_generation`)

**Moodle (if testing on LMS):**
- [ ] View course (should show `moodle_course_viewed`)
- [ ] Start quiz (should show `moodle_quiz_attempt_started`)
- [ ] Submit quiz (should show `moodle_quiz_attempt_submitted`)

**BuddyBoss (if testing on WordPress):**
- [ ] Visit forum (should show `bp_forum_viewed`)
- [ ] Create group (should show `bp_group_joined`)
- [ ] Post message (should show `bp_activity_posted`)

---

## Phase 11: Setup Monitoring & Alerts

### GA4 Alerts

1. In GA4, click **Alerts** (left sidebar)
2. Click **Create Alert**
3. Set up alerts for:
   - Conversion rate drops below 2%
   - Daily users drop by 50%
   - Error events spike above normal
   - Page load time > 3 seconds

### Google Ads Alerts

1. In Google Ads, go **Tools** > **Insights & Reports** > **Scheduled Reports**
2. Create weekly reports for:
   - Conversion performance
   - Cost per conversion
   - ROI by campaign

---

## Phase 12: Advanced Configuration

### Regional Compliance

**EU (GDPR):**
- Events are blocked until user explicitly consents
- IP anonymized
- Banner auto-close disabled
- Users cannot opt-in via timeout

**US (CCPA):**
- Events start flowing after 10 seconds or scroll
- User can opt-out
- IP partially anonymized

**Canada (CASL):**
- Similar to GDPR - explicit consent required
- IP anonymized
- Marketing emails require explicit permission

**Configuration is in:** `modules/gcm.js`

### Consent Update Event

When user changes consent preference, this event fires:

```
event: consent_update
parameters:
  analytics_consent: true/false
  marketing_consent: true/false
  preferences_consent: true/false
```

This allows you to:
- Revoke past analytics if user opts out
- Enable marketing tracking if user opts in
- Clear cookies if user denies all

---

## FAQ & Best Practices

### Q: How often is data updated in GA4?
**A:** Real-time events appear within 1-2 seconds in DebugView. Standard reports update within 24-48 hours. Conversions may take up to 2-3 days to reflect.

### Q: Why don't I see all events?
**A:** Check:
1. Is the event actually firing? (Use DebugView)
2. Is consent given? (For analytics_storage)
3. Is the event name spelled correctly?
4. Did you mark it as a conversion? (for that specific metric)

### Q: Can I track custom events?
**A:** Yes! Use `zaraz.track()` in JavaScript:
```javascript
zaraz.track("custom_event_name", {
  param1: "value1",
  param2: 42
});
```

### Q: Do I need separate GA4 properties for WP and Moodle?
**A:** Not required, but recommended for clarity:
- **GA4 Property 1:** www.learnsocialstudies.com (WordPress + WooCommerce + BuddyBoss)
- **GA4 Property 2:** lms.learnsocialstudies.com (Moodle) [OPTIONAL]

Use custom dimension `platform_type` to segment within single property.

### Q: How long is data retained?
**A:** GA4 retains data:
- Raw events: 2 months (default)
- Aggregated reports: 38 months
- You can increase to 14 months (with more limited raw access)

---

## Next Steps

1. ✅ Complete Steps 1-7 above
2. ✅ Test events in DebugView
3. ✅ Verify conversion tracking working
4. ✅ Create custom dashboards
5. ✅ Share dashboards with team
6. ✅ Set up alerts for important metrics
7. ✅ Monitor data quality for 1 week
8. ✅ Decommission old Analytify plugin

---

## Support & Resources

**Documentation:**
- GA4 Setup: https://support.google.com/analytics/answer/10089681
- Google Ads Tracking: https://support.google.com/google-ads/answer/6095821
- Zaraz Docs: https://developers.cloudflare.com/zaraz/
- Consent Mode: https://support.google.com/analytics/answer/9976101

**Tools:**
- GA4 DebugView: https://support.google.com/analytics/answer/7201382
- Google Tag Assistant: https://chrome.google.com/webstore/detail/google-tag-assistant/knapjjfgfgkfitbnlpmg...
- Consent Mode Sandbox: https://www.googletagmanager.com/docs/consent/...

---

**Setup completed on:** ___________
**Verified working on:** ___________
**Team:** ___________
