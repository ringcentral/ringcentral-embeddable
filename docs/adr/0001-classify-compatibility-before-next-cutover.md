---
type: adr
title: ADR-0001 - Classify compatibility before next cutover
description: Requires explicit classification and verification of public legacy behavior before next replaces src.
owner: NEEDS_OWNER
status: proposed
risk_level: critical
tags: [migration, compatibility, next]
---

## Context

The next application replaces many local legacy modules with shared micro packages and local next-core overrides. This makes folder or module-name comparison unreliable. It also allows a feature to appear migrated while a runtime option, route alias, postMessage payload, or user-facing view remains disconnected.

The host adapter currently accepts a broader public surface than the next bootstrap consumes. Default builds and deployment still use the legacy application. Cutover therefore needs a behavioral gate rather than an implementation-count milestone.

## Decision

Every public legacy surface MUST be classified in the src-to-next compatibility registry. The default build and deployment MUST NOT switch to next until every critical entry is either:

- `verified` by an automated public-boundary compatibility test; or
- `removed` by a reviewed decision with migration and rollback guidance.

Unsupported behavior MUST NOT be treated as intentionally removed without a separate decision.

## Options considered

### Infer completion from migrated modules

Rejected because next delegates substantial behavior to shared packages, and migrated services do not prove that configuration, views, or host integrations are connected.

### Cut over and fix compatibility regressions reactively

Rejected because authentication, calling, multi-tab behavior, and third-party postMessage contracts have a broad external blast radius and insufficient runtime observability.

### Maintain an explicit registry with completeness checks

Selected because it makes uncertainty reviewable, prevents silent contract loss, and supports incremental promotion from unsupported or partial behavior to verified parity.

## Consequences

- Migration progress is measured by verified public behavior rather than file count.
- Contract changes require registry and test changes in the same review.
- The project must maintain compatibility tests across URL, postMessage, route, and browser boundaries.
- Product removals require explicit review instead of being hidden inside migration work.
- Cutover may take longer, but rollback risk and integration regressions become visible before deployment.

## Risks

- The initial inventory may miss undocumented behavior used by external integrations.
- A source-level completeness check can prove classification, not behavioral parity.
- Registry status may become stale without ownership and CI enforcement.

## Follow-up

- Assign an owner: NEEDS_OWNER.
- Add public-boundary tests for critical runtime and adapter entries.
- Add a next production-build shadow lane.
- Define a separate decision for any intentional feature removal.
- Review the registry at each migration milestone and before cutover approval.

## Verification

- Registry completeness: `npm run test:next -- --runInBand test/next/compatibilityContract.test.js`
- Compatibility policy: [src-to-next compatibility contract](../contracts/src-next-compatibility.md)
- Cutover CI gate: Verification: Missing.
