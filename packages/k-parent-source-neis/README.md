# k-parent-source-neis

Official NEIS adapter for K-Parent Skill.

The package is fixture-first.

## Configuration

Live requests require `KEDU_INFO_KEY` or an explicit `apiKey`.

## Usage

```js
const { searchSchools, getMeals, getSchedule } = require("k-parent-source-neis");
const schoolInfoPayload = require("./test/fixtures/school-info.json");
const mealPayload = require("./test/fixtures/meal.json");
const schedulePayload = require("./test/fixtures/schedule.json");

async function main() {
  const schools = await searchSchools({ region: "서울", schoolName: "서울초등학교", payload: schoolInfoPayload });
  const meals = await getMeals({ schoolCode: "SCHOOL_CODE", educationOfficeCode: "B10", from: "20260601", to: "20260605", payload: mealPayload });
  const schedules = await getSchedule({ schoolCode: "SCHOOL_CODE", educationOfficeCode: "B10", from: "20260601", to: "20260605", payload: schedulePayload });
  return { schools, meals, schedules };
}

main().then(console.log).catch(console.error);
```

Outputs keep provenance/source metadata and freshness metadata so parent workflows can show origin and staleness.

## Testing

```bash
npm test
```

Tests run fully offline from `test/fixtures/`.

## Fixtures refresh

Run this command only when you are ready to call the live API and overwrite local fixtures.

```bash
KEDU_INFO_KEY=... npm run refresh:fixtures
```
