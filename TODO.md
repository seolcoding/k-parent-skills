# K-Parent Skills backlog

현재 자산의 ID, 경로, 구현·검증·배포 상태는 `ssot/registry/*.json`이 관리한다.
이 문서는 SSOT에 아직 완료 상태로 올릴 수 없는 후속 작업만 기록한다.

## P0 — 운영 안전 경계

- [x] `k-parent-api`에 Bearer 인증과 tenant별 namespace 격리를 구현했다.
- [x] local durable memory adapter에 AES-256-GCM, TTL 삭제, export/delete, 동의 철회를 구현했다.
- [x] Flutter 재사용 HITL 승인 UI가 scope, 위험도, 만료, official-site handoff를 명확히 보여준다.
- [ ] 실행 worker를 추가할 때 approval digest 검증과 one-time consumption을 강제한다.
- [x] raw 가족 대화·학교 문서·credential을 막는 log/trace/error redaction gate를 구현했다.

## P1 — Runtime과 데이터 운영

- [x] local crawler/adapter refresh scheduler, retry, provenance, freshness 상태를 구현했다.
- [x] 부모용 NEIS·교육 route를 전용 `k-parent-proxy`로 추출했다.
- [x] 부모와 무관한 전환용 proxy route를 SSOT와 현재 구현 경계에서 제거했다.
- [ ] 학교알리미·유치원알리미·data.go.kr 후보 endpoint를 live probe로 재확인한다.
- [ ] 운영 관측성, rate limit, alert, backup/restore, incident runbook을 갖춘다.

## P1 — 대화·콘텐츠 안전

- [ ] 실제 가족 대화 대신 synthetic 시나리오 taxonomy와 회귀 세트를 확장한다.
- [ ] 연령·발달 단계 suitability, 광고/쇼츠 제외, 출처 품질을 콘텐츠 추천 계약에 추가한다.
- [ ] 질문 생성, 후속 질문, 위험 신호 handoff의 평가 기준을 정의한다.
- [ ] 자녀 식별자와 대화 원문 비수집을 CI fixture 검사로 강화한다.

## P2 — 제품화

- [ ] Flutter의 HITL surface를 실제 외부 작업 workflow에 연결한다. memory consent UX는 오늘 화면에 연결됐다.
- [ ] mobile/web 배포 후에만 SSOT deployment와 verification을 승격한다.
- [ ] 성취기준 범위를 통합교과·도덕·실과·체육·예술과와 중학교로 확장한다.
- [ ] 첫 실제 배포 대상이 확정되면 release/publish automation을 도입한다.

## 완료 조건

- 구현과 문서를 함께 변경한다.
- `npm run ssot:generate`, `npm run ci`와 변경 영역의 앱/서비스 검증을 통과한다.
- production evidence가 없으면 `deployed` 또는 `production-verified`로 표시하지 않는다.
- 시크릿, 인증 상태, raw 개인정보, generated report, 대형 crawl output을 commit하지 않는다.
