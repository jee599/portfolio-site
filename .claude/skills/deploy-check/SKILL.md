---
name: deploy-check
description: 배포 전 체크리스트 실행
allowed-tools: Bash, Read, Glob, Grep
user-invocable: true
---

# 배포 전 체크

다음을 순서대로 검증한다:

1. **빌드 확인**: `npm run build` 실행, 에러 없는지 확인
2. **타입 체크**: TypeScript 에러 확인
3. **환경변수**: `.env.example` 대비 누락된 키 확인
4. **Git 상태**: 커밋 안 된 변경사항 확인
5. **의존성**: `package-lock.json` 동기화 확인

## 결과 형식

```
✅ 빌드 성공
✅ 타입 에러 없음
⚠️ 환경변수 GOOGLE_SEARCH_API_KEY 미설정 (로컬)
✅ 모든 변경사항 커밋됨
✅ 의존성 동기화 완료
```
