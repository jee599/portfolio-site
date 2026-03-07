# Claude Code 학습 프롬프트

> 이 파일을 프로젝트에 넣고 Claude Code에게 "LEARN-CLAUDE-CODE.md 기반으로 이 프로젝트에 적용 가능한 기능을 학습시켜줘"라고 요청하면 된다.

---

## 이 프롬프트의 목적

프로젝트의 구조와 워크플로우를 분석해서, 아래 Claude Code 기능 중 **실제로 적용 가능한 것**을 구체적인 설정 예시와 함께 제안한다. 이론이 아니라 **바로 쓸 수 있는 설정 파일**을 만들어주는 것이 목표다.

---

## 분석할 프로젝트 요소

아래 항목을 조사하고, 각 항목별로 적용 가능한 Claude Code 기능을 매핑한다:

1. **프레임워크 & 빌드 시스템** — 빌드 명령어, 린터, 포맷터
2. **테스트 구조** — 테스트 러너, 커버리지
3. **배포 파이프라인** — CI/CD, 배포 방식
4. **콘텐츠 구조** — CMS, 마크다운, i18n
5. **외부 API 연동** — 서드파티 서비스
6. **Git 워크플로우** — 브랜치 전략, PR 규칙
7. **팀 규모 & 협업** — 혼자 / 팀 / 오픈소스

---

## 적용할 Claude Code 기능 목록

### 1. CLAUDE.md 최적화

**점검 사항:**
- [ ] `CLAUDE.md`가 200줄 이하인가?
- [ ] 빌드/테스트/린트 명령어가 명시되어 있는가?
- [ ] 코드 스타일 규칙이 구체적인가? (예: "2-space indent" vs "코드 잘 써")
- [ ] 커밋 컨벤션이 정의되어 있는가?

**제안 구조:**
```markdown
# 프로젝트명

## 빌드 & 실행
- `npm run dev` — 로컬 개발
- `npm run build` — 프로덕션 빌드
- `npm test` — 테스트

## 코드 스타일
- [구체적인 규칙들]

## 아키텍처
- [디렉토리 구조 설명]

## 커밋 컨벤션
- [규칙]
```

### 2. Hooks 설정

**`.claude/settings.json`에 추가할 수 있는 Hook:**

```jsonc
{
  "hooks": {
    // 빌드 검증: 코드 편집 후 자동 빌드 체크
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "type": "command",
        "command": "npm run build 2>&1 | tail -5"
      }
    ],
    // 위험 명령 차단
    "PreToolUse": [
      {
        "matcher": "Bash",
        "type": "prompt",
        "prompt": "이 명령이 프로덕션 데이터를 삭제하거나 force push하는가?"
      }
    ],
    // 세션 시작 시 컨텍스트 주입
    "SessionStart": [
      {
        "type": "command",
        "command": "echo '현재 브랜치: '$(git branch --show-current) && echo '최근 커밋:' && git log --oneline -3"
      }
    ]
  }
}
```

**프로젝트별 추천 Hook 패턴:**

| 프로젝트 유형 | Hook | 용도 |
|---|---|---|
| 프론트엔드 | PostToolUse(Edit) | Prettier/ESLint 자동 실행 |
| API 서버 | PreToolUse(Bash) | DB 마이그레이션 보호 |
| 모노레포 | SessionStart | 현재 패키지 컨텍스트 주입 |
| 블로그/CMS | PostToolUse(Write) | 마크다운 frontmatter 검증 |

### 3. Custom Skills (`.claude/skills/`)

**프로젝트에 맞는 Skill 파일 생성:**

```yaml
# .claude/skills/new-post/SKILL.md
---
name: new-post
description: 새 블로그 포스트 생성
allowed-tools: Read, Write, Glob, Grep
user-invocable: true
---

$ARGUMENTS를 기반으로 새 포스트를 생성한다.

1. `src/content/` 디렉토리에서 기존 포스트 구조 확인
2. frontmatter 스키마 (`src/content/config.ts`) 확인
3. CLAUDE.md의 글쓰기 톤 & 스타일 준수
4. 파일 생성: `src/content/{collection}/{slug}.md`
```

