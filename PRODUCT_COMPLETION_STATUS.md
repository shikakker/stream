# Product Completion Status — stream

Canonical branch: `portfolio-improvements-2026-08`

Product boundary: historical Mux/video recording and playback demo. This branch recovers deterministic build behavior first; provider credentials, upload lifecycle, privacy and access-control decisions remain explicit release gates.

## Core tasks

| ID | Status | Task |
| --- | --- | --- |
| T01 | DONE | Reproduce current Vercel production-build failure |
| T02 | DONE | Isolate `plyr` from server prerender/module evaluation |
| T03 | DONE | Add regression contract preventing top-level Plyr runtime import |
| T04 | DONE | Add permanent frozen-install/typecheck/build Quality gate |
| T05 | DONE | Verify exact-head regression test, install, TypeScript and production build |
| T06 | PARTIAL | Modernize the historical Next.js 12 / React 17 dependency boundary |
| T07 | PARTIAL | Audit Mux upload/playback provider configuration and error states |
| T08 | PARTIAL | Audit recording/media privacy, retention and deletion behavior |
| T09 | PARTIAL | Add authorization/access-control model for non-public recordings if productized |
| T10 | BLOCKED | Exact-head Vercel browser/provider smoke with intended credentials and storage |

## Improvements

| ID | Status | Improvement |
| --- | --- | --- |
| I01 | DONE | Browser-only Plyr import now occurs inside `useEffect` lifecycle |
| I02 | DONE | SSR no longer evaluates Plyr browser style capability code |
| I03 | DONE | Player initialization failures are controlled and reported to existing error callback |
| I04 | DONE | Player/HLS teardown remains explicit on unmount/change |
| I05 | DONE | Frozen Yarn dependency install is part of CI |
| I06 | DONE | Exact-head TypeScript is blocking |
| I07 | DONE | Exact-head production build is blocking |
| I08 | PARTIAL | Production dependency audit/security migration remains to be completed with synchronized lockfile changes |
| I09 | PARTIAL | Inherited media-provider observability/retry behavior needs hosted evidence |
| I10 | PARTIAL | Responsive/browser playback QA requires a READY exact-head deployment |

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

Historical Vercel deployment `dpl_EAhwmE4yToiQQnYZhDoyTpWXvN9x` failed while prerendering `/assets/[id]` because `plyr` was imported at module scope and accessed browser-only style APIs (`WebkitTransition`) during SSR.

A regression contract was committed first to require dynamic browser-lifecycle loading. Current exact code head `e25ceb3bdf8a91838438740b34ffd5647ccdc991` passed GitHub Quality run `34978774556`: source regression test, frozen Yarn install, TypeScript, and production build all passed.

No merge, production promotion, Mux credential mutation, media deletion, billing action or user-data mutation has been performed.
