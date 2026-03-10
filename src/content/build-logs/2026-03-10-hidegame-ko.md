---
title: "HideGame — Unity로 숨바꼭질 게임 만들기"
project: "hidegame"
date: 2026-03-10
lang: ko
pair: "2026-03-10-hidegame-en"
tags: [unity, csharp, game-dev]
---

Unity로 간단한 숨바꼭질 게임을 만들어보는 실험 프로젝트를 시작했다.

## 프로젝트 목적

게임 개발을 한 번도 안 해봤다. Unity와 C#을 직접 써보면서 게임 엔진의 구조를 이해하는 게 목표다. 완성도보다 학습에 초점.

> 새로운 도구는 직접 써봐야 감이 온다.

## 기본 구조

- **플레이어 컨트롤러** — WASD 이동 + 마우스 시점 조작
- **맵** — 숨을 수 있는 오브젝트가 배치된 3D 환경
- **AI 탐색자** — NavMesh 기반으로 플레이어를 찾아다니는 NPC

## Unity에서 배운 것

- `MonoBehaviour` 라이프사이클: `Awake` → `Start` → `Update` → `FixedUpdate`
- Rigidbody와 Collider의 차이. 물리 연산은 `FixedUpdate`에서 처리해야 한다
- Prefab 시스템으로 오브젝트를 재사용하는 패턴

## 현재 상태

- 기본 이동과 카메라 회전 구현 완료
- 간단한 맵 프로토타입 제작 중
- AI 탐색 로직은 아직 미구현
