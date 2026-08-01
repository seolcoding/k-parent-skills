const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calendarCandidate,
  candidateId,
  dedupeCandidates,
  toICS,
} = require("k-parent-calendar");

test("candidateId is stable sha256 of title|date|location", () => {
  const expected = candidateId("운동회", "2026-06-10", "운동장");
  assert.equal(expected.length, 64);
  assert.match(expected, /^[0-9a-f]{64}$/);
  assert.equal(expected, candidateId("운동회", "2026-06-10", "운동장"));
  assert.notEqual(expected, candidateId("운동회", "2026-06-11", "운동장"));
});

test("calendarCandidate is guarded as calendar_write and never executable", () => {
  const candidate = calendarCandidate({
    title: "현장학습",
    date: "2026-06-15",
    time: "09:00",
    location: "서울대공원",
    supplies: ["도시락", "물"],
    cost: "5000원",
    deadline: "2026-06-10",
    targetGrade: "3학년",
    sourceDocId: "doc-1",
  });

  assert.equal(candidate.type, "calendar_write");
  assert.equal(candidate.requiresConfirmation, true);
  assert.equal(candidate.executable, false);
  assert.equal(candidate.id, candidateId("현장학습", "2026-06-15", "서울대공원"));
  assert.equal(candidate.date, "2026-06-15");
  assert.deepEqual(candidate.supplies, ["도시락", "물"]);
  assert.equal(candidate.deadline, "2026-06-10");
  assert.equal(candidate.dueAt, "2026-06-10");
  assert.match(candidate.description, /준비물/);
});

test("calendarCandidate requires title and date", () => {
  assert.throws(() => calendarCandidate({ date: "2026-06-15" }), /title is required/);
  assert.throws(() => calendarCandidate({ title: "x" }), /date is required/);
});

test("dedupeCandidates removes same-id duplicates, keeps first", () => {
  const a = calendarCandidate({ title: "운동회", date: "2026-06-10", location: "운동장" });
  const b = calendarCandidate({ title: "운동회", date: "2026-06-10", location: "운동장" });
  const c = calendarCandidate({ title: "소풍", date: "2026-07-01", location: "공원" });

  const deduped = dedupeCandidates([a, b, c]);
  assert.equal(deduped.length, 2);
  assert.deepEqual(
    deduped.map((x) => x.id).sort(),
    [a.id, c.id].sort()
  );
});

test("toICS produces a valid VCALENDAR/VEVENT string", () => {
  const candidate = calendarCandidate({
    title: "학부모 총회",
    date: "2026-03-20",
    location: "본관 강당",
    time: "14:00",
  });

  const ics = toICS([candidate], { now: "2026-01-01T00:00:00Z" });

  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /VERSION:2\.0/);
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260320/);
  assert.match(ics, /SUMMARY:학부모 총회/);
  assert.match(ics, /LOCATION:본관 강당/);
  assert.match(ics, /DESCRIPTION:/);
  assert.match(ics, /END:VEVENT/);
  assert.ok(ics.trim().endsWith("END:VCALENDAR"));
  // UID may be RFC5545 line-folded (CRLF + space); compare on the unfolded form.
  const unfolded = ics.replace(/\r\n /g, "");
  assert.match(unfolded, new RegExp(`UID:${candidate.id}@k-parent-skills`));
});

test("toICS handles dotted dates and skips invalid entries", () => {
  const good = calendarCandidate({ title: "방학식", date: "2026.07.24" });
  const ics = toICS([good, { title: "broken", date: "not-a-date" }]);
  assert.match(ics, /DTSTART;VALUE=DATE:20260724/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);
});
