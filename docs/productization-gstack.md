# gstack Development and Productization Plan

`k-parent-skill` starts as a skill repository, but the product direction should move toward tested parent workflows. gstack is the operating loop for turning each department into a usable product surface, not just a document set.

## Product Thesis

The core product is a mobile-first parent agent deployed on a server so non-developer parents can use it agentically from a phone. The product should not be limited to affiliate shopping or static skills.

The first wedge is:

1. Parent opens a mobile web/app surface.
2. Parent connects or inputs child context: school, grade, academy, region, schedule, interests.
3. The system collects real data: school data, timetables, notices, lifelong education, festivals, events, trend sources, and crawled public pages.
4. The agent converts data into a child schedule, recommendations, reminders, and answers.
5. The product helps with everyday decisions: what is happening, what to prepare, where to go, what to learn or listen to, what to talk about, what to book, what to remember.

Coupang affiliate links are optional monetization attached to purchase-intent moments. They are not the core logic.

This wedge connects the strongest departments: `school`, `academy`, `play`, `life`, `trend`, `nutrition`, and secondarily `shopping`.

## Voice and Assistant Product Principles

The backend should support mobile, messenger, and voice clients. The interface should answer practical parent intents by combining time, region, child age, cost, and action state:

- today: meals, school schedule, notices, reminders
- this week: application deadlines, academy conflicts, preparation items
- this weekend: indoor/outdoor outings, festivals, public events, weather-aware recommendations
- this month: enrollment, benefit, culture-center, and public reservation windows

Use official data for read-heavy answers and deep-link handoff for applications, reservations, payments, and identity verification.

## Research-Backed Differentiation

The product should not become another school notice inbox. Existing parent apps are strong at institution-specific push communication, but parents still have to combine separate school, academy, childcare, event, welfare, shopping, and calendar contexts by hand.

The agent should win through horizontal integration:

- NEIS meal plus allergy plus home dinner or shopping preparation.
- School notice OCR plus calendar candidate plus supply checklist.
- Academy message plus family schedule conflict detection.
- Weekend gap plus weather plus TourAPI/local festival/culture program search.
- Kindergarten or childcare disclosure plus commute, cost, safety, and care-hour comparison.
- Government24/Bokjiro guidance plus document checklist and reminder, with final submission left to the official site.

The user-visible promise is cross-domain synthesis and confirmed next actions.

## gstack Operating Loop

Use this loop for every product surface.

1. **Implement the smallest real flow**
   - Start with one parent task, not a generic dashboard.
   - Example: mobile parent home shows today's child schedule, school timetable, notices, local events, and recommended next actions.

2. **Dogfood with gstack browser QA**
   - Run the local or preview URL.
   - Exercise the flow as a parent on desktop and mobile widths.
   - Capture screenshots for upload, review, confirmation, and result states.

3. **Design review**
   - Check visual trust: no confusing automation, no unclear child-data handling, no hidden commercial recommendation.
   - Check density: parents should see child, date, deadline, place, materials, source, and next action without hunting.
   - Check mobile: schedule cards, data source status, OCR review, and candidate confirmation must fit without overlap.

4. **Benchmark**
   - Track first load, data refresh, school/timetable lookup, crawl latency, OCR extraction time, recommendation generation time, and schedule write time.
   - Keep a baseline before adding integrations or heavier UI.

5. **Canary after deploy**
   - Verify the deployed URL loads.
   - Run one smoke path per live department.
   - Watch for console errors, broken mobile layout, failed crawlers, stale data, failed uploads, and blank states.

6. **Document release**
   - Update `SKILL.md`, `docs/features/*`, department docs, and roadmap with the shipped behavior.
   - Do not let product behavior drift from the skill instructions.

## MVP Phases

### Phase 0: Skill OS and Data Contracts

- Maintain product skill folders under `skills/*`, inherited example skills under `examples/*`, and department docs.
- Define shared schemas for child profile, school source, timetable, notices, schedule item, crawl record, recommendation, document capture, calendar candidates, shopping candidates, and affiliate disclosure.
- Define resolver contracts for school, education office, kindergarten/childcare institution, district, event source, program source, and official application URL.
- Define the initial storage model: `parent_profile`, `child_profile`, `region_code_map`, `institution`, `content_item`, `application_service`, and `consent_log`.
- Define source priority and license policy before private crawling: official API, public file, map/local API, limited scraping, community signal.
- Keep CI limited to skill/document validation until real deploy surfaces exist.

