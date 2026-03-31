---
title: "Harness CI/CD Deep Dive: How Citi Cut Deployment Time from Days to 7 Minutes"
published: true
description: "Harness CI/CD uses AI-powered pipeline automation to cut deployment time by up to 90% vs Jenkins. A deep dive into AIDA, Test Intelligence, auto-rollback, real enterprise case studies, and code examples."
tags: devops, cicd, harness, ai
canonical_url: https://jidonglab.com/blog/harness-cicd-deep-dive-ko
---

Citi had 20,000 engineers deploying code anywhere from once a week to once every several months. The process from build to production took hours, sometimes days. After adopting Harness CD, that number dropped to 7 minutes. Most developers now deploy to production multiple times a day.

This isn't marketing copy. These numbers came out of a heavily regulated financial institution.

**Source:** [Citi enhances software delivery with Harness CD](https://www.harness.io/case-studies/citi-improves-software-delivery-performance-reduces-toil-with-harness-cd) – Harness

## The pain Jenkins can't fix anymore

Jenkins still dominates CI/CD mindshare. It launched in 2011, it's open source, and its 1,800+ plugin ecosystem covers almost anything. But that ecosystem is also its weakness. Plugin version conflicts, lagging security patches, and the constant need for infra expertise to keep things running — these costs are invisible until they aren't.

GitHub Actions dramatically lowered the barrier. One YAML file, zero infrastructure management, native GitHub integration. But GitHub Actions is GitHub-only. If your team uses Bitbucket or GitLab, you're either building workarounds or switching tools. Complex CD workflows — canary deployments, blue/green, multi-cluster rollouts — require stitching together third-party actions. Built-in deployment governance? Auto-rollback? Not there.

GitLab CI is solid within the GitLab ecosystem, but multi-cloud enterprise deployments with sophisticated deployment strategies still require custom work.

Harness attacks this exact gap. Instead of treating CI/CD as a "tool," it approaches it as a "platform" — pipeline creation, deployment verification, rollback, cost management, and security scanning all live under one roof.

## What Harness actually ships

Calling Harness "a CI/CD tool" only tells half the story. It's a modular platform covering the entire software delivery lifecycle.

**Continuous Integration** — Harness acquired [Drone.io](https://www.drone.io/) in 2020, a container-native CI with 100M+ DockerHub pulls and 50,000+ active users. Harness CI Cloud provides managed Linux, Windows, and macOS VMs with build caching and Test Intelligence to accelerate builds.

**Continuous Delivery** — The core module. Blue/green, canary, and rolling deployment strategies out of the box. Native connectors for Kubernetes, ECS, Lambda, Helm, and Terraform. Continuous Verification is built into the pipeline — it automatically analyzes post-deployment metrics and logs, triggering auto-rollback when anomalies are detected.

**Feature Flags** — Toggle features without deploying code. Boolean and multivariate flags (for A/B testing), with SDKs for Java, Python, Go, Node.js, React, iOS, Android, and more.

**Cloud Cost Management** — Real-time cloud cost monitoring, idle resource detection, and cost-saving recommendations. AI generates cost policies from natural language.

**Security Testing Orchestration** — Integrates SAST, DAST, SCA, and container scanning directly into pipelines. Auto-identifies vulnerabilities against CVE/CWE databases and suggests code fixes.

**Internal Developer Portal** — Backstage-based service catalog, docs, and scorecards in one place.

The key insight: these aren't separate SaaS products bolted together. They share one platform. The artifact CI builds flows into CD, which deploys behind a feature flag, while CCM tracks the cost. No context-switching between tools.

## AIDA: AI that actually lives inside your pipeline

In 2023, Harness launched AIDA (AI Development Assistant). It's not a chatbot bolted onto the side — it's woven into every module.

Pipeline creation is the clearest win. Tell AIDA "Build a Node.js app and canary-deploy it to AWS EKS" and it generates the full pipeline YAML — steps, stages, failure strategies, conditional executions included. What used to require memorizing the Harness YAML spec or digging through docs now takes seconds.

Build failure analysis is another strong use case. When a CI pipeline fails, AIDA analyzes log files, correlates error messages with known issues, and suggests fixes — sometimes before developers even look at the logs. The "build failed → open logs → search Stack Overflow → try a fix" loop gets replaced by a single AIDA call.

For security, AIDA is trained on all publicly known CVEs and CWEs. It identifies vulnerabilities and generates fix code, reducing developer remediation effort by 50–75% according to Harness.

Cloud cost policies become natural language too. "Stop all dev instances at 10 PM every night" gets converted to an OPA Rego policy. Previously, you needed Rego syntax knowledge.

AIDA requires no separate installation — it's built into the Harness UI and available free to all customers across CI, CD, CCM, and Feature Flags.

## Test Intelligence turned a 5-hour test suite into minutes

The biggest time sink in CI pipelines is testing. Most teams run the entire test suite on every PR. Harness solved this by running only the tests affected by the changed code.

Real data from Harness's own "Portal" backend repo: ~16,300 unit tests ran on every PR, taking about 5 hours. Parallelization (5 concurrent jobs) brought it down to ~60 minutes. Test Intelligence brought it down to minutes by selecting only tests affected by the code diff.

The mechanism: Test Intelligence analyzes the Git diff, then uses an internal dependency map called the "Test Graph" to identify which tests are actually impacted. It's not skipping tests — it's precisely identifying which ones don't need to run.

Build Intelligence adds another layer: build artifact caching reuses unchanged build outputs, cutting build time by an additional 30–40%.

Achieving this level of test selection in Jenkins requires building custom plugins or integrating external tools. GitHub Actions doesn't have anything equivalent built in. Harness makes it a single pipeline step.

## What a real pipeline looks like

Harness pipelines are defined in YAML. There's also a visual drag-and-drop editor, but YAML is the GitOps-friendly way. Here's a CI → CD pipeline with canary deployment and auto-verification:

```yaml
pipeline:
  name: Build and Deploy
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
          execution:
            steps:
              - step:
                  type: K8sCanaryDeploy
                  name: Canary Deploy
              - step:
                  type: Verify
                  name: Verify Canary
                  spec:
                    type: Canary
                    spec:
                      duration: 10m
              - step:
                  type: K8sRollingDeploy
                  name: Rolling Deploy
```

The CI stage runs tests and pushes a Docker image. The CD stage canary-deploys to one instance, monitors for 10 minutes via the `Verify` step, then rolls out to all instances. If the verification detects anomalies, it auto-rolls back. No custom scripting required.

In Jenkins, building the same workflow means scripting canary logic in a Jenkinsfile, writing Prometheus/Datadog integration code, and implementing rollback conditions with if-else blocks. In GitHub Actions, it's even harder — canary deployment isn't a native feature.

## Real numbers from real companies

Beyond Citi, several enterprises have published concrete results.

**Ulta Beauty** — the largest U.S. beauty retailer — adopted Harness CD while building their digital store platform. Deployment volume increased 50x. They saved $1.2M in CI/CD maintenance costs by choosing Harness instead of rewriting their deployment system from scratch.

**Sensormatic (Johnson Controls)** — improved coding hygiene by 60% and cut testing time by 30% through test automation with Harness Software Engineering Insights.

**Vivun** — achieved a 300% improvement in DevOps engineer efficiency. One engineer doing the work of three.

**Vuclip** — accelerated their cloud migration and CD project by 4 months, saving approximately $200K annually in engineering time.

The common thread: these aren't vague "we shipped faster" claims. They're quantified reductions in engineering time and cost.

## Honest comparison: Jenkins, GitHub Actions, GitLab CI

**Jenkins vs Harness** — Jenkins gives you maximum flexibility but demands you build and maintain everything yourself. Plugin dependency management, scaling, security patches — all on your ops team. Harness eliminates this as a SaaS platform, but you trade away some of Jenkins's 1,800-plugin flexibility. Jenkins is a custom-built PC. Harness is an enterprise appliance.

**GitHub Actions vs Harness** — GitHub Actions is excellent for CI and unbeatable within the GitHub ecosystem. But it's GitHub-only. Complex CD workflows (canary, blue/green, auto-rollback) aren't built in. Harness supports multi-SCM and treats CD strategies and governance as first-class features. On the flip side, GitHub Actions' marketplace (tens of thousands of actions) is an ecosystem Harness can't match.

**GitLab CI vs Harness** — GitLab CI's strength is DevSecOps integration — source code, CI/CD, security scanning, and issue tracking in one platform. Similar concept to Harness, but GitLab CI is optimized within the GitLab ecosystem. Harness works with any Git provider. Harness leads in deployment strategy sophistication (canary verification, auto-rollback). GitLab wins on pricing accessibility.

For small teams or GitHub-centric workflows, GitHub Actions offers the best value. For large teams stuck on Jenkins, migrating to Harness can dramatically reduce operational burden. For teams all-in on GitLab, GitLab CI is the natural choice. Harness's real sweet spot is enterprises that need multi-cloud, large-scale, sophisticated deployment strategies, and AI automation simultaneously.

## Pricing: what the free tier actually gets you

Harness offers Free, Startup, and Enterprise plans.

The **Free plan** supports up to 5 developers with 2,000 Cloud Credits per month. All modules are available, including AIDA. Enough to evaluate Harness for side projects or small startups.

The **Startup plan** costs $57 per developer per month. Your company must have fewer than 500 employees and can purchase up to 100 licenses. For a 5-person team, that's $285/month — reasonable, but GitHub Actions' free tier sets a high bar for perceived value.

The **Enterprise plan** uses custom pricing and requires a sales conversation. Unlimited developers, advanced security, policy-based governance, and custom dashboards.

Pricing is Harness's biggest adoption barrier. Jenkins is free. GitHub Actions is free for public repos. GitLab CI has a generous free tier. Once you pass the 5-developer limit on Harness's free plan, you're paying.

## The honest downsides

No tool is perfect. These are the recurring criticisms from user reviews and third-party analyses.

**Steep learning curve.** Too many concepts — pipelines, stages, steps, connectors, delegates, services, environments, infrastructure definitions. Even engineers experienced with other CD tools report needing significant ramp-up time to get comfortable with Harness's abstraction layer.

**The UI needs work.** Deployment graphs that extend off-screen, key parameters hidden behind multiple layers — G2 and Capterra reviews repeatedly mention UI friction.

**Incomplete GitOps support.** Harness CD is strong for pipeline-triggered deployments but lacks the reconciliation loop that defines true GitOps (continuously comparing and syncing current state with desired state, like ArgoCD does).

**Limited customization.** Teams with unique deployment strategies or specific infrastructure needs may find Harness's abstraction layer restrictive rather than helpful.

**Documentation gaps for advanced setups.** Basic configurations are well-documented, but edge cases and advanced settings often lack sufficient guidance.

Despite these weaknesses, Harness continues to win enterprise accounts. The common denominator: organizations that want stable deployment pipelines without needing a dedicated DevOps team to maintain them. When you compare the cost of hiring three DevOps engineers to manage Jenkins versus a Harness license, the math starts favoring Harness at scale.

## What Harness signals about the market

The DevOps tooling market is shifting from "tools" to "platforms." The era of assembling Jenkins, CircleCI, LaunchDarkly, and Datadog into a patchwork pipeline is giving way to integrated platforms like Harness and GitLab that cover the entire lifecycle.

Harness layering AI on top at this moment was well-timed. AIDA generating pipelines, Test Intelligence selecting tests, Continuous Verification auto-validating deployments — this is one of the first practical implementations of AI replacing repetitive DevOps toil.

> Citi's 20,000 engineers going from "days" to "7 minutes" wasn't about swapping one tool for another. It was about letting a platform automate the act of deployment itself.

---
- [Harness Official Site](https://www.harness.io/)
- [Harness Developer Hub (Docs)](https://developer.harness.io/)
- [Citi Case Study](https://www.harness.io/case-studies/citi-improves-software-delivery-performance-reduces-toil-with-harness-cd)
- [AIDA Overview](https://developer.harness.io/docs/platform/harness-aida/aida-overview)
- [Harness GitHub (Open Source)](https://github.com/harness/harness)
