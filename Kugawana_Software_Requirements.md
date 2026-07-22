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

# Community

Users can:

-   Post updates
-   Like
-   Comment
-   Share success stories
-   Announce donation drives

Admins moderate all content.

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
```