```yaml
# .claude/skills/deploy-check/SKILL.md
---
name: deploy-check
description: 배포 전 체크리스트 실행
allowed-tools: Bash, Read, Glob
user-invocable: true
---

배포 전 다음을 확인한다:
1. `npm run build` 성공 여부
2. TypeScript 타입 에러 없는지
3. 환경변수 누락 여부 (.env.example 대비)
4. 커밋되지 않은 변경사항 존재 여부
```

### 4. Custom Subagents (`.claude/agents/`)

```yaml
# .claude/agents/code-reviewer/agent.md
---
name: code-reviewer
description: 코드 변경사항을 리뷰하고 개선점 제안
tools: Read, Glob, Grep
model: sonnet
maxTurns: 15
---

변경된 파일을 분석하고 다음을 점검한다:
- 보안 취약점 (XSS, injection 등)
- 성능 이슈
- 코드 스타일 일관성
- 에러 핸들링 누락
```

```yaml
# .claude/agents/content-writer/agent.md
---
name: content-writer
description: 블로그 콘텐츠 작성 및 번역
tools: Read, Write, Glob, Grep, WebSearch, WebFetch
model: sonnet
maxTurns: 20
memory: project
---

CLAUDE.md의 톤 & 스타일 가이드를 따른다.
콘텐츠 작성 시 반드시:
- 반말 톤 (toss tech 스타일)
- 코드 예시 포함
- 소스 링크 첨부
```

### 5. MCP 서버 연동

**프로젝트에 적용 가능한 MCP:**

```jsonc
// .mcp.json (프로젝트 루트)
{
  "mcpServers": {
    // GitHub Issues/PR 관리
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    // Vercel 배포 관리 (커스텀)
    "vercel": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vercel/mcp"]
    },
    // 데이터베이스 (해당 시)
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/postgres-mcp"],
      "env": { "DATABASE_URL": "${DATABASE_URL}" }
    }
  }
}
```

### 6. 권한 & 보안 설정

```jsonc
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git *)",
      "Bash(npx astro *)",
      "Read",
      "Write(src/**)",
      "Edit(src/**)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Read(.env)",
      "Read(.env.local)",
      "Write(.env*)"
    ]
  }
}
```

### 7. Git Worktree 활용

**병렬 작업 시:**
```bash
# 기능 개발과 버그 수정을 동시에
claude --worktree feature-auth
claude --worktree fix-build

# subagent에서 격리 실행
# agent.md에 isolation: worktree 추가
```

### 8. 메모리 & 컨텍스트 최적화

**`.claude/rules/` 디렉토리로 모듈화:**
```
.claude/rules/
├── code-style.md      # 코드 스타일 규칙
├── api-conventions.md # API 설계 규칙
├── testing.md         # 테스트 작성 규칙
└── deployment.md      # 배포 관련 규칙
```

**Path-specific rules:**
```yaml
# .claude/rules/frontend.md
---
paths: ["src/components/**", "src/pages/**"]
---
React 컴포넌트는 함수형으로 작성한다.
Props 타입은 interface로 정의한다.
```

### 9. 자동 포맷 Hook

```jsonc
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "type": "command",
        "command": "npx prettier --write $CLAUDE_TOOL_INPUT_FILE 2>/dev/null; exit 0"
      }
    ]
  }
}
```

---

## 적용 체크리스트

프로젝트를 분석한 후 아래를 순서대로 설정한다:

- [ ] **CLAUDE.md** 최적화 (200줄 이하, 구체적 규칙)
- [ ] **`.claude/settings.json`** 생성 (권한 + 기본 Hook)
- [ ] **`.claude/rules/`** 디렉토리 생성 (주제별 규칙 분리)
- [ ] **`.claude/skills/`** 반복 작업용 Skill 생성
- [ ] **`.claude/agents/`** 전문 에이전트 정의
- [ ] **`.mcp.json`** 외부 서비스 MCP 연동
- [ ] **SessionStart hook** 컨텍스트 자동 주입
- [ ] **PostToolUse hook** 린터/포맷터 자동 실행

---

## 사용법

이 파일을 프로젝트 루트의 `.claude/` 디렉토리에 넣고:

```
이 프로젝트를 분석해서 LEARN-CLAUDE-CODE.md의 체크리스트 기반으로
적용 가능한 Claude Code 기능을 설정해줘.
```

또는 특정 기능만:

```
LEARN-CLAUDE-CODE.md의 Hooks 섹션을 참고해서
이 프로젝트에 맞는 Hook을 설정해줘.
```
