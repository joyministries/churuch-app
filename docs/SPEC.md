# Church Mobile Platform — Design Spec

Date: 2026-11-05
Status: Approved for implementation (designer's own design, pending brand input)

## 1. Purpose
A self-contained mobile app for a church: member communication, spiritual growth
resources, connection/engagement, giving, volunteering, and admin — with a
backend that runs anywhere without external services or keys.

## 2. Scope
Six feature groups (full blueprint):

1. Communication — push/broadcast notifications, in-app chat groups, notice
   board, multi-campus hubs
2. Spiritual growth — media hub (sermon archive + live stream), daily
   devotionals & Bible reading plans, prayer wall, sermon notes/journaling,
   discipleship streaks & growth tracks
3. Connection — event calendar + RSVP, digital check-in/attendance, first-time
   guest connect card
4. Giving — mobile tithes/offering (M-Pesa + card)
5. Volunteering — serving roster with swap/accept/decline
6. Admin — users/roles, campus & ministry management, audit log

## 3. Architecture

```
church-app/
├── app/                  # Expo React Native
│   ├── src/
│   │   ├── navigation/   # Tabs + stacks
│   │   ├── screens/      # one file per screen
│   │   ├── components/   # reusable UI
│   │   ├── services/     # API client
│   │   ├── store/        # Zustand
│   │   └── lib/          # theme, utils
│   └── app.json, package.json
├── server/               # Node/Express + SQLite
│   ├── src/              # routes, db, services
│   └── package.json
└── docs/SPEC.md
```

- **App**: Expo SDK 52, React Navigation (tabs + stack), Zustand,
  expo-notifications, expo-linking
- **Backend**: Node 24 + Express + `better-sqlite3`, REST API, JWT auth,
  role-based access (member / leader / admin)
- **Offline**: SQLite is local-first; API is a thin state sync layer

## 4. Data Model

| Table | Purpose |
|-------|---------|
| users | id, name, email/phone, role, campus_id, created_at |
| campuses | id, name, address |
| ministries | id, campus_id, name, leader_id |
| content (notice_board, devotionals, sermons, media) | polymorphic-ish content rows |
| events | id, campus_id, date, rsvp_open |
| rsvps | event_id, user_id, status |
| chat_groups / messages | small-group chat |
| giving | donor_id, amount, method, ref, status |
| attendance | event_id, user_id, checked_in_at |
| prayer_requests | author_id, text, prayed_for_by[], status |
| growth_tracks / user_streaks | discipleship progress |
| audit_log | actor, action, target, at |
| notifications | user_id, type, payload, read_at |

## 5. Design
Warm neutral: paper `#FAF7F2`, ink `#1C1915`, accent `#B45309` (amber),
secondary `#4A7C59` (sage). System fonts, rounded cards, generous whitespace.
Accessible (WCAG AA), calm, not templated.

## 6. Build Order
1. Scaffold Expo + backend + DB schema + seed data
2. Auth (login/reset) + member shell (dashboard, profile)
3. Communication (notice board, notifications, chat, multi-campus filter)
4. Spiritual growth (media hub, devotionals, prayer wall, sermon notes, streaks)
5. Connection (events/RSVP, check-in, guest connect card)
6. Giving + volunteer roster
7. Admin panel + audit log