---
title: "Harness CI/CD 딥다이브, 씨티은행 2만 명이 배포 시간을 수일에서 7분으로 줄인 플랫폼"
description: "Harness CI/CD는 AI 기반 파이프라인 자동화로 Jenkins 대비 배포 시간을 최대 90% 단축한다. AIDA, Test Intelligence, 자동 롤백까지 실제 기업 사례와 코드로 분석했다."
pubDate: 2026-03-31
category: "AI 기술 분석"
tags: ["Harness", "CI/CD", "DevOps", "AI", "파이프라인자동화"]
heroImage: "https://r2.jidonglab.com/blog/2026/03/harness-cicd-hero.png"
heroImageCaption: "사진 출처: Codefresh / Harness 아키텍처 다이어그램"
heroImageAlt: "Harness CI/CD 플랫폼의 제품 에디션과 아키텍처 구성도"
readingTime: 15
source:
  title: "Harness Official"
  url: "https://www.harness.io/"
  author: "Harness Inc."
---

![Harness CI/CD 플랫폼의 제품 에디션과 아키텍처 구성도](https://r2.jidonglab.com/blog/2026/03/harness-cicd-hero.png)
*사진 출처: Codefresh / Harness 아키텍처 다이어그램*

씨티은행(Citi) 엔지니어 2만 명의 배포 주기는 "주 1회에서 수개월에 1회"였다. 빌드부터 프로덕션까지 수 시간, 길면 며칠이 걸렸다. Harness CD를 도입한 뒤 그 시간이 7분으로 줄었다. 대부분의 개발자가 하루에도 여러 번 프로덕션 배포를 한다.

이건 마케팅 카피가 아니다. 금융권 규제 아래에서 실현된 수치다.

**출처:** [Citi enhances software delivery with Harness CD](https://www.harness.io/case-studies/citi-improves-software-delivery-performance-reduces-toil-with-harness-cd) – Harness

## Jenkins를 버리고 싶은 이유가 생겼다

DevOps 파이프라인 하면 아직도 Jenkins가 먼저 떠오르는 팀이 많다. 2011년에 시작된 오픈소스 프로젝트. 생태계는 넓고, 플러그인은 1,800개가 넘는다. 문제는 그 플러그인들이다. 서로 버전이 안 맞고, 보안 패치가 밀리고, 스케일링하려면 인프라 전문가가 상주해야 한다.

GitHub Actions는 이 고통을 줄여줬다. YAML 파일 하나로 CI를 돌릴 수 있고, GitHub 생태계 안에서는 셋업이 거의 제로에 가깝다. 하지만 GitHub Actions의 한계도 명확하다. GitHub에 종속되고, 복잡한 CD 워크플로우(카나리 배포, 블루/그린, 멀티 클러스터)를 구현하려면 서드파티 액션을 조합하는 수작업이 필요하다. 배포 거버넌스? 자동 롤백? 기본 제공이 아니다.

GitLab CI도 비슷하다. GitLab 생태계 안에서는 훌륭하지만, 멀티 클라우드 환경이나 대규모 엔터프라이즈에서 필요한 정교한 배포 전략은 직접 만들어야 한다.

Harness는 이 지점을 정확히 파고든다. CI/CD를 "도구"가 아니라 "플랫폼"으로 접근한다. 파이프라인 생성부터 배포 검증, 롤백, 비용 관리, 보안 스캐닝까지 하나의 플랫폼에서 처리한다는 컨셉이다.

## Harness가 가진 모듈, 전부 풀어보면

Harness를 단순히 "CI/CD 도구"로 부르면 절반만 맞다. 실제로는 소프트웨어 딜리버리 라이프사이클 전체를 커버하는 모듈형 플랫폼이다.

**Continuous Integration (CI):** 2020년에 오픈소스 CI 프로젝트 [Drone.io](https://www.drone.io/)를 인수하면서 CI 역량을 확보했다. Drone은 DockerHub에서 1억 회 이상 풀된 컨테이너 네이티브 CI였다. Harness CI Cloud는 Linux, Windows, macOS VM을 관리형으로 제공하고, 빌드 캐싱과 Test Intelligence로 빌드 속도를 끌어올린다.

**Continuous Delivery (CD):** Harness의 핵심이자 시작점. 블루/그린, 카나리, 롤링 배포 전략을 기본 제공하고, Kubernetes, ECS, Lambda, Helm, Terraform 등 주요 인프라에 대한 네이티브 커넥터를 갖고 있다. 배포 검증(Continuous Verification)이 파이프라인에 내장돼 있어서, 배포 후 메트릭과 로그를 자동으로 분석하고 이상 징후가 감지되면 자동 롤백한다.

**Feature Flags:** 코드 배포 없이 기능을 켜고 끌 수 있다. Boolean 플래그부터 멀티베리에이트 플래그(A/B 테스트)까지 지원하고, Java, Python, Go, Node.js, React, iOS, Android 등 주요 SDK를 제공한다.

**Cloud Cost Management (CCM):** 클라우드 비용을 실시간으로 모니터링하고, 유휴 리소스를 자동 감지하며, 비용 절감 추천을 제공한다. AI가 자연어로 비용 정책을 생성해준다.

**Security Testing Orchestration (STO):** 파이프라인 안에서 SAST, DAST, SCA, 컨테이너 스캐닝을 통합 실행한다. 취약점을 자동 식별하고 CVE/CWE 데이터베이스와 매칭해서 수정 코드까지 제안한다.

**Internal Developer Portal (IDP):** Backstage 기반의 개발자 포털. 서비스 카탈로그, 문서, 스코어카드를 한곳에서 관리한다.

이 모듈들이 개별 SaaS가 아니라 하나의 플랫폼 위에 올라가 있다는 게 핵심이다. CI에서 빌드한 아티팩트를 CD가 배포하고, Feature Flag로 트래픽을 조절하고, CCM이 비용을 추적하는 흐름이 끊기지 않는다.

## AIDA가 바꾸는 DevOps의 일하는 방식

2023년 Harness는 AIDA(AI Development Assistant)를 발표했다. DevOps에 LLM을 접목한 것인데, 단순 챗봇이 아니라 플랫폼 전체에 AI가 스며들어 있는 구조다.

파이프라인 생성이 대표적이다. "Node.js 앱을 빌드해서 AWS EKS에 카나리 배포해줘"라고 자연어로 말하면 AIDA가 파이프라인 YAML을 자동 생성한다. 스텝, 스테이지, 실패 전략, 조건부 실행까지 포함해서. 기존에는 Harness YAML 스펙을 외우거나 문서를 뒤져야 했던 작업이 몇 초로 줄어든다.

빌드 실패 분석도 AIDA의 영역이다. CI 파이프라인이 실패하면 로그 파일을 분석하고, 에러 메시지를 알려진 이슈와 대조해서 원인과 수정 방법을 제안한다. "빌드가 왜 깨졌지?" → 로그 열기 → 스택오버플로우 검색 → 수정 시도의 루프가 AIDA 한 번 호출로 대체된다.

보안 취약점 처리에서도 차이가 크다. AIDA는 공개된 모든 CVE/CWE 데이터로 학습돼 있어서, 취약점을 식별하면 수정 코드까지 생성한다. Harness 측 발표에 따르면 취약점 해결에 드는 개발자 노력을 50~75% 줄인다.

클라우드 비용 정책도 자연어로 만든다. "매일 밤 10시에 dev 환경 인스턴스를 중지해줘" 같은 문장을 OPA Rego 정책으로 변환한다. 이전에는 Rego 문법을 알아야만 가능했던 작업이다.

AIDA는 별도 설치가 필요 없다. Harness UI에 내장돼 있고, 모든 고객에게 무료로 제공된다. CI, CD, CCM, Feature Flags 전 모듈에서 동작한다.

## Test Intelligence가 5시간 테스트를 분 단위로 줄인 방법

CI 파이프라인에서 가장 시간을 잡아먹는 건 테스트다. PR 하나 올릴 때마다 전체 테스트를 돌리는 팀이 많은데, Harness는 이걸 "바꾼 코드에 영향받는 테스트만 골라서 돌리는" 방식으로 해결했다.

Harness 내부 "Portal" 백엔드 리포지토리의 실측 데이터가 있다. PR마다 약 16,300개의 유닛 테스트가 실행됐고, 전체를 돌리면 약 5시간이 걸렸다. 병렬 실행(5개 동시)을 적용하니 60분으로 줄었다. 여기서 Test Intelligence를 켰더니 변경된 코드에 영향받는 테스트만 선별 실행해서 시간이 분 단위로 떨어졌다.

원리는 이렇다. Test Intelligence는 Git diff를 분석해서 어떤 코드가 바뀌었는지 파악하고, "Test Graph"라는 내부 의존성 맵을 통해 해당 변경에 영향받는 테스트만 선택한다. 테스트를 건너뛴 게 아니라, 실행할 필요가 없는 테스트를 정확하게 식별하는 거다.

Build Intelligence도 있다. 빌드 아티팩트 캐싱을 통해 변경되지 않은 빌드 출력물을 재사용한다. 빌드 시간을 30~40% 추가로 단축한다고 Harness는 밝히고 있다.

Jenkins에서 이 수준의 테스트 선별을 구현하려면 커스텀 플러그인을 직접 만들거나, 외부 도구를 연동하는 수작업이 필요하다. GitHub Actions에서도 마찬가지다. Harness는 이걸 파이프라인 스텝 하나로 제공한다.

## 파이프라인 YAML, 실제로 어떻게 생겼나

Harness 파이프라인은 YAML로 정의한다. Visual Editor에서 드래그앤드롭으로 만들 수도 있지만, 코드로 관리하는 게 GitOps와 맞다. 기본 구조를 보자.

```yaml
pipeline:
  name: Build and Deploy
  identifier: build_and_deploy
  stages:
    - stage:
        name: Build
        type: CI
        spec:
          execution:
            steps:
              - step:
                  type: Run
                  name: Run Tests
                  spec:
                    command: npm test
              - step:
                  type: BuildAndPushDockerRegistry
                  name: Push to Docker Hub
                  spec:
                    connectorRef: dockerhub
                    repo: myapp
                    tags:
                      - <+pipeline.sequenceId>
    - stage:
        name: Deploy to Production
        type: Deployment
        spec:
          deploymentType: Kubernetes
          service:
            serviceRef: myapp_service
          environment:
            environmentRef: prod
            infrastructureDefinitions:
              - identifier: k8s_prod
          execution:
            steps:
              - step:
                  type: K8sCanaryDeploy
                  name: Canary Deploy
                  spec:
                    instanceSelection:
                      type: Count
                      spec:
                        count: 1
              - step:
                  type: Verify
                  name: Verify Canary
                  spec:
                    type: Canary
                    monitoredService:
                      type: Default
                    spec:
                      duration: 10m
              - step:
                  type: K8sCanaryDelete
                  name: Canary Cleanup
              - step:
                  type: K8sRollingDeploy
                  name: Rolling Deploy
```

CI 스테이지에서 테스트를 실행하고 Docker 이미지를 빌드해서 레지스트리에 푸시한다. CD 스테이지에서는 카나리 배포로 인스턴스 1개에 먼저 배포하고, 10분간 모니터링한 뒤 문제가 없으면 롤링 배포로 전체에 적용한다. `Verify` 스텝이 핵심인데, 배포 후 메트릭을 자동으로 분석해서 이상 징후가 감지되면 자동 롤백한다.

Jenkins에서 같은 워크플로우를 구현하려면 Jenkinsfile에 카나리 배포 로직을 직접 스크립팅하고, Prometheus/Datadog 연동 코드를 쓰고, 롤백 조건 판단 로직을 if-else로 구현해야 한다. GitHub Actions에서는 더 복잡하다. 카나리 배포 자체가 네이티브 기능이 아니니까.

Feature Flag SDK 통합도 간단하다. Java 예시를 보면:

```java
// Harness Feature Flag SDK 초기화
CfClient cfClient = new CfClient(apiKey);
cfClient.initialize();

// 플래그 평가
Target target = Target.builder()
    .identifier("user-123")
    .name("John")
    .build();

boolean enabled = cfClient.boolVariation(
    "new_checkout_flow", target, false
);

if (enabled) {
    renderNewCheckout();
} else {
    renderLegacyCheckout();
}
```

LaunchDarkly 같은 전용 Feature Flag 서비스와 비교하면 기능 깊이는 다소 얕을 수 있다. 하지만 CI/CD 파이프라인과 같은 플랫폼에서 동작한다는 게 핵심이다. 배포 → 플래그 활성화 → 메트릭 모니터링 → 롤백이 하나의 파이프라인 안에서 연결된다.

## 실제 기업들이 어떤 수치를 만들어냈나

씨티은행 말고도 구체적 수치가 공개된 사례가 여럿 있다.

**Ulta Beauty** — 미국 최대 뷰티 리테일러. 디지털 스토어 플랫폼을 구축하면서 Harness CD를 도입했고, 배포 볼륨이 50배 증가했다. CI/CD 유지보수 비용으로 120만 달러(약 16억 원)를 절감했다. 기존 배포 시스템을 처음부터 다시 작성하는 대신 Harness를 선택한 결과다.

**Sensormatic (Johnson Controls)** — 코딩 위생(coding hygiene)이 60% 개선됐고, 테스트 자동화로 테스트 시간을 30% 단축했다. Harness Software Engineering Insights를 통해 개발자 생산성을 정량적으로 측정하고 개선한 사례다.

**Vivun** — DevOps 엔지니어 효율이 300% 향상됐다. 한 명이 하던 일을 같은 시간에 세 배 더 처리할 수 있게 됐다는 뜻이다.

**Vuclip** — 클라우드 마이그레이션과 CD 프로젝트를 4개월 앞당겼고, 엔지니어링 시간 절감으로 연간 약 20만 달러(약 2.7억 원)를 아꼈다.

공통점이 보인다. 단순히 "배포가 빨라졌다"가 아니라, 엔지니어링 시간과 비용이 정량적으로 줄었다는 것. DevOps 도구의 ROI를 숫자로 증명하기 어려운 경우가 많은데, Harness는 이 지점을 의식적으로 강조하고 있다.

## Jenkins, GitHub Actions, GitLab CI와 솔직한 비교

경쟁 도구와 비교할 때 가장 자주 나오는 질문은 "그래서 뭐가 다른데?"다. 핵심 차이를 정리한다.

**Jenkins vs Harness** — Jenkins는 자유도가 높지만 그만큼 직접 구축해야 할 게 많다. 플러그인 의존성 관리, 스케일링, 보안 패치가 전부 운영팀 몫이다. Harness는 SaaS로 이 부담을 없앤다. 대신 Jenkins의 1,800개 플러그인 생태계만큼의 유연성은 포기해야 한다. Jenkins가 "직접 조립하는 PC"라면 Harness는 "기업용 완제품"에 가깝다.

**GitHub Actions vs Harness** — GitHub Actions는 CI에 강하고, GitHub 생태계 안에서는 최고의 경험을 제공한다. 하지만 GitHub에 종속된다. Bitbucket이나 GitLab을 쓰는 팀은 옵션이 안 된다. 복잡한 CD 워크플로우(카나리, 블루/그린, 자동 롤백)는 기본 제공이 아니다. Harness는 멀티 SCM을 지원하고, CD 전략과 거버넌스가 1급 기능이다. 반면 GitHub Actions의 마켓플레이스 생태계(수만 개 액션)는 Harness가 따라가기 어렵다.

**GitLab CI vs Harness** — GitLab CI는 DevSecOps 통합이 장점이다. 소스 코드부터 CI/CD, 보안 스캐닝, 이슈 트래킹까지 하나의 플랫폼에서 제공한다. Harness와 컨셉이 비슷해 보이지만, GitLab CI는 GitLab 생태계 안에서만 최적이고, Harness는 어떤 Git 프로바이더와도 연동된다. 배포 전략의 정교함(카나리 검증, 자동 롤백)에서는 Harness가 앞서고, 가격 면에서는 GitLab이 더 접근성 좋다.

결론적으로, 소규모 팀이나 GitHub 중심 워크플로우에는 GitHub Actions가 가성비 최고다. Jenkins 레거시를 운영 중인 대규모 팀은 Harness 마이그레이션으로 운영 부담을 크게 줄일 수 있다. GitLab 올인 팀은 GitLab CI가 자연스럽다. Harness의 진짜 강점은 "멀티 클라우드 + 대규모 + 정교한 배포 전략 + AI 자동화"가 동시에 필요한 엔터프라이즈다.

## 가격, 무료 플랜으로 어디까지 가능한가

Harness는 Free, Startup, Enterprise 세 가지 플랜을 제공한다.

**Free 플랜**은 개발자 5명까지, 월 2,000 Cloud Credits를 제공한다. CI, CD, Feature Flags, CCM 전 모듈을 사용할 수 있고, AIDA도 포함된다. 사이드 프로젝트나 소규모 스타트업이 Harness를 경험하기에 충분한 수준이다.

**Startup 플랜**은 개발자 1인당 월 $57. 직원 500명 미만이거나 클라우드 비용이 500만 달러 미만인 기업만 자격이 된다. 최대 100명까지 라이선스 구매 가능. 스타트업 규모에서는 합리적이지만, 5인 팀 기준 월 $285(약 38만 원)이니 GitHub Actions 무료 플랜 대비 확실한 가치를 느껴야 지갑을 열게 된다.

**Enterprise 플랜**은 커스텀 가격. 세일즈 미팅이 필요하다. 무제한 개발자, 고급 보안, 정책 기반 거버넌스, 커스텀 대시보드 등이 포함된다.

솔직히, 가격은 Harness의 가장 큰 진입 장벽이다. Jenkins는 무료 오픈소스고, GitHub Actions는 퍼블릭 레포에서 무료고, GitLab CI도 무료 티어가 넉넉하다. Harness의 Free 플랜은 5명 제한이 있어서, 10~20명 규모 팀은 바로 유료로 넘어가야 한다.

## 솔직하게, Harness의 약점

장점만 나열하면 마케팅 글이 된다. 실제 사용자 리뷰와 제3자 분석에서 반복적으로 나오는 약점이 있다.

**학습 곡선이 가파르다.** 모듈이 많고 개념도 많다. 파이프라인, 스테이지, 스텝, 커넥터, 델리게이트, 서비스, 환경, 인프라 정의 — 처음 접하는 개발자에게는 진입 장벽이 높다. 다른 CD 도구에 익숙한 엔지니어도 Harness만의 추상화 레이어에 적응하는 데 시간이 걸린다는 리뷰가 많다.

**UI가 직관적이지 않다는 평가가 있다.** 배포 그래프가 화면 밖으로 넘어가고, 핵심 파라미터가 여러 레이어에 숨어있어 찾기 어렵다는 피드백이 G2, Capterra 리뷰에서 반복된다.

**완전한 GitOps를 지원하지 않는다.** Harness CD는 파이프라인 트리거 방식의 배포에는 강하지만, ArgoCD 같은 선언적 GitOps의 핵심인 "Reconciliation Loop"(현재 상태와 원하는 상태를 지속적으로 비교하고 동기화하는 루프)가 없다. GitOps를 풀로 구현하려는 팀에게는 아쉬운 점이다.

**커스터마이징에 한계가 있다.** 독자적인 배포 전략이나 특수한 인프라 요구사항이 있는 팀은 Harness의 추상화 레이어가 오히려 제약이 될 수 있다. 빌드 도구 커스터마이징도 자유도가 높지 않다.

**문서가 복잡한 설정에서 부족하다.** 기본 설정은 문서가 잘 되어있지만, 엣지 케이스나 고급 설정에 대한 문서가 부족하다는 평가가 있다.

이런 약점에도 불구하고, Harness를 선택하는 팀의 공통점이 있다. "DevOps 전문 인력 없이도 안정적인 배포 파이프라인을 운영하고 싶은" 엔터프라이즈다. Jenkins를 운영할 DevOps 엔지니어 3명을 고용하는 비용과 Harness 라이선스 비용을 비교하면, 규모가 클수록 Harness 쪽이 유리해진다.

## Harness가 의미하는 것

DevOps 도구 시장은 "도구"에서 "플랫폼"으로 이동하고 있다. Jenkins, CircleCI, Travis CI 같은 단일 목적 도구를 조합하던 시대에서, Harness나 GitLab처럼 전체 라이프사이클을 하나의 플랫폼으로 통합하는 흐름이다.

Harness가 여기에 AI를 얹은 건 시기적으로 정확했다. AIDA가 파이프라인을 자동 생성하고, Test Intelligence가 테스트를 선별하고, Continuous Verification이 배포를 자동 검증하는 구조는 — DevOps 엔지니어의 반복 작업을 AI가 대체하는 첫 번째 실용적 사례 중 하나다.

> 씨티은행 2만 명이 "수일"에서 "7분"으로 간 건 도구 하나 바꿔서가 아니다. 배포라는 행위 자체를 플랫폼이 자동화한 결과다.

---
- [Harness 공식 사이트](https://www.harness.io/)
- [Harness Developer Hub (공식 문서)](https://developer.harness.io/)
- [Citi 케이스 스터디](https://www.harness.io/case-studies/citi-improves-software-delivery-performance-reduces-toil-with-harness-cd)
- [AIDA 개요](https://developer.harness.io/docs/platform/harness-aida/aida-overview)
- [Harness GitHub (오픈소스)](https://github.com/harness/harness)
