# ExampleHR – Time-Off

Production-quality Time-Off management frontend built with **Next.js 14 App Router**, **TanStack React Query v5**, **Zustand**, **TypeScript (strict)**, **shadcn/ui**, and **Storybook 8**.

## Live Links

| | URL |
|---|---|
| Live App | https://examplehr-timeoff-dun.vercel.app/employee |
| Storybook | https://examplehr-timeoff-dfcj-3a6z6hiyh.vercel.app |
| GitHub | https://github.com/umairm1alik/examplehr-timeoff |

## Prerequisites

- Node.js 18 or higher
- npm

## Installation

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

App runs on [localhost:3000](http://localhost:3000).

| Route | View |
|---|---|
| `/employee` | Employee dashboard — balances per location, time-off request form |
| `/manager` | Manager dashboard — approve/deny pending requests |

Root `/` redirects to `/employee`.

## Run Storybook

```bash
npm run storybook
```

Runs on [localhost:6006](http://localhost:6006). Every meaningful UI state has a story with a `play` function.

## Run Tests

```bash
# Run all tests once
npm run test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

Coverage targets `components/` and `lib/` (>80% aim).

## Mock HCM Behavior

All endpoints live under `/api/hcm/`. The POST `/api/hcm/request` endpoint accepts an `X-HCM-Simulate` header to force specific behaviors:

| Header value | Behavior |
|---|---|
| `silent_failure` | Returns 201 OK but does **not** deduct the balance (HCM lies) |
| `rejection` | Returns 500 `hcm_unavailable` |
| `success` | Forces the normal success path regardless of random roll |

```bash
# Force a silent failure
curl -X POST http://localhost:3000/api/hcm/request \
  -H "Content-Type: application/json" \
  -H "X-HCM-Simulate: silent_failure" \
  -d '{"employeeId":"emp_001","locationId":"Lahore","days":2,"reason":"Test"}'
```

## Trigger Anniversary Bonus

```bash
curl -X POST http://localhost:3000/api/hcm/anniversary \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"emp_001","locationId":"Lahore","bonusDays":5}'
```

This adds days to the employee's balance and is picked up by the 30-second background reconciliation.

## Architecture

### State layers

| Layer | Tool | What it owns |
|---|---|---|
| Server state | TanStack React Query v5 | All balances and requests, cache, background refetch |
| UI state | Zustand | Open forms, in-flight flags, held background updates, notification banner |

### Optimistic updates & rollback

1. **`onMutate`** — snapshot cache, apply optimistic balance deduction, set `inFlightLocations` flag to block background updates for that location.
2. **`onError`** — restore snapshot, set `rolled-back` status, show error message.
3. **`onSettled`** — re-fetch the single-balance endpoint (authoritative read). If the returned balance doesn't match the expected post-mutation value, rollback even though HCM returned 200 (**silent failure detection**). Release any held background update.

### Silent failure detection

After every mutation, `GET /api/hcm/balance` is called for that specific `(employeeId, locationId)`. If `freshBalance !== expectedBalance` after a success response, the UI rolls back and shows an explicit error.

### Background reconciliation

The batch balances query refetches every 30 seconds. When new data arrives while a mutation is in-flight, the update is held in `Zustand.pendingBackgroundUpdates` and applied in `onSettled` after the mutation resolves.

### Manager fresh balance

`ApprovalView` uses `staleTime: 0, gcTime: 0` so a fresh balance is fetched every time the component mounts. Approve/Deny buttons are disabled until the query resolves, preventing approvals against stale data.