### Phase 1: Mobile Parent Agent MVP

- Server-deployed mobile web surface for 일반 사용자.
- Child profile: school, grade, academy, region, interests, constraints.
- Today view: school timetable, notices, child schedule, local events, reminders, recommended next actions.
- Agentic input: "이번 주 챙길 거 정리해줘", "주말 갈 곳 추천해줘", "학교 일정 캘린더에 넣어줘".
- gstack checks: mobile first viewport, child switching, source freshness, empty states, safe confirmation prompts.

### Phase 2: Real Data Collection Layer

- School data and timetable integration.
- NEIS resolver and meal/schedule/timetable collectors with allergy and nutrition normalization.
- Kindergarten and childcare disclosure collectors for operating hours, cost, staff, meal, safety, vehicle, and application indicators.
- TourAPI, public playground/park datasets, public reservation, lifelong education, festivals, events, culture centers, and trend collectors.
- Government24 and Bokjiro information collectors for guidance, not automatic submission.
- Crawlers for education offices, school pages, libraries, local government pages, and non-open culture-center surfaces where allowed.
- Source freshness, crawl status, deduplication, and provenance.
- gstack checks: data refresh status, stale data warning, source link visibility.

### Phase 3: School Document Capture

- Local web surface for image/PDF upload.
- OCR text review screen.
- Extracted fields: date, time, place, materials, cost, deadline, target grade, issuer.
- Calendar candidate creation and confirmation.
- gstack checks: mobile upload, review screen, no overlapping text, empty/error states.

### Phase 4: Calendar and Recommendation Workflow

- Confirm-before-write calendar integration.
- Duplicate document detection.
- Reminder checklist for supplies, applications, payment deadlines, events, and travel preparation.
- Travel/place/event recommender using child age, schedule gaps, location, weather, budget, and interests.
- Curriculum-linked content recommender for car rides, commute, waiting time, and parent-child discussion.
- General knowledge assistant for parent questions with source-aware answers.
- gstack checks: calendar permission path, confirmation modal, cancellation path, recommendation explanation.

### Phase 5: Academy Connector

- Ingest academy messages, screenshots, or API data.
- Normalize classes, homework, attendance, makeup classes, counseling, billing, shuttle.
- Add read/write permission separation.
- gstack checks: account/login boundaries, child switching, schedule conflict states.

### Phase 6: Commerce as Add-on

- Convert materials/checklist items into shopping candidates only when purchase intent exists.
- Add Coupang Partners link generation after disclosure.
- Provide non-affiliate decision signals: price, delivery date, alternatives, offline/used option.
- gstack checks: disclosure visibility, no auto-cart/auto-buy path, mobile product comparison layout.

### Phase 7: Department Expansion

- `school`: real school data, timetable, notices, OCR, after-school applications.
- `play`: event, culture center, travel, and screen-light content recommendations for car rides.
- `nutrition`: meal planning from school/kindergarten menus plus allergy constraints.
- `trend`: parent trend summaries with source/date transparency.
- `shopping`: broader inventory/price comparison beyond Coupang as an add-on.

### Phase 8: Voice and Multilingual Layer

- Add voice-optimized prompts for daily brief, weekend recommendation, and deadline reminder flows.
- Keep official Korean source text intact and translate summaries only when needed.
- Support multicultural families and grandparents with simple-language summaries.
- gstack checks: transcript clarity, short-answer fallback, over-notification controls, and source visibility.

## Commercialization Model

Primary value:

- Mobile parent agent that reduces schedule, school, academy, event, and travel decision overhead.
- Server-deployed product that normal parents can use without local developer tooling.

Revenue options:

- Family premium plan for multi-child schedule, document automation, reminders, and data refresh.
- Local academy/center lead generation, only with clear sponsorship labeling.
- B2B school/academy document-to-calendar tools.
- Coupang Partners affiliate links from purchase-intent moments as a secondary revenue line.

