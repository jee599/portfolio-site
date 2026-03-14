---
title: "exit 0이면 통과, exit 2면 차단 — Claude Code Hooks로 AI를 길들이는 법"
description: "CLAUDE.md의 지시는 잊힐 수 있다. Hooks는 매번, 확정적으로 실행된다"
date: "2026-03-09"
tags: ["ai", "llm", "productivity", "webdev"]
source: "devto"
---

CLAUDE.md는 강력하지만 컨텍스트 압력(context pressure)에서 지시가 밀릴 수 있다. Hooks는 다르다. LLM에게 부탁하는 게 아니라 실행 레벨에서 차단/강제를 수행한다.

## 핵심

- exit 0: 통과
- exit 2: 차단
- stderr: 차단 사유를 LLM에 피드백
- stdout: 컨텍스트 주입

## 대표 패턴

1. **PreToolUse 위험 명령 차단** (`rm -rf`, `drop table`)
2. **SessionStart(compact) 재주입**: compaction 후 핵심 맥락 복원
3. **PreCompact 백업**: 압축 직전 상태 저장
4. **StatusLine 토큰 모니터링**
5. **PostToolUse 자동 포맷팅**

CLAUDE.md가 가이드라인이라면, Hooks는 가드레일이다.

> “하지 마” 100줄보다 `exit 2` 한 줄이 더 확실하다.

---
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks-reference)
- [Trail of Bits Claude Code Config](https://github.com/trailofbits/claude-code-config)
