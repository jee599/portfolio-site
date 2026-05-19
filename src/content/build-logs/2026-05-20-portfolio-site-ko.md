---
title: "Pretendard 7개 페이지 일괄 적용: 중단된 세션을 이어받아 25번 만에 끝낸 법"
project: "portfolio-site"
date: 2026-05-20
lang: ko
tags: [claude-code, typography, font, daymoon, pretendard, session-continuation]
description: "Claude Code 세션이 중단된 후 이어받아 완성하는 패턴. Daymoon 사진작가 사이트 폰트를 Pretendard로 전환, 7개 HTML 페이지에 25번의 tool call로 일괄 적용했다."
---

## 세션이 중단됐다, 그리고 이어받았다

Claude Code로 작업하다 보면 세션이 중간에 끊기는 경우가 생긴다. `styles.css`만 바꾸고 멈춘 세션을 다음 세션이 이어받아 완성하는 패턴 — 오늘 기록할 내용이다.

**TL;DR** Daymoon 사진작가 사이트 폰트 전환 작업. 세션 1에서 CSS만 바꾸고 중단됐고, 세션 2에서 7개 HTML 페이지 전체에 Pretendard를 추가해 마무리했다. 총 48번의 tool call.

---

## 폰트 방향 선택: Quiet Minimal

작업 시작 전 사용자가 스케치에서 폰트 방향을 선택했다. 선택지 B, "Quiet Minimal" 방향.

- 영문/브랜드/내비게이션: `Outfit`
- 한국어 본문: `Pretendard` (또는 Noto Sans KR 스타일)

하드룰이 명확했다. serif 폰트(`Cormorant`, `EB Garamond` 등) 금지. 마케팅 카피 추가 금지. 사진이 주인공인 사이트 스타일을 건드리지 않는다.

이 컨텍스트가 프롬프트에 그대로 들어갔다:

```
Hard rules:
- Follow existing Daymoon style: photo-first, minimal, white/near-white
- Do NOT add serif fonts.
- Do NOT use Cormorant/EB Garamond/Ci...
```

명확한 금지 목록이 있으면 Claude가 "더 예쁜" 방향으로 탈선하지 않는다.

---

## 세션 3: CSS는 바꿨지만 멈췄다

첫 세션(23번 tool call, `Bash 14 / Read 5 / Edit 4`)은 레포 구조 파악부터 시작했다. `styles.css`를 수정해 폰트 스택을 업데이트했고, 거기서 세션이 끊겼다.

문제는 CSS만 바꿔도 HTML 파일들이 실제로 Pretendard를 로드하지 않으면 적용이 안 된다는 점이다. 7개 HTML 파일 각각의 `<head>`에 웹폰트 로드 태그가 있었고, 그걸 손대기 전에 세션이 종료됐다.

---

## 세션 4: 이어받기 프롬프트

두 번째 세션 프롬프트가 핵심이다:

```
Continue the Daymoon typography update. The previous run changed styles.css
but stopped before completing.

Finish the task in /Users/jidong/daymoon-pic-site:
1. Ensure Pretendard actually loads on all real site pages...
```

"이전 세션이 여기까지 했고, 이걸 마저 해라"는 구조. Claude Code는 이전 세션의 메모리가 없다. 그래서 프롬프트에 현재 상태(`styles.css`는 완료)와 남은 작업(HTML 7개)을 명시해야 한다.

세션 4는 25번 tool call(`Edit 13 / Read 7 / Bash 4 / Grep 1`)로 마무리됐다.

---

## 7개 파일이 동일한 패턴이었다

Claude가 먼저 확인한 건 패턴의 일치 여부다.

> All 7 real pages share identical font-loading lines.

`index.html`, `about.html`, `contact.html`, `gallery.html`, `notice.html`, `product.html`, `reservation.html` — 헤드 섹션이 동일한 구조였다. 이 확인이 중요했다. 하나만 읽고 패턴을 파악하면 나머지 6개는 같은 수술을 반복하면 된다.

적용 방식은 jsDelivr CDN의 Pretendard Variable 동적 서브셋:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css">
```

기존 `Outfit` + `Noto Sans KR`은 그대로 유지하고, Pretendard를 추가하는 방식으로 안전하게 처리했다. 캐시 버스트 버전도 올렸다.

---

## 의료광고 리뷰도 있었다

같은 날 세션 1~2는 다른 프로젝트였다. 치과 광고 일일 리포트 블로킹 이슈 리뷰(`dentalad` 프로젝트).

- 세션 1: `2026-05-19-daily-update.md:27`에서 날짜 귀속 오류 발견. 5/14 공지에 플레이스광고 노출 개수 상향을 잘못 귀속시킨 케이스. 실제로는 5/07 공지였다.
- 세션 2: 수정 후 재검수. OK.

4번의 `Read` tool call, 결과는 블로킹 이슈 1건 발견 후 수정, 재확인 클리어. 짧지만 명확한 파이프라인이다.

---

## 전체 통계

| 항목 | 수치 |
|------|------|
| 총 세션 | 4 |
| 총 tool calls | 52 |
| Edit | 17 |
| Bash | 18 |
| Read | 16 |
| Grep | 1 |
| 수정 파일 | 8개 |
| 생성 파일 | 0개 |

Bash가 Edit보다 많은 건 세션 3에서 레포 구조 탐색과 git 작업이 많았기 때문이다.

---

## 세션 이어받기의 핵심

세션이 중단됐을 때 두 번째 세션을 효율적으로 쓰는 방법:

1. **현재 상태를 명시한다.** "이전 세션이 X까지 했다"를 프롬프트에 쓴다.
2. **남은 작업을 구체적으로 나열한다.** "HTML 7개 파일 헤드에 폰트 로드 추가"처럼.
3. **하드룰을 반복한다.** 새 세션은 이전 컨텍스트가 없다. 금지 사항을 다시 명시한다.

이 패턴을 쓰면 중단된 작업도 낭비 없이 마무리된다.
