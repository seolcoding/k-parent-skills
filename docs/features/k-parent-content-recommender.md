# 콘텐츠 추천 기능 문서

`k-parent-content-recommender`는 자녀를 위한 유튜브 채널·영상·오디오형 콘텐츠를 추천하는 스킬이다. 핵심은 "아무거나 추천"이 아니라 차 안에서 듣기 좋은지, 교과 과정과 연결되는지, 부모-자녀 대화 주제로 확장되는지 평가하는 것이다.

## 사용 패키지

| 패키지 | 역할 |
| --- | --- |
| `packages/k-parent-source-youtube` | YouTube Data API v3 검색 결과를 부모용 콘텐츠 후보 필드로 정규화 |

## 현재 범위

- 차 안에서 듣기 좋은 유튜브/오디오형 콘텐츠 추천
- 학년·과목·단원 기반 교과 연계
- 부모가 던질 대화 질문 생성
- 후속 활동 제안
- 채널 신뢰도, 광고성, 연령 적합성, 현재성 확인
- `searchVideos({ q, safeSearch: "strict" })` 기반의 영상 후보 조회
- 기본 조회 옵션은 `safeSearch: "strict"`, `regionCode: "KR"`, `relevanceLanguage: "ko"`를 사용
- 출력 필드: 영상 ID, 제목, 채널명, 게시일, 설명, 썸네일, `https://youtu.be/<videoId>` URL, provenance/freshness metadata

## 추천 레코드 후보

```json
{
  "child_grade": "초3",
  "subject": "과학",
  "unit": "동물의 한살이",
  "ride_duration_minutes": 25,
  "screen_light": true,
  "items": [
    {
      "type": "youtube_video",
      "channel": "예시 과학 채널",
      "title": "배추흰나비의 한살이",
      "duration_minutes": 12,
      "why": "음성 설명만으로도 흐름을 이해하기 쉽고 초3 과학 단원과 연결됨",
      "curriculum_link": "초등 3학년 과학 동물의 한살이",
      "conversation_prompts": [
        "알에서 어른벌레가 되기까지 가장 신기한 단계는 뭐였어?",
        "우리 주변에서 관찰할 수 있는 곤충은 뭐가 있을까?",
        "사람의 성장 과정과 곤충의 한살이는 어떻게 다를까?"
      ],
      "follow_up": "집에 와서 종이에 한살이 순서 그려보기",
      "needs_current_check": true
    }
  ]
}
```

## 환경변수

- `KSKILL_YOUTUBE_KEY` — YouTube Data API v3 API key. 키 발급은 `OWNER-TASKS.md` 참고.

## 픽스처 갱신

```bash
KSKILL_YOUTUBE_KEY=... npm run refresh:fixtures --workspace k-parent-source-youtube -- "검색어"
```

## 남은 확장 후보

- 학년/교과/단원 taxonomy
- 유튜브 채널 후보 registry
- 차 안 듣기 적합성 scoring
- 부모 대화 질문 generator
- 영상 추천의 광고성/쇼츠/자극성 필터
