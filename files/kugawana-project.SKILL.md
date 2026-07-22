---
name: kugawana-project
description: Master context skill for the Kugawana food redistribution platform. Read this first before writing any code, designing any screen, or making any architectural decision for Kugawana. Trigger on any mention of Kugawana, food donation app, food redistribution, or any of its features including points system, food donations, warehouse, community feed, or Learn tab.
---

# Kugawana Project Context

## What Kugawana Is

A food redistribution platform connecting food donors with people in need across Africa. Food is donated freely. Receivers spend Points only to cover operational logistics: collection, sorting, refrigeration, packaging, storage, and delivery. The platform is self-sustainable through point purchases — not donor-dependent.

This is not a food selling application. Points cover the middlemen, not the food.

## Phase 1 Scope (Build This Now)

- Uganda only
- No dedicated field agents or delivery employees (not viable yet)
- Admin confirms deliveries manually
- Warehouse capacity is tracked manually by admin, no automated alerts
- Hostinger shared hosting initially

Do not over-engineer. Build lean.

## Tech Stack

| Layer | Stack |
|---|---|
| Mobile | React Native, Expo, TypeScript, Expo Router, Zustand, React Query, React Hook Form |
| Backend | Laravel 12, Laravel Sanctum, MySQL, Laravel Queues, REST API |
| Admin Panel | FilamentPHP |
| Hosting | Hostinger Shared Hosting |
| Payments | Pesapal (initial) |

## User Roles

| Role | Scope |
|---|---|
| Super Admin | Global — manages countries, admins, point packages, reward campaigns |
| Country Admin | One country — approves donations, assigns warehouses, manages orders and users |
| Food Donor | Donates food, tracks donation status, earns rewards |
| Food Receiver | Browses food, purchases points, places and tracks orders |

## Food Lifecycle

```
Pending → Reviewed → Approved → Collected → Stored → Published → Reserved → Delivered → Completed
or Rejected
or Expired (auto-unpublished by scheduler, never visible to users as "expired")
```

## Key Business Rules

- Expiry auto-unpublish runs every 15 minutes via Laravel Scheduler
- Expired items disappear silently from the user side
- Ratings unlock only after an order is marked Completed
- Food Responsibility Score affects order limits and item access
- Admin confirms all deliveries — no receiver-side delivery confirmation
- Warehouse management is manual — no capacity alert triggers

## Languages

UI strings in three languages: English, Swahili, French.
User-generated content is not translated by the platform.
All strings must live in translation files from day one. Never hardcode UI text.

## UI and Code Standards

Read these carefully. They apply to every screen, component, and file in this project.

### UI Text Rules
- No hyphens in any user-facing text. Use "Food Sharing" not "Food-Sharing"
- Keep all labels, buttons, and descriptions minimal. One job per element
- No explainer text on the admin panel unless absolutely necessary
- Sentence case everywhere. Never title case, never all caps
- Active voice. "Save" not "Submit". "Share food" not "Food sharing feature"

### Code Rules
- No comments in code. The code should be self-explanatory through naming
- Clean, readable naming over abbreviation
- No unnecessary abstractions in phase 1
- No hardcoded strings, colors, or magic numbers
- Environment variables for all config

## Related Skills

- `kugawana-mobile` — React Native patterns, navigation, component structure
- `kugawana-backend` — Laravel 12 API patterns, auth, queues, models
- `kugawana-admin` — FilamentPHP admin panel patterns
