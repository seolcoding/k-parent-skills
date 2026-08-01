# K-Parent Skill Conversion Strategy Research

Date: 2026-05-01

This note records follow-up research on converting `k-skill` into a Korea-focused parent voice and assistant skill ecosystem. Treat API quotas, endpoint details, legal interpretations, and private-site selectors as research inputs that require source verification before implementation.

## Executive summary

Converting `k-skill` into a parent-focused assistant skill repository is realistic. The upstream architecture already has useful traits for this domain:

- independent skill documents
- explicit "user login required" distinctions
- optional proxy usage
- mixed JavaScript and Python implementation paths
- room for modular adapters, a central normalization layer, and minimal secret storage

The safest product strategy is read-heavy and decision-support-heavy:

- Use official sources for meals, school information, kindergarten and childcare disclosures, places, festivals, public cultural events, public service information, and welfare guidance.
- Use deep links, checklists, and reminders for applications, reservations, payments, and identity-heavy flows.
- Avoid early automatic login, automatic application submission, and broad private-site scraping.

Recommended MVP:

1. School and kindergarten meals.
2. School, kindergarten, and childcare comparison.
3. Weekend outing recommendations.
4. Festivals and public events.
5. Benefit and application reminders.

Avoid in the initial phase:

- submitting Government24, Bokjiro, public reservation, or childcare applications on behalf of parents
- storing public-site credentials or certificate credentials
- broad crawling of private culture-center sites
- ranking schools or childcare institutions as if they were competitive leaderboards

## Product assumptions

The research assumes parents of infants, preschool children, and elementary-school children. The backend should support mobile app, messenger, and voice-assistant clients.

The product's core questions are:

- What does this parent need today?
- What should this family decide this weekend or this month?
- What deadline should not be missed?

The assistant should optimize for summary, comparison, and next action rather than raw search results.

Example intents:

- "오늘 우리 아이 학교 점심 알려줘."
- "이번 주말 5세 아이랑 갈 수 있는 무료 실내 장소 3곳 추천해줘."
- "우리 동네 어린이집 중 통학차량 있고 평가 최근인 곳 찾아줘."
- "이번 달 신청 마감 임박한 지원금 알려줘."

## Source priority model

Use this priority order by default:

1. Official API or official disclosure.
2. Public data file download.
3. Map or local-search API for location freshness.
4. Limited scraping for missing public fields.
5. Community, blog, and review signals only as secondary context.

School and childcare data should be exposed as practical comparison fields rather than rankings. The default UX should emphasize distance, hours, class size, care options, meal/safety information, cost, official notices, and deadlines.

## Target architecture

Parent-facing clients should share a common backend.

```text
Parent user
  -> voice/chat/mobile client
  -> skill router
  -> profile and consent manager
  -> normalization layer
  -> official API adapters
  -> private/public API adapters
  -> scraping workers
  -> education, childcare, tourism, public service, map, and event sources
  -> cache and search index
  -> recommendation, comparison, reminder, and deep-link actions
```

The repository keeps upstream `k-skill` skill independence, but parent-specific production work should centralize:

- region code mapping
- education office and school code mapping
- kindergarten and childcare institution ids
- TourAPI legal-dong and category codes
- Seoul reservation ids and official application urls
- child age/stage mapping
- source freshness and provenance

## Module data priorities

