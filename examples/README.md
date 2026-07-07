# examples/ — 상속받은 upstream 예제 스킬

이 디렉토리의 스킬들은 원본 [`NomaDamas/k-skill`](https://github.com/NomaDamas/k-skill) 컬렉션에서 상속받은 **참고용 예제**다. `k-parent-skill` 제품 스킬이 아니다.

- 제품 스킬은 저장소의 `skills/<skill-name>/SKILL.md` 에 있다.
- 여기 예제 스킬은 아키텍처 패턴·구현 선례·proxy/패키지 사용법을 참고하기 위해 보존한다.

## 설치

`examples/` 는 `skills` 설치 CLI 의 표준 컨테이너가 아니다. 예제 스킬을 설치하려면 `--full-depth` 를 함께 줘야 발견된다.

```bash
npx --yes skills add <owner/repo> --full-depth --skill hwp
# 또는 예제까지 전체 설치
npx --yes skills add <owner/repo> --all --full-depth -g
```

## Hosted Proxy 예제

아래 예제는 기본 hosted proxy(`k-skill-proxy.nomadamas.org`)를 경유하므로 일반 사용자 쪽 API key 없이 바로 써볼 수 있다. self-host proxy 운영자만 upstream key를 서버 환경변수로 관리한다.

| 예제 | Skill | 사용자 API key | Feature doc |
| --- | --- | --- | --- |
| 블루리본 맛집 조회 | `blue-ribbon-nearby` | 불필요 | [blue-ribbon-nearby](../docs/features/blue-ribbon-nearby.md) |
| 근처 공영주차장 찾기 | `parking-lot-search` | 불필요 | [parking-lot-search](../docs/features/parking-lot-search.md) |
| 네이버 쇼핑 가격비교 | `naver-shopping-search` | 불필요 | [naver-shopping-search](../docs/features/naver-shopping-search.md) |
| 네이버 뉴스 검색 | `naver-news-search` | 불필요 | [naver-news-search](../docs/features/naver-news-search.md) |
| LH 청약 공고 조회 | `lh-notice-search` | 불필요 | [lh-notice-search](../docs/features/lh-notice-search.md) |

## 검증

`scripts/validate-skills.sh` 는 `skills/*` 와 함께 `examples/*` 의 각 스킬도 검증한다(`SKILL.md` 존재, frontmatter `name == 디렉토리명`). `npm run ci` 로 실행된다.
