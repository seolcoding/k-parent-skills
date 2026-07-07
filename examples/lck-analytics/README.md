# LCK Analytics skill pack

k-skill 버전의 `lck-analytics` 스킬 팩입니다.

- Original source: <https://github.com/jerjangmin/share/tree/main/SKILL/lck-analytics>
- Original author: `jerjangmin`
- This repo adaptation: npm workspace 구조에 맞춘 k-skill 패키징. 현재 release workflow는 비활성 상태입니다

포함 항목:

- `SKILL.md`: 에이전트에 바로 줄 수 있는 스킬 문서
- `scripts/sync-oracle.js`: Oracle-style CSV → historical cache JSON
- `scripts/build-match-report.js`: 날짜별 match analysis 생성
- `scripts/analyze-live-game.js`: live game analysis 생성
- `samples/oracle-lck-sample.csv`: local smoke test용 샘플 CSV
