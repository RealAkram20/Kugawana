---
name: kugawana-mobile
description: React Native + Expo + TypeScript patterns for the Kugawana mobile app. Use whenever building screens, components, navigation, state, or API calls for the Kugawana mobile app. Always read kugawana-project first for business rules and UI standards.
---

# Kugawana Mobile

Read `kugawana-project` SKILL.md before this one.

## Stack

- React Native + Expo (managed workflow)
- TypeScript — strict mode
- Expo Router — file-based navigation
- Zustand — global state
- React Query (TanStack Query) — server state and caching
- React Hook Form — all form handling
- i18next — translations (English, Swahili, French)

## Project Structure

```
app/
  (auth)/
    language.tsx
    register.tsx
    verify.tsx
    profile-setup.tsx
  (tabs)/
    index.tsx          # Home
    share.tsx          # Share food
    community.tsx
    learn.tsx
    profile.tsx
  _layout.tsx
components/
  ui/                  # Primitives: Button, Input, Card, Badge
  food/                # FoodCard, FoodGrid, CategoryPill
  community/           # PostCard, MemberCard
  learn/               # ArticleCard
stores/
  auth.store.ts
  wallet.store.ts
  app.store.ts
services/
  api.ts               # Axios instance with interceptors
  food.service.ts
  orders.service.ts
  community.service.ts
  learn.service.ts
locales/
  en.json
  sw.json
  fr.json
types/
  food.types.ts
  user.types.ts
  order.types.ts
constants/
  colors.ts
  spacing.ts
```

## Design System

### Colors
```ts
export const colors = {
  primary: '#2D6A2D',
  primaryLight: '#4A8C4A',
  primaryDark: '#1A4A1A',
  accent: '#F5A623',
  surface: '#FFFFFF',
  background: '#F5F5F0',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9B9B9B',
  success: '#2D6A2D',
  warning: '#F5A623',
  error: '#E24B4A',
  border: '#E8E8E0',
}
```

### Spacing
```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}
```

### Typography
- Heading: weight 700, sizes 24 / 20 / 18
- Body: weight 400, size 14 / 16
- Caption: weight 400, size 12
- Label: weight 600, size 13

## Navigation Structure

Bottom tabs: Home, Share (center FAB), Community, Profile
Learn is accessible from Home and Profile, not a bottom tab.

```
(auth) stack → language → register → verify → profile-setup
(tabs) tab navigator → index, share, community, profile
```

## API Layer

```ts
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
})

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

Use React Query for all data fetching. No raw axios calls in components.

```ts
export function useFoodListings(filters?: FoodFilters) {
  return useQuery({
    queryKey: ['food', filters],
    queryFn: () => foodService.getListings(filters),
  })
}
```

## State Management

Zustand for: auth token, user profile, wallet balance, selected language.
React Query for: all server data (food listings, orders, community posts).
Local state for: form state (React Hook Form), UI toggles.

```ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

## Forms

All forms use React Hook Form. No uncontrolled inputs.

```tsx
const { control, handleSubmit, formState: { errors } } = useForm<DonationForm>()
```

## Translations

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  resources: { en, sw, fr },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})
```

Use `useTranslation` hook in components. Never hardcode UI strings.

```tsx
const { t } = useTranslation()
<Text>{t('home.nearbyFood')}</Text>
```

## Component Rules

- Functional components only
- No default export for shared components — named exports only
- Props interfaces defined above the component
- No inline styles — use StyleSheet.create or a style token
- No comments inside component files

## Food Listing Card

Each card shows: image, title, distance, pickup time, freshness badge, required points.
No hyphens in any displayed text.

## Key Screens Reference

| Screen | Route | Notes |
|---|---|---|
| Splash | app/index.tsx | Auto-navigate based on auth state |
| Language | (auth)/language | English, Swahili, French picker |
| Register | (auth)/register | Phone + email + Google |
| Verify | (auth)/verify | 6-digit OTP |
| Profile Setup | (auth)/profile-setup | Name, location |
| Home | (tabs)/index | Greeting, search, quick actions, nearby food, community snippet, learn snippet |
| Find Food | food/index | Browse and filter |
| Food Detail | food/[id] | Full info, points required, request button |
| Share Food | (tabs)/share | Donation form |
| My Donations | profile/donations | Donor history |
| My Requests | profile/requests | Receiver order history with tabs: All, Pending, Accepted, Completed |
| Community | (tabs)/community | Feed with post types: Request, Offer, Discussion |
| Learn | learn/index | Article list by category |
| Article | learn/[id] | Article detail |
| Wallet | profile/wallet | Points balance, purchase packages |
| Profile | (tabs)/profile | User info, settings, language |