Potential later revenue:

- Local partner listings for lifelong education, culture centers, and child-friendly travel programs with sponsorship labels.
- API/data subscriptions for normalized event and education data.

Non-negotiables:

- Always disclose affiliate relationships.
- Do not rank unsafe or unsuitable products for commission.
- Do not auto-purchase, add to cart, submit applications, or expose child data without explicit approval.
- Keep source documents and OCR outputs in user-controlled storage by default.
- Treat crawled data as potentially stale; show source and refresh time.

## gstack Quality Gates

Before a product surface ships:

- `npm run ci` passes.
- gstack dogfood confirms the core flow works on desktop and mobile.
- Screenshots show no broken layout, stale data ambiguity, hidden disclosure, or confusing child-data handling.
- Data refresh, upload/OCR/calendar/recommendation error states are visible and recoverable.
- Deployed canary passes on the production URL.

## First Build Candidate

Build this first:

`k-parent-mobile-agent` product surface:

1. Mobile home with one child profile.
2. School/timetable/source refresh panel.
3. Today's schedule and upcoming deadlines.
4. Local lifelong education, festival, event, and travel recommendations.
5. Agentic command box for parent questions and actions.
6. Confirm-before-write calendar/reminder actions.

This path is narrow enough to build, but broad enough to prove the actual product: an agentic mobile parent assistant backed by real data collection.

## Mobile MVP Acceptance Criteria

The first shipped screen is not a marketing page. It is a usable mobile parent home for one real workflow: "이번 주 챙길 것".

Required first viewport:

- child switcher with child stage/grade visible
- date scope: today and this week
- source freshness strip with last refresh time and stale/unknown states
- school/timetable/meal summary
- deadlines and preparation items
- recommendation row for local event/play/content candidates
- agentic command input

Required interaction states:

- empty source state with manual next step
- stale source state with source URL and refresh action
- ambiguous school/institution resolver state
- calendar candidate confirmation modal
- reservation/application/payment/purchase handoff modal
- affiliate disclosure state before product links
- OCR review-needed state for document-derived items

## Today Brief Contract

The first MVP workflow is "이번 주 챙길 것". It composes the same parent-facing fields across source packages:

- `child`: stage/grade only by default; no exact birth date required
- `scope`: date range, region, school/institution context
- `school`: timetable, schedule, meal, source freshness
- `documents`: OCR-derived events, supplies, deadlines, confidence, review-needed flag
- `applications`: deadline, required documents, official URL, login requirement
- `recommendations`: play/festival/culture/content candidates with reason and source
- `commerce`: optional shopping candidates only after purchase intent and disclosure
- `actions`: guarded candidates from `k-parent-core.guardActionCandidate`
- `sources`: source URL, source type, fetchedAt, freshness status

All write-like actions stay candidates until confirmation. Calendar write, reservation, application, message send, purchase, payment, and cancellation must render with `requiresConfirmation: true` and must not execute directly from the generated brief.

## gstack Mobile QA Checklist

Run these checks on desktop and mobile widths before claiming the MVP flow works:

- first viewport shows child, date range, source freshness, and next actions without scrolling confusion
- child switching changes visible profile context and does not leak another child's data
- stale/unknown sources are visible, not silently hidden
- confirmation modal names the exact action, target, source, and consequence
- calendar candidate can be cancelled without side effects
- OCR review screen shows original/captured source and extracted fields
- recommendation cards show reason, source, age fit, cost, and official final-check link
- affiliate disclosure appears before any Coupang product link
- console has no blocking errors
- mobile text does not overlap in source, modal, card, and command-input states

## Canary Smoke Paths

After deploy, run one smoke path per live product surface:

- login or anonymous entry loads the mobile parent home
- "이번 주 챙길 것" returns a Today Brief with at least one source freshness state
- school/timetable/meal source failure renders a recoverable error state
- document-derived item creates a review-needed calendar candidate, not a direct write
- recommendation path shows source, age fit, cost, and official final-check link
- guarded action opens confirmation or official handoff, never direct submission/payment
- deployed page has no blank first screen and no blocking console errors
