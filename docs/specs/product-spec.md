# K-Parent Product Spec

## Product goal

`k-parent-skills` should become a Korea-focused parent assistant that turns official and public sources into timely decisions, reminders, and safe next actions.

The product is not another notice inbox and not an automatic government-application robot. It is a mobile, messenger, and voice-friendly assistant for parents who need to know:

- what matters today
- what needs a decision this week
- what can be done this weekend
- what application or reservation deadline should not be missed

## Target users

Primary users:

- Korean parents with infants, preschool children, or elementary-school children
- parents managing multiple apps: school, kindergarten, childcare, academy, public reservation, welfare, maps, shopping
- parents who need mobile-first answers during commute, school run, lunch break, or weekend planning

Secondary users:

- grandparents or caregivers who need simpler summaries
- multicultural families who benefit from translated summaries while preserving Korean official source text

## MVP scope

The recommended MVP combines high-trust official sources and low-risk action handoff:

1. Today brief
   - school meal
   - allergy and calorie summary
   - school schedule or notice reminders
   - family calendar candidates

2. School, kindergarten, and childcare lookup
   - school and institution search
   - practical comparison cards
   - hours, care options, class size, cost, safety, vehicle, meal, and official links
   - no ranking-style leaderboards

3. Weekend outing and event recommendation
   - TourAPI, public playground/park data, public reservation, library, lifelong education, and local event sources
   - age, weather, distance, cost, indoor/outdoor, and schedule fit

4. Benefit and application reminder
   - Government24, Bokjiro, education office, local government, and public reservation guidance
   - eligibility summary, required documents, deadline, official deep link
   - no automatic submission

5. Car-friendly learning content
   - YouTube/audio recommendations that work without screen attention
   - curriculum link
   - parent-child conversation prompts

## Non-goals for early versions

- No direct Government24, Bokjiro, childcare, or public reservation submission.
- No storage of certificate credentials, resident registration numbers, or public-service passwords.
- No full mirroring of private culture-center sites.
- No school or childcare institution ranking UX.
- No shopping-first product direction.
- No automatic purchase, cart add, reservation, cancellation, or payment.

## User flows

### Daily brief

Input:

- child profile
- school/institution id
- date
- parent notification preferences

Output:

- meal summary
- allergy warning if relevant
- school schedule items
- reminders and deadlines
- source freshness
- suggested next action

### Weekend recommendation

Input:

- child age/stage
- home region or temporary location
- date range
- weather and fine-dust context
- budget and indoor/outdoor preference

Output:

- 3 to 7 candidate places or events
- official URL
- distance and travel hint
- cost and reservation status
- age fit
- why it fits this family
- stale-data warning if applicable

### Application guidance

Input:

- family situation disclosed by parent
- child age/stage
- region
- target service or question

Output:

- eligibility summary
- required documents
- application period
- official link
- checklist
- reminder candidate
- handoff warning for identity verification or final submission

### School document capture

Input:

- photo, PDF, screenshot, or downloaded attachment

Output:

- original file reference
- OCR text
- extracted date, time, place, deadline, cost, materials, target grade, issuer
- calendar/reminder/checklist candidate
- confirmation screen before side effects

## Product surfaces

Initial surfaces:

- mobile web app
- messenger-style command box
- voice-friendly short-answer layer

Later surfaces:

- browser extension or share target for school documents
- calendar integration
- academy message ingestion
- family dashboard

## Quality gates

Before a product surface ships:

- source URL and source freshness are visible
- recommendation reason is visible
- official data and review/community signal are separated
- sensitive actions require confirmation
- mobile layout works at narrow widths
- empty, stale, blocked, and failed-source states are explicit
- gstack QA covers desktop and mobile

## Success metrics

Early product metrics:

- daily brief completion rate
- number of confirmed calendar/reminder candidates
- weekend recommendation open rate
- application reminder save rate
- source freshness failure rate
- parent correction rate for extracted document fields

Trust metrics:

- source-visible answer rate
- stale-data warning rate
- unsupported-action handoff clarity
- affiliate disclosure visibility
