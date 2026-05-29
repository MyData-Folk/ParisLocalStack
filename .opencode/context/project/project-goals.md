# Project Goals — ParisLocalStack

## Vision

ParisLocalStack is a multi-tenant SaaS platform for independent hotels, boutique hotels, and small hotel groups. Its goal is to digitize the hotel guest experience while helping hotel teams collect guest CRM data, reduce repetitive reception workload, manage service requests, and improve guest satisfaction before negative reviews appear on public booking platforms.

The product provides a digital concierge web app for hotel guests, a reception dashboard for hotel staff, a super admin back-office for the platform operator, and a hotel generator/onboarding workflow to create new hotel tenants without creating separate applications.

## Target Users

### Hotel Guests
Guests access the hotel app by scanning a QR code or opening the hotel subdomain. They can complete onboarding, consult hotel information, send messages to reception, request services, browse local recommendations, and leave feedback.

### Reception Staff
Receptionists use the dashboard to manage live messages, service requests, present guests, stay history, guest reviews, and CRM information.

### Hotel Managers / Hotel Admins
Hotel managers manage their hotel profile, practical information, guest app theme, local recommendations, reception users, CRM exports, and satisfaction insights via the Hotel Admin space (8 routes live).

### Super Admin / Platform Operator
The platform operator manages all hotels, creates new tenants, generates hotel URLs and QR codes, monitors deployments, configures settings, and prepares each hotel client for use.

## Main Product Objectives

- Collect guest emails and phone numbers during onboarding.
- Enrich each hotel’s guest CRM with consent, preferences, tags, notes, and relationship status.
- Reduce repetitive reception workload by centralizing common information and requests.
- Provide guests with a branded digital concierge experience.
- Give reception teams a professional operational dashboard.
- Separate present guests from archived stays and historical CRM data.
- Manage messages, taxi requests, restaurant requests, room service, linen requests, assistance, and reviews.
- Detect dissatisfied guests before checkout and allow staff to act quickly.
- Offer customizable guest app themes for different hotel identities.
- Allow each hotel to customize local recommendations and practical information.
- Prepare future integrations with Google Maps and public transport APIs.

## Current Product Surfaces

- Guest App: mobile-first digital concierge web app per hotel subdomain.
- Reception Dashboard: operational dashboard for staff.
- Super Admin: platform administration for the operator.
- Generator: hotel onboarding wizard for creating/configuring tenants.
- Hotel Admin: self-service B2B client space (8 routes live).
- API: Express backend with multi-tenant business logic.
- PostgreSQL Database: central multi-tenant data storage.

## Non-Goals

- Do not create one React application per hotel.
- Do not duplicate backend services per tenant.
- Do not expose private CRM data in public guest APIs.
- Do not mix reception/admin interfaces with the guest-facing app experience.
- Do not prioritize large UI rewrites over production safety, data isolation, and reliable hotel workflows.

## Production Priorities

Before real hotel clients are onboarded, the platform must prioritize:

1. Secure tenant isolation.
2. Secure Socket.IO rooms for staff and guests.
3. Safe Prisma migration handling.
4. Production-ready secrets and environment validation.
5. Role-based permissions.
6. CRM export and segmentation (Phase 7c completed — client-side filters, segmented exports).
7. Reliable backups and restore procedures.
8. External object storage for uploaded files.
9. Monitoring, logs, and operational alerts.