| Module | Parent questions | Required fields | Primary sources | Fallback |
| --- | --- | --- | --- | --- |
| Meals | Today/tomorrow menu, allergy, calories | `meal_date`, `school_code`, `meal_type`, `menu`, `allergens`, `origin`, `calories`, `nutrition`, `updated_at` | NEIS meal data | kindergarten/childcare disclosure where available |
| School info | nearby school comparison, schedule, contact | `school_code`, `name`, `level`, `address`, `tel`, `homepage`, `schedule`, `disclosure_summary` | NEIS school info and schedule | Schoolinfo disclosure downloads |
| Kindergarten/childcare | class size, teacher ratio, cost, shuttle, evaluation, meals | `institution_id`, `type`, `operator_type`, `hours`, `services`, `teacher_ratio`, `fees`, `meal_mode`, `evaluation_month`, `shuttle` | kindergarten disclosure, childcare open data | local government data |
| Play places | nearby playgrounds, parks, museums, child-friendly places | `place_id`, `content_type`, `title`, `address`, `lat`, `lng`, `indoor_outdoor`, `fee`, `parking`, `age_tags`, `source_freshness` | public playground/park datasets, TourAPI | map/local search APIs |
| Festivals | weekend festivals, free events, age fit | `festival_id`, `title`, `start_at`, `end_at`, `venue`, `fee_type`, `organizer`, `image`, `booking_url`, `region_codes` | TourAPI, national/local festival datasets | local event APIs/pages |
| Culture and events | child classes, branch programs, enrollment timing | `provider`, `branch`, `category`, `age_min`, `age_max`, `start_date`, `weekday`, `time`, `tuition`, `material_fee`, `capacity`, `booking_url` | culture portal, Seoul culture events, Seoul public reservation | limited culture-center crawling |
| Applications | family benefits, current applications, deadlines | `service_id`, `title`, `eligibility`, `selection_criteria`, `apply_period`, `apply_method`, `required_docs`, `official_url`, `reminder_state` | Government24, Bokjiro, Seoul public reservation | official pages and manual curation |

## API candidates

Priority public-source families:

- NEIS: `mealServiceDietInfo`, `schoolInfo`, `SchoolSchedule`.
- Schoolinfo: public school disclosure API and downloadable disclosure files.
- Kindergarten disclosure: open API entry points and meal/disclosure pages.
- Childcare information: childcare open API and waitlist/basic-info guidance.
- TourAPI: `locationBasedList2`, `searchKeyword2`, `searchFestival2`, `detailCommon2`, `detailIntro2`, `detailInfo2`, `detailImage2`, `areaBasedSyncList2`, `detailPetTour2`.
- Culture portal: public performance and display APIs.
- Government24 public service information datasets.
- Bokjiro central and local welfare service datasets.
- Seoul public service reservation datasets and `rsv_svc_id` deep links.

Private or semi-private freshness supplements:

- Kakao Local API for POI freshness and coordinate correction.
- Naver local search and maps APIs for POI, geocoding, and route support.

Do not assume published quotas or endpoint details are stable. Verify current docs before implementation.

## Similar projects and lessons

| Project | Lesson |
| --- | --- |
| `k-skill` | Reuse the modular adapter repository pattern and explicit login/proxy boundaries. |
| Kids Note | Parent-institution communication and multilingual summaries matter, but this project should not become only a message inbox. |
| MomMom | Age-based outing discovery is validated by the market; combine official data with curation. |
| Schoolinfo and kindergarten disclosure | Official data is strong but needs conversational summary and practical comparison cards. |
| Government24 and Bokjiro | Use official data for guidance and reminders; final application stays on official surfaces. |
| Home Assistant Assist, OpenVoiceOS, Mycroft, Rhasspy | Voice/assistant layers can be privacy-sensitive and modular, but Korean parent data connectors must be built separately. |

## Scraping strategy

Scraping is a last-mile supplement, not the core product.

Candidate surfaces:

- kindergarten disclosure detail pages, only where official API coverage is insufficient
- Lotte, Hyundai, Shinsegae, and Homeplus culture-center public class search pages

Guardrails:

- check terms, robots, login boundaries, rate limits, and data licenses before implementation
- crawl only deltas or public search results, not full mirrors
- keep booking and payment as official-site deep links
- store source URL, fetched time, parser version, and parse confidence
- use headless browser QA before relying on selectors

Suggested cadence:

- public disclosure and stable program data: daily or weekly
- culture-center enrollment windows: more frequent polling only during known registration periods
- private sites: conservative polling, manual review, and fast disable switches

## Legal and privacy constraints

Design constraints from the research:

- Parent is the account owner. Child data is stored as a minimal child profile under the parent account.
- Avoid direct child signup for children under 14.
- Store only the minimum child profile needed: age band or birth month, school/institution code, interests, constraints.
- Provide parent-accessible child data view, correction, deletion, and notification withdrawal.
- Default location should be coarse region. Fine GPS should be temporary and request-scoped.
- Do not collect resident registration numbers or public-site credentials.
- Use OAuth/email for the product account; official government identity flows stay on official sites.
- Avoid substantial or repeated database extraction from protected databases.
- Preserve attribution and license constraints. Avoid republishing transformed images or restricted media from sources such as TourAPI when rights are unclear.

Sensitive school, safety, violence, cost, or performance data should not be presented as ranking cards by default. Put sensitive details behind explicit expansion and explain source context.

## Recommended production architecture

Use a hybrid architecture:

- TypeScript/Node.js for adapters and API-facing helpers, matching `k-skill` packages.
- Python for ETL, ranking experiments, and quality validation where useful.
- Postgres/PostGIS for normalized source records and location queries.
- Redis for short-lived cache, locks, and notification queues.
- Postgres full-text search or a separate search index for content and program lookup.
- A small parent-domain proxy rather than a large generic API layer.

## Initial schema

| Table | Key columns | Purpose |
| --- | --- | --- |
| `parent_profile` | `id`, `provider`, `locale`, `home_region`, `notification_prefs` | parent account |
| `child_profile` | `id`, `parent_id`, `birth_ym`, `stage`, `school_code`, `institution_id`, `interests` | minimal child profile |
| `region_code_map` | `sido_code`, `sigungu_code`, `atpt_ofcdc_sc_code`, `lDongRegnCd`, `lDongSignguCd` | education, tourism, and administration code bridge |
| `institution` | `id`, `type`, `official_code`, `name`, `addr`, `lat`, `lng`, `source`, `updated_at` | school, kindergarten, childcare, culture center |
| `content_item` | `id`, `kind`, `source_key`, `title`, `summary`, `age_band`, `start_at`, `end_at`, `fee`, `booking_url` | event, outing, class, festival |
| `application_service` | `id`, `provider`, `eligibility`, `apply_method`, `required_docs`, `official_url`, `deadline` | benefit and application metadata |
| `consent_log` | `id`, `parent_id`, `purpose`, `granted_at`, `revoked_at`, `retention_policy` | consent and withdrawal audit |

## Authentication and consent flow

| Stage | User action | System behavior |
| --- | --- | --- |
| Login | Parent signs in via Kakao, Naver, or email | Create only the product account. Do not store public-service credentials. |
| Location | Parent asks for nearby places | Request scoped location consent. Prefer coarse region by default. |
| Child registration | Parent enters age band, school/institution, interests | Store under parent account. Avoid direct child account creation. |
| Notifications | Parent selects meal, registration-open, deadline, weekend recommendations | Store quiet hours, channel, and explanation source. |
| Application handoff | Parent taps "apply" | Send parent to official Government24, Bokjiro, Seoul reservation, childcare waitlist, or source page. |

## Roadmap

| Milestone | Scope | Deliverables | Risk |
| --- | --- | --- | --- |
| Foundation | source inventory, legal check, code normalization | source catalog, code map, license policy | code mismatch, license interpretation |
| MVP | meals, school, kindergarten, childcare | institution search, today's meal, comparison cards, parent profile | code matching errors, disclosure update timing |
| Outing expansion | play places, festivals, public events | nearby search, weekend recommendation, family filters, Seoul reservation links | location consent, POI freshness |
| Application support | benefits, welfare, reservation deep links | eligibility summary, document checklist, deadline reminder | expectation gap around automatic application |
| Private expansion | culture-center scraping and curation | department-store/mart class search, registration-open monitor, manual review tooling | login, terms, anti-bot, site changes |
| Advanced | personalization, multilingual, voice optimization | age/distance/budget ranking, multilingual summaries, voice prompt set | recommendation quality, over-notification |

## Practical recommendation

Start with official APIs and public datasets, prove parent value through a daily/weekly assistant surface, and add private crawling last. The product should be positioned as a Korean life assistant for parents that turns official sources into timely decisions, reminders, and safe deep links.
