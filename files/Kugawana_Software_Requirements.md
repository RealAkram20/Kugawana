# Kugawana

## Mission

**Reduce food waste while helping people access affordable food through
a community-driven donation network.**

------------------------------------------------------------------------

# Vision

To become Africa's leading food redistribution platform by connecting
food donors with people in need while minimizing food waste and creating
sustainable communities.

------------------------------------------------------------------------

# Core Concept

Kugawana is **not a food selling application**.

Food is donated freely by individuals, restaurants, supermarkets,
hotels, organizations, NGOs, and farmers.

Users only spend **Points** to cover operational services such as:

-   Food Collection
-   Food Sorting
-   Refrigeration
-   Packaging
-   Storage
-   Transportation
-   Delivery

This ensures donated food remains free while making the logistics
sustainable.

------------------------------------------------------------------------

# User Roles

## Super Admin

Has full control over the platform.

Responsibilities include:

-   Manage Countries
-   Enable/Disable Countries
-   Manage Country Admins
-   Manage Global Settings
-   Manage Point Packages
-   Manage Reward Campaigns
-   View Global Reports
-   Approve Admin Accounts
-   Manage Permissions & Roles
-   Manage Payment Settings
-   Manage Community
-   View Audit Logs

## Country Admin

Responsible for one country.

Can:

-   Approve Food Donations
-   Reject Food Donations
-   Assign Warehouses
-   Assign Collection Teams
-   Assign Points to Food
-   Manage Categories
-   Manage Orders
-   Manage Wallet Requests
-   Manage Users
-   View Country Reports

## Food Donor

Can:

-   Register
-   Donate Food
-   Track Donation Status
-   View Donation History
-   Receive Rewards
-   Participate in Community

## Food Receiver

Can:

-   Browse Available Food
-   Purchase Point Packages
-   Place Orders
-   Manage Wallet
-   Track Orders
-   Join Community

------------------------------------------------------------------------

# Countries

Initially:

-   Uganda

Future:

-   Kenya
-   Tanzania
-   Rwanda
-   Zambia
-   South Sudan
-   Africa-wide

Only the **Super Admin** can enable a country.

------------------------------------------------------------------------

# Authentication

Registration Methods:

-   Email
-   Phone Number
-   Google

Recommended:

-   Email Verification
-   OTP Verification
-   Password Reset

------------------------------------------------------------------------

# Multilingual Support

The application UI supports three languages:

- English
- Swahili
- French

Users select their preferred language during onboarding and can change it at any time via **Profile → Language**.

All system strings are translated:

- Navigation labels
- Buttons and form fields
- Notifications and system messages
- Error messages
- Onboarding screens

User-generated content (food listings, community posts, donation descriptions) is **not** translated by the platform. Users rely on their device's native OS translation tools for content they cannot read.

All UI strings must be stored in translation files from day one and never hardcoded into components.

------------------------------------------------------------------------

# User Profile

-   Full Name
-   Profile Photo
-   Phone Number
-   Email
-   Gender
-   Country
-   District
-   Physical Address
-   GPS Coordinates

------------------------------------------------------------------------

# Mobile Permissions

Required:

-   Camera
-   Gallery
-   GPS Location
-   Push Notifications

------------------------------------------------------------------------

# Food Donations

Supported Categories:

-   Cooked Food
-   Fruits
-   Vegetables
-   Bread
-   Meat
-   Drinks
-   Dry Foods
-   Packaged Foods

Each donation includes:

-   Food Title
-   Description
-   Category
-   Quantity
-   Preparation Date
-   Expiry Date
-   Pickup Address
-   GPS Location
-   Special Instructions
-   Images (0--5)
-   Contact Number

------------------------------------------------------------------------

# Donation Workflow

``` text
User uploads food
    ↓
Pending Review
    ↓
Admin reviews
    ↓
Admin contacts donor (if needed)
    ↓
Admin approves
    ↓
Warehouse assigned
    ↓
Collection scheduled
    ↓
Food collected
    ↓
Inspection
    ↓
Points assigned
    ↓
Published
    ↓
Users can request it
```

------------------------------------------------------------------------

# Food Categories

Default Categories:

-   Fresh
-   Frozen
-   Dry Foods
-   Cooked Foods
-   Beverages
-   Bakery
-   Baby Food
-   Vegetables
-   Fruits

Admins can:

-   Add
-   Edit
-   Delete
-   Disable

------------------------------------------------------------------------

# Warehouse Management

Admins can:

-   Create Warehouses
-   Assign Donations
-   Track Capacity
-   Track Refrigerated Storage
-   Track Stock

------------------------------------------------------------------------

# Food Expiry Management

Every food item has an **Expiry Date** set by the donor at the time of submission.

## Auto-Unpublish Rule

When a food item's expiry date and time passes:

- The system automatically unpublishes the item
- It is removed from all browse and search results immediately
- Users with an active reservation on that item are notified that it is no longer available
- The item status changes to **Expired** in the admin panel

Users never see an "Expired" label on the public-facing side of the app. The item simply disappears from listings.

## Admin Visibility

Admins can view expired items in a separate **Expired** tab within the food management panel for reporting and audit purposes.

## Expiry Check

The system runs an expiry check on a scheduled background job (Laravel Queue / Scheduler) at regular intervals — recommended every 15 minutes.

------------------------------------------------------------------------

# Wallet System

Wallet stores:

-   Available Points
-   Reward Points
-   Purchased Points
-   Bonus Points

------------------------------------------------------------------------

