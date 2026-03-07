# DrawAndGuess Launch Metrics Playbook

## Current Tracking Already In Code

Pageviews:
- Google Analytics route-change pageviews via `client/src/components/GoogleAnalytics.jsx`

Key events:
- `landing_view`
- `create_room_click`
- `join_room_success`
- `share_click`
- `share_copy_success`
- `game_start`
- `round_end`
- `feedback_click`

## 1. Search Console Setup

Use Google Search Console after the new pages are deployed.

Recommended setup:
1. Add the site as a Domain property if you control DNS.
2. If that is not possible, add the URL-prefix property for the exact production path:
   `https://playflowpulse.com/drawguess/`
3. Submit the sitemap:
   `https://playflowpulse.com/drawguess/sitemap.xml`

What to check first:
- `Indexing > Pages`
  Confirm `/en/features`, `/en/use-cases`, `/en/faq` and Chinese equivalents are indexed.
- `Performance > Search results`
  Filter by `Page` and inspect each landing page separately.

## 2. What To Watch In Search Console

### A. Index coverage

Question:
- did Google actually index the new pages?

Good sign:
- the new localized pages move from discovered/crawled into indexed

Bad sign:
- pages stay in crawled-not-indexed
- pages are excluded as duplicates

### B. Query footprint

Question:
- are impressions spreading beyond the homepage?

Check:
- `Performance > Search results > Pages`
- click `/drawguess/en/features`
- inspect its Queries tab

Good sign:
- homepage gets broad brand/head-term impressions
- `/features` gets capability intent
- `/use-cases` gets scenario intent
- `/faq` gets question intent

### C. CTR

Question:
- do the titles/descriptions match what users want?

Good sign:
- impressions rise and CTR stays reasonable or improves

Bad sign:
- impressions rise but CTR stays very low
  This usually means the snippet is not compelling or the page intent is mismatched.

## 3. What To Watch In Google Analytics

Use GA4 reports or Explorations.

### A. Organic landing pages

Go to:
- `Reports > Acquisition > Traffic acquisition`

Set:
- Session default channel group = `Organic Search`

Then compare landing pages:
- `/en/`
- `/en/features`
- `/en/use-cases`
- `/en/faq`
- and Chinese equivalents

Watch:
- users
- engaged sessions
- engagement rate
- average engagement time

### B. SEO to gameplay conversion

Goal question:
- after landing from search, do users actually try to play?

Use events:
- `create_room_click`
- `join_room_success`
- `game_start`

Recommended funnel:
1. organic landing page visit
2. `create_room_click` or `join_room_success`
3. `game_start`

If you use GA4 Exploration:
- create a Funnel exploration
- segment sessions by `Organic Search`
- break down by landing page

### C. Compare page intent quality

Interpretation:
- `/features` should help users understand product capability
- `/use-cases` should qualify scenario-fit traffic
- `/faq` should reduce hesitation

Signals:
- high organic traffic but no `create_room_click`: page attracts curiosity but weak product intent
- good `create_room_click` but low `game_start`: users are interested but fail to complete the multiplayer loop
- high engagement on FAQ with low conversion: answers may be useful, but not pulling users back to action strongly enough

## 4. Practical Review Cadence

### First 7 days after launch
- confirm indexing
- confirm sitemap fetch success
- confirm new pages appear in GA landing page reports

### First 30 days
- compare impressions, clicks, and CTR by page
- compare organic sessions and conversion events by landing page
- identify which page gets impressions but weak clicks

### After 30 days
- rewrite titles/descriptions for weak CTR pages
- expand pages that have impressions but thin query coverage
- merge or de-emphasize pages that get no impressions at all

## 5. What Is Still Missing

Current analytics is enough for first-pass evaluation, but not perfect.

Useful next upgrades:
- mark `create_room_click` and `game_start` as key events/conversions in GA4
- add a dedicated `join_room_click` event on the homepage submit path
- add outbound/internal CTA comparison if you want to compare support pages more precisely
