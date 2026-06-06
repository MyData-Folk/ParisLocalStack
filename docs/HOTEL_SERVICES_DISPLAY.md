# Hotel Services Display

## Scope

This document records the local completion of Vague 6B to 6F for configurable hotel services.

Goal: allow each hotel to expose only its active and authorized services in the Guest App, while keeping the legacy Guest App service display as a fallback.

Staging and production are not validated by this document.

## Delivery Status

- PR #91: shared service types, schemas and catalog foundations.
- PR #92: `HotelSettings.enabledServices`, private services API and plan limits.
- PR #93: Super Admin attribution of authorized services per hotel.
- PR #94: Hotel Admin personalization of authorized services.
- PR #95: public settings DTO exposes active services and limits safely.
- PR #96: frontend `useEnabledServices` hook.
- PR #97: Guest App renders dynamic services with strict legacy fallback.

## Ownership

Super Admin:

- attributes the services available to an hotel;
- remains responsible for package/plan constraints.

Hotel Admin:

- customizes only the services authorized for its hotel;
- can adjust title, description, image URL, action label, order and visibility according to the existing UI and plan limits.

Guest App:

- displays only active and visible services returned by public settings;
- preserves the historical hardcoded service display when no usable dynamic services exist.

## Public DTO Safety

The public settings route exposes service data for display only.

Expected safeguards:

- return enabled services only;
- respect `visibleInGuestApp`;
- sort by `order`;
- apply plan limits defensively;
- return an empty list if the configuration is absent or invalid;
- never expose secrets, users, hotel users, password hashes, tokens, cookies or private settings;
- never expose sensitive values such as Wi-Fi passwords or WhatsApp numbers.

## Guest App Fallback

The legacy Guest App service display must remain visible when:

- `enabledServices` is absent;
- `enabledServices` is empty;
- the configuration is invalid;
- all services are disabled;
- no service can be mapped safely to an existing Guest App action.

This fallback protects the commercial demo and avoids a blank service area.

## Supported Service Actions

Dynamic services are expected to map to existing Guest App behavior when possible:

- Taxi opens the existing Taxi request flow.
- Room service opens the existing Room service flow.
- Blanchisserie / Pressing keep the existing laundry/linen-oriented flow when enabled.
- Reception, maintenance and other supported service types should reuse existing request flows.

Unmapped services should be ignored or fallback safely rather than breaking the screen.

## Local Validation

Validated locally on 2026-06-06:

- API `/health`: OK.
- API `/ready`: OK.
- Web local: OK.
- Guest App demo: no visible blocking error.
- Super Admin services authorization section: visible.
- Hotel Admin services section: visible.
- Legacy fallback with no active dynamic service: OK.
- Taxi dynamic service: visible and opens the existing Taxi form.
- Room service dynamic service: visible and opens the existing Room service form.
- Disabled service: hidden.
- Initial local test state: restored after temporary checks.
- Mobile 375px: OK.
- `npm run audit:ui`: 6 passed.
- `npm run typecheck --workspaces --if-present`: OK.
- `npm run build --workspaces --if-present`: OK.
- `git diff --check`: OK.

## Demo Guidance

For the local RDV demo:

- show Guest App, Reception and Hotel Admin only;
- keep Super Admin internal unless needed for internal explanation;
- explain that services can be configured by hotel and shown to the client;
- mention that fallback legacy remains if no services are configured;
- do not claim staging or production readiness for these public surfaces until a dedicated environment is verified.

## Non-Goals

This document does not authorize:

- staging or production deployment;
- seed execution outside local;
- migration or db push outside an approved phase;
- exposing credentials or environment values;
- using production as staging.
