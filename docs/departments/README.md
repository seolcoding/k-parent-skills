# Department Index

K-Parent Skills는 개별 스킬을 아래 디파트먼트로 묶어 운영한다. 디파트먼트는 제품/로드맵/문서 분류이며, 제품 스킬 설치 단위는 `skills/<skill-name>/SKILL.md`다. 범용 한국 생활 스킬은 upstream `k-skill`에 남긴다.

| Department | Label | Scope | Doc |
| --- | --- | --- | --- |
| `school` | 학교 | 학교, 유치원, 안내문, 방과후, 신청 마감 | [school.md](school.md) |
| `academy` | 학원 | 학원 앱/API, 일정, 숙제, 출결, 보강, 결제 | [academy.md](academy.md) |
| `play` | 놀이 | 놀거리, 체험, 축제, 문화센터, 행사 | [play.md](play.md) |
| `life` | 생활 | 돌봄, 복지, 병원, 행정 신청, 가족 일정 | [life.md](life.md) |
| `trend` | 트렌드 | 육아 트렌드, 지역 이슈, 인기 프로그램 | [trend.md](trend.md) |
| `shopping` | 쇼핑 | 준비물, 교재, 장난감, 육아용품, 가격/재고, 제휴 추천 | [shopping.md](shopping.md) |
| `nutrition` | 영양 | 급식, 유치원 식단, 알레르기, 집밥 보완 | [nutrition.md](nutrition.md) |

## Current Skill Map

| Skill | Primary department | Secondary departments |
| --- | --- | --- |
| `k-parent-school-info` | `school` | `life` |
| `k-parent-school-doc-capture` | `school` | `life` |
| `k-parent-kindergarten-info` | `school` | `life` |
| `k-parent-academy-connector` | `academy` | `life` |
| `k-parent-play-finder` | `play` | `life` |
| `k-parent-festival-finder` | `play` | `trend` |
| `k-parent-culture-center-events` | `play` | `life`, `trend` |
| `k-parent-application-helper` | `life` | `school`, `academy` |
| `k-parent-meal-planner` | `nutrition` | `school`, `life` |
| `k-parent-shopping-recommender` | `shopping` | `school`, `academy`, `play`, `nutrition` |
| `k-parent-mobile-agent` | `life` | `school`, `academy`, `play`, `trend`, `nutrition` |
| `k-parent-data-collector` | `trend` | `school`, `play`, `life` |
| `k-parent-schedule-manager` | `life` | `school`, `academy`, `play` |
| `k-parent-travel-recommender` | `play` | `trend`, `life` |
| `k-parent-knowledge-helper` | `life` | `school`, `academy`, `nutrition` |
| `k-parent-content-recommender` | `play` | `school`, `trend`, `life` |
| `k-parent-quiz-maker` | `school` | `life` |
| `k-parent-setup` | `life` | all departments |
