# JiDong Lab 포트폴리오 사이트

## 프로젝트 구조
- **프레임워크**: Astro 4 + React + Tailwind
- **배포**: Vercel (hybrid SSR/SSG)
- **콘텐츠**: Astro Content Collections (build-logs, tips, ai-news)
- **외부 연동**: Dev.to API, GitHub API, Google Custom Search

## 글쓰기 톤 & 스타일

### 톤: toss tech + 반말
- **반말**로 쓴다. "~합니다" 대신 "~한다", "~이다"
- 짧고 직관적인 문장. 불필요한 수식어 없이 핵심만
- 기술 용어는 그대로 쓴다 (번역하지 않는다)
- 구어체가 아닌 **건조한 반말** (toss tech 톤)

### 예시
```
✅ "커밋 diff를 Claude에게 넘기면 빌드 로그를 자동으로 생성한다."
✅ "큰 작업을 쪼개면 각 단계의 품질이 올라간다."
✅ "자동화에 투자한 시간은 며칠 안에 회수된다."

❌ "커밋 diff를 Claude에게 넘기면 빌드 로그를 자동으로 생성합니다."
❌ "대박! 이거 진짜 꿀팁이에요~"
❌ "오늘은 정말 유용한 팁을 공유해드리려고 합니다."
```

### 블로그 포스트 포맷
- 제목: 명확하고 구체적. "~하는 법", "~ 패턴", "~ 구성법"
- 본문: h2로 섹션 구분, 코드 예시 포함, 핵심 원칙은 blockquote
- 인라인 코드: 변수명, 파일명, CSS값 등은 반드시 backtick으로 감싼다

### AI News 자동 포스트
- 같은 반말 톤 유지
- "~가 발표됐다", "~가 업데이트됐다" 식으로
- 소스 링크 반드시 포함
- 불필요한 감탄사 없이 팩트 위주

## 디자인 컨벤션
- 기본 테마: toss.tech 스타일 (라이트, 클린)
- 액센트 색상: 초록 (#00c471)
- 폰트: IBM Plex Sans KR (본문/헤딩) + JetBrains Mono (코드)
- 인라인 코드: 초록빛 배경 + 테두리로 일반 텍스트와 구분

## 커밋 컨벤션
- conventional commits (feat, fix, chore, docs)
- 한국어 또는 영어 (혼용 가능)
