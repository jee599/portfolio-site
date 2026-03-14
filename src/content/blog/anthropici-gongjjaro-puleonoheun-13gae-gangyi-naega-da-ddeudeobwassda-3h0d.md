---
title: "Anthropic이 공짜로 풀어놓은 13개 강의, 내가 다 뜯어봤다"
description: "무료, 수료증 발급, 로그인만 하면 끝. 근데 진짜 쓸 만한 건 5개다."
date: "2026-03-03"
tags: ["ai", "productivity", "claude", "beginners"]
source: "devto"
---

Anthropic이 Skilljar라는 플랫폼에 강의 13개를 올려놨다. 전부 무료. 수료증도 준다. Anthropic 계정도 필요 없고, 이메일로 Skilljar 가입만 하면 바로 들을 수 있다.

근데 13개를 전부 들을 시간은 없다. 나도 없었다. 그래서 커리큘럼을 전부 뜯어보고, 공개된 요약, 노트, 리뷰까지 다 긁어서 정리했다.

결론부터 말하면, 진짜 개발자한테 의미 있는 건 5개다. 나머지는 교육자/학생/비영리용이라 스킵해도 된다.

## 들어야 하는 5개

### Claude Code in Action
21 레슨, 약 1시간. Claude Code를 터미널에서 쓰는 사람이라면 1순위다.

CLAUDE.md로 세션 간 기억을 유지하는 법, Custom Command로 반복 작업을 슬래시 명령으로 만드는 법, Hook으로 파일 수정 후 자동 포맷팅을 거는 법, MCP 서버로 GitHub이나 DB를 연결하는 법, SDK로 Claude Code 기능을 내 도구에 임베딩하는 법까지 전부 다룬다.

이 강의 하나로 Claude Code 활용도가 확 달라진다.

### Building with the Claude API
16 레슨, 가장 방대하다.

API 기초부터 시작해서 프롬프트 평가(Eval), Tool Use, RAG 파이프라인, Extended Thinking, Prompt Caching, MCP, Agent/Workflow 패턴까지 전체 스펙트럼을 커버한다.

AI로 뭔가 서비스를 만들려는 사람한테는 이 강의가 바이블이다.

### Introduction to Agent Skills
신규 강의.

Claude Code에서 재사용 가능한 Skill(마크다운 기반 지시문)을 만들고 배포하는 방법을 다룬다. Skill을 잘 만들어두면 Claude가 알아서 적절한 작업에 적용한다. 팀 단위 배포와 트러블슈팅도 포함.

### Introduction to Model Context Protocol
8 레슨.

Python으로 MCP 서버와 클라이언트를 처음부터 만든다. Tools, Resources, Prompts라는 3가지 프리미티브를 배우고, MCP Inspector로 테스트하는 법까지.

AI 모델에 외부 서비스를 연결하는 표준이 MCP인데, 이걸 제대로 이해하면 할 수 있는 게 확 넓어진다.

### Model Context Protocol: Advanced Topics
8 레슨.

MCP 입문 다음 단계다. Sampling(서버가 AI에게 역으로 요청), Notifications(비동기 알림), Transport 메커니즘(stdio, SSE, Streamable HTTP) 같은 프로덕션 배포에 필요한 심화 내용을 다룬다.

## 나머지 8개는?

**Claude 101**은 Claude 기본 기능 설명이라 이미 쓰고 있는 사람한테는 새로운 게 별로 없다.

**AI Fluency: Framework & Foundations**는 4D 모델이라는 사고 프레임워크를 다루는데, 이론 쪽이라 실전파한테는 가볍게 훑는 정도로 충분하다.

**Claude with Amazon Bedrock**과 **Claude with Google Vertex AI**는 각각 16 레슨짜리인데, Building with Claude API와 내용의 70%가 겹친다. 차이는 모든 예제가 AWS SDK(boto3) 또는 GCP SDK를 쓴다는 것. 특정 클라우드에 배포할 계획이 있으면 그때 들으면 된다.

AI Fluency for Educators, for Students, for Nonprofits, Teaching AI Fluency — 이 4개는 교육자, 학생, 비영리단체를 위한 과정이다. Ringling College, University College Cork 교수들과 공동 개발했고 Creative Commons 라이선스라 교육기관에서 자유롭게 쓸 수 있다. 개발자한테는 해당 없다.

## 내가 추천하는 순서

첫째 주에 Claude Code in Action과 Introduction to Agent Skills를 끝낸다. 둘 다 짧다.

둘째 주에 Building with the Claude API를 듣는다. 이건 방대해서 2~3일은 잡아야 한다.

셋째 주에 MCP 입문과 심화를 연달아 듣는다.

이 5개를 끝내면 Claude 생태계의 핵심을 거의 다 커버하게 된다. 전부 합쳐도 10시간이 안 된다.

참고로, Skilljar 강의 외에 Anthropic GitHub에 Jupyter Notebook 기반 실습 과정도 무료로 있다. API Fundamentals, Prompt Engineering Tutorial, Real World Prompting, Prompt Evaluations, Tool Use까지 5개.

영상보다 코드를 직접 돌리면서 배우고 싶으면 이쪽이 더 맞다.

> 13개 중 5개. 나머지는 당장 안 들어도 된다. 시간은 유한하다.

[jidonglab.com](https://jidonglab.com)
