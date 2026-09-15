# Product Completion Status — stream

Canonical branch: `portfolio-improvements-2026-08`
Canonical PR: `#1`

Product boundary: historical Mux/video recording and playback demo. This branch restores a maintained, deterministic runtime/build boundary; provider credentials, upload lifecycle, privacy and access-control decisions remain explicit release gates.

## Core tasks

| ID | Status | Task |
| --- | --- | --- |
| T01 | DONE | Reproduce current Vercel production-build failure |
| T02 | DONE | Isolate `plyr` from server prerender/module evaluation |
| T03 | DONE | Add regression contract preventing top-level Plyr runtime import |
| T04 | DONE | Add permanent frozen-install/typecheck/build/audit Quality gate |
| T05 | DONE | Verify regression contracts, install, TypeScript, production build and production dependency audit |
| T06 | DONE | Migrate the historical Next.js 12 / React 17 boundary to Next.js 15.5.25 / React 18 / Node 22 |
| T07 | PARTIAL | Audit Mux upload/playback provider configuration and error states |
| T08 | PARTIAL | Audit recording/media privacy, retention and deletion behavior |
| T09 | PARTIAL | Add authorization/access-control model for non-public recordings if productized |
| T10 | BLOCKED | Exact-current-head Vercel browser/provider smoke with intended credentials and storage |

## Improvements

| ID | Status | Improvement |
| --- | --- | --- |
| I01 | DONE | Browser-only Plyr import now occurs inside `useEffect` lifecycle |
| I02 | DONE | SSR no longer evaluates Plyr browser style capability code |
| I03 | DONE | Player initialization failures are controlled and reported to existing error callback |
| I04 | DONE | Player/HLS teardown remains explicit on unmount/change |
| I05 | DONE | Deterministic Yarn dependency resolution is part of the guarded migration and permanent CI |
| I06 | DONE | TypeScript is blocking |
| I07 | DONE | Production build is blocking |
| I08 | DONE | High/critical production dependency audit is blocking; patched PostCSS/jws transitives are locked |
| I09 | PARTIAL | Inherited media-provider observability/retry behavior needs hosted evidence |
| I10 | PARTIAL | Responsive/browser playback QA requires a READY exact-current-head deployment |

## Product features

| ID | Status | Feature |
| --- | --- | --- |
| F01 | DONE | Existing Mux/HLS playback component remains functional at compile/build boundary |
| F02 | DONE | Existing player poster/current-time behavior retained |
| F03 | DONE | Existing browser HLS/native-HLS split retained |
| F04 | DONE | Existing Mux monitoring remains conditional on public env key |
| F05 | PARTIAL | Recording flow requires provider-backed hosted smoke |
| F06 | PARTIAL | Upload flow requires provider-backed hosted smoke and failure/retry review |
| F07 | PARTIAL | Asset playback authorization/privacy boundary is not yet production-grade |
| F08 | PARTIAL | Moderation/reporting behavior requires current provider/evidence audit |
| F09 | DEFERRED WITH REASON | New streaming features are out of scope until security/provider modernization is complete |
| F10 | BLOCKED | Production promotion requires exact-head preview, runtime-log review and explicit approval |

## Verification evidence

Historical Vercel deployment `dpl_EAhwmE4yToiQQnYZhDoyTpWXvN9x` failed while prerendering `/assets/[id]` because `plyr` was imported at module scope and accessed browser-only style APIs during SSR. The latest accessible preview before this runtime migration, `dpl_4mAaHQaHR3Jr7QFjPSBkg8qKnxxM`, is READY but predates the current migrated dependency state.

The guarded runtime migration run `35030364601` completed GREEN end-to-end: dependency resolution PASS → 15/15 regression contracts PASS → TypeScript PASS → Next.js 15.5.25 production build PASS → high/critical production dependency audit PASS → verified migration commit PASS. The migration also removes the obsolete custom `next/babel` override, fixes the incorrect `typeof window !== undefined` browser guard, keeps styled-jsx linting compatible with React 18, and locks patched PostCSS 8.5.23 and jws 4.0.1 transitive versions.

The generated migration commit triggered a GitHub `action_required` Quality event before runner allocation; this normal user-authored status commit intentionally gives permanent Quality a fresh exact-head verification event without altering runtime behavior.

No merge, production promotion, Mux credential mutation, media deletion, billing action or user-data mutation has been performed.

Status: **PARTIAL** — runtime/build/security migration is verified; remaining gates are provider-backed behavior, media privacy/access-control decisions and exact-current-head hosted/browser verification.
