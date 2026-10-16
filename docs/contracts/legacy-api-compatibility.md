---
type: contract
title: Legacy API Compatibility Contract
description: Public compatibility boundary for the active Embeddable application after the legacy code archive.
owner: NEEDS_OWNER
status: proposed
risk_level: critical
tags: [compatibility, adapter, public-api]
---

## Intent

The active application under `src/` MUST preserve supported public Embeddable behavior unless a reviewed decision explicitly removes or changes it. Compatibility is defined at public configuration, adapter, route, event, and response boundaries; archived implementation details are not part of the contract.

## Boundaries

- Runtime URL and adapter initialization options remain public inputs.
- Host-to-widget commands, widget-to-host events, and response payloads remain public integration boundaries.
- Supported deep links and route aliases MUST continue to resolve to equivalent active behavior.
- `legacy/` and `legacy-test/` are frozen reference material. Active code and tests MUST NOT import from them or use them as executable specifications.

## Change Rules

1. Public inputs MUST NOT become silent no-ops.
2. Payload fields, error behavior, defaults, aliases, validation, persistence, and multi-tab delivery are compatibility concerns.
3. Removing public behavior requires explicit product approval, migration guidance, and human review.
4. Compatibility evidence MUST exercise the active implementation's public boundary rather than compare against archived source code.

## Human Review Focus

- Authentication defaults, input validation, and secret handling.
- Calling behavior and host resize/navigation behavior.
- Event and response payload compatibility for existing host integrations.
- Any intentional removal of a configuration option, command, event, or route.

## Verification

- Full active suite: `npm test -- --runInBand`
- Authentication boundary: `npm test -- --runInBand test/adapterAuthentication.test.js test/createAppAuthentication.test.js test/runtimeSdkConfig.test.js test/oauthAdapterMessageBoundary.test.js`
- Adapter boundaries: `npm test -- --runInBand test/adapterApiEventParity.test.js test/adapterCallCompatibility.test.js test/adapterRequestCompatibility.test.js test/adapterNavigationCompatibility.test.js`
- Production bundle: `npm run build`
- Runtime monitoring and named owner: Verification: Missing; `NEEDS_OWNER` and `NEEDS_REVIEW`.

## Related Decision

- [ADR-0001: Classify compatibility before next cutover](../adr/0001-classify-compatibility-before-next-cutover.md) records the pre-cutover rationale.