# Point Packages

    Points       Price
  -------- -----------
       100   UGX 1,000
       250   UGX 2,300
       500   UGX 4,500
      1000   UGX 8,500

Packages are configurable by the admin.

------------------------------------------------------------------------

# Payment Gateway

Initial:

-   Pesapal

Future:

-   MTN Mobile Money
-   Airtel Money
-   Flutterwave
-   Stripe
-   PayPal

------------------------------------------------------------------------

# Reward System

Example:

A company donates **\$1,000**.

The admin converts it into reward points and can:

-   Reward Existing Users
-   Reward Top Donors
-   Reward Volunteers
-   Reward New Signups
-   Create Promotional Campaigns

Examples:

-   Register this month and receive 100 Points.
-   Donate food and receive 300 Bonus Points.

------------------------------------------------------------------------

# Ordering Food

Users browse food.

Each food item displays:

-   Required Points
-   Quantity
-   Freshness
-   Distance
-   Pickup/Delivery Options

Users can place unlimited orders provided they have sufficient points
and meet any admin-defined limits.

------------------------------------------------------------------------

# Anti-Waste System

Every user has a **Food Responsibility Score**.

Positive actions:

-   Successful collection (+2)
-   Feedback (+1)
-   Future donations (+5)

Negative actions:

-   Repeated cancellations (-10)
-   Failure to collect (-20)
-   Multiple reports (-30)

Low scores may reduce order limits or restrict access to premium items.

------------------------------------------------------------------------

# Rating System

Users can rate each other after a successful food exchange is completed.

## Who Rates Whom

- **Food Receiver** rates the **Food Donor** after a successful delivery or pickup
- **Food Donor** rates the **Food Receiver** after a successful collection or delivery

Ratings are only unlocked once an order is marked **Completed**. A rating prompt is sent as a push notification.

## Rating Format

- 1 to 5 stars
- Optional short text comment (max 150 characters)

## What Ratings Affect

- Each user's profile displays their average star rating and total number of reviews
- Donors with consistently high ratings may be featured in search results
- Receivers with low ratings may be flagged for admin review
- Ratings feed into the **Food Responsibility Score** as a positive signal

## Rating Rules

- A user has 48 hours after order completion to leave a rating
- Ratings cannot be edited once submitted
- Admins can remove ratings that violate community guidelines
- Anonymous ratings are not allowed — both parties must have a verified account

------------------------------------------------------------------------

# Community

Users can:

-   Post updates
-   Like
-   Comment
-   Share success stories
-   Announce donation drives

Admins moderate all content.

------------------------------------------------------------------------

# Learn

The **Learn** tab is a dedicated section in the main navigation for food education content.

## Purpose

To help users reduce food waste through practical knowledge — preservation tips, nutrition basics, safe food handling, and community guides.

## Content Types

- Articles (text + images)
- Short guides
- Tips and best practices

## Content Management

All content is created and managed by the **Country Admin** through the admin panel (FilamentPHP).

Content is organised by category:

- Food Preservation
- Nutrition & Health
- Safe Food Handling
- Reducing Waste at Home
- Community Guides

## User Experience

- Content is browsable without an account (public-facing)
- Users can bookmark articles for offline reading
- Articles are displayed in the user's selected language where a translation exists; otherwise shown in the original language

## Version 1 Scope

Phase 1 delivers a simple article list and detail view. No video, no quizzes, no certificates. Admin publishes articles via the panel; users read them in the app.

------------------------------------------------------------------------

# Notifications

Examples:

-   Food Approved
-   Food Collected
-   Points Added
-   Order Confirmed
-   Out for Delivery
-   Delivered
-   Reward Received
-   Community Updates

------------------------------------------------------------------------

# Reports

-   Total Food Saved
-   Meals Distributed
-   Active Users
-   Total Donors
-   Orders Completed
-   Revenue from Point Purchases
-   Reward Points Issued
-   Food Waste Prevented
-   Top Donors
-   Top Receivers

------------------------------------------------------------------------

# Security

-   Role-Based Access Control (RBAC)
-   Laravel Sanctum
-   Permission Matrix
-   Audit Logs
-   Rate Limiting
-   Image Validation
-   Password Encryption
-   Secure Payment Verification

------------------------------------------------------------------------

# Development Standards

## UI Text

-   No hyphens in any user-facing text
-   Labels, buttons, and descriptions must be minimal — one job per element
-   No explainer text or helper tooltips in the admin panel unless a field is genuinely ambiguous
-   Sentence case everywhere — never title case, never all caps
-   Active voice — "Save" not "Submit", "Share food" not "Food sharing feature"
-   All UI strings live in translation files from day one — never hardcoded in components

## Code

-   No comments in code — naming must be self-explanatory
-   No hardcoded strings, colors, or magic numbers
-   Environment variables for all configuration
-   All business logic in service classes, not controllers
-   No unnecessary abstractions in phase 1 — build lean

------------------------------------------------------------------------

# Technology Stack

## Mobile

-   React Native
-   Expo
-   TypeScript
-   Expo Router
-   Zustand
-   React Query
-   React Hook Form

## Backend

-   Laravel 12
-   Laravel Sanctum
-   MySQL
-   Laravel Queues
-   REST API

## Admin Panel

-   FilamentPHP

## Hosting

-   Hostinger Shared Hosting (initial)
-   VPS / Cloud (future)

------------------------------------------------------------------------

# Recommended Food Lifecycle

``` text
Pending → Reviewed → Approved → Collected → Stored → Published → Reserved → Delivered → Completed

or

Rejected

or

Expired (auto-unpublished when expiry date passes)
```
