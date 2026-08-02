# Habit Tracker Social App — Full Project Specification

**Purpose of this document:** Hand this file to Claude Code as the single source of truth for building the app. It covers architecture, data models, every feature, privacy rules, edge cases, and a phased build plan. Sections marked **⚠️ Issue Found & Fix** are places where the original idea had a gap or risk — read those closely before building, since they change the data model.

---

## 1. Product Overview

A social habit-tracking app where a user tracks personal habits, focus sessions, and mood — and can selectively let accepted friends view that data and leave sticky-note comments on it. Optional private period-cycle tracking for users who opt in.

**Core pillars:**
1. Habit tracking (weekly grid + GitHub-style contribution heatmap)
2. Social layer (friends, view permissions, sticky-note comments)
3. Focus timer with "what I'm working on" broadcast to friends
4. Daily mood check-in with a visual mood history
5. Private, opt-in period-cycle calculator

**Design language:** Soft rounded cards, pastel/dark theme support, generous spacing — matching the reference images (soft neumorphic light theme for habits, dark widget grid for the home dashboard, warm illustrated onboarding).

---

## 2. Recommended Tech Stack

- **Frontend:** React Native (Expo) — single codebase for iOS/Android, matches the widget-like card UI well.
- **Backend:** Node.js + Express (or Fastify), or Supabase if you want to move faster (auth + Postgres + realtime out of the box).
- **Database:** PostgreSQL (relational data — friendships, habits, logs — fits relational structure better than NoSQL).
- **Realtime:** Supabase Realtime or Socket.io — needed for live timer-session viewing and sticky notes appearing instantly.
- **Auth:** Email/password + optional Google/Apple sign-in.
- **Push notifications:** Expo Notifications / Firebase Cloud Messaging.
- **Storage:** S3-compatible bucket for avatars.

Claude Code should scaffold this as a monorepo: `/app` (React Native), `/server` (API), `/shared` (types).

---

## 3. Core Design Principles

1. **Privacy is per-module, not all-or-nothing.** A friend accepting your request does NOT mean they see everything. (See §9.)
2. **Nothing health-related is shared by default.** Mood and period data are sensitive; habits and timer are lower-stakes.
3. **Every social action needs consent both ways** — friend requests, not one-directional "follows."
4. **The app should never block the user with a mandatory modal.** Mood check-in, reminders, etc. must be dismissible.

---

## 4. Onboarding & Account Setup Flow

**Screen order:**
1. **Welcome / value prop carousel** (3 slides: track habits, share progress with friends, focus timer + mood).
2. **Sign up** — email + password, or Apple/Google OAuth.
3. **Choose username** — unique, this is the handle friends search for you by (e.g. `@budi_k`). Check uniqueness live.
4. **Display name + avatar** — pick an illustrated avatar (like image 3) or upload a photo.
5. **Optional profile detail step — reframed for sensitivity:**
   - ⚠️ **Issue Found & Fix:** The original idea says "mentioned in the onboarding page… if she's a girl." Forcing a gender disclosure at signup is invasive and unnecessary — plenty of users would decline or feel put on the spot in a first-run flow, and gender itself isn't actually the relevant variable (a trans man might still want cycle tracking; a cis woman might not want it at all).
   - **Fix:** Don't ask gender at onboarding at all. Instead, onboarding has a generic **"Anything else you'd like to track?"** screen with opt-in toggles: *Focus timer*, *Mood tracking*, *Period cycle tracking*. If the person toggles on period tracking, only then ask for last period start date + average cycle length. This can also be turned on/off later from Settings → Health, so it's never a one-time forced choice.
6. **Notification permission prompt** (with a plain-language reason: "so we can remind you about habit streaks").
7. **First habit creation** — walk them through creating one habit immediately so the app isn't empty on first open.
8. **Done → Home screen.**

**Account settings must include:**
- Change username/avatar
- Manage connected friends (§9)
- Manage per-module privacy defaults
- Turn mood tracking / period tracking on or off
- Data export & account deletion (App Store/Play Store compliance requirement for any app handling health-adjacent data)

---

## 5. Data Models (high level)

```
User
 - id, username (unique), display_name, avatar_url
 - email, auth_provider
 - mood_tracking_enabled: bool
 - period_tracking_enabled: bool
 - created_at

Friendship
 - id, requester_id, addressee_id
 - status: pending | accepted | declined | blocked
 - created_at, responded_at

FriendPermission          <-- ⚠️ new table, see §9
 - id, owner_id, friend_id
 - can_view_habits: bool (default true)
 - can_view_timer: bool (default true)
 - can_view_mood: bool (default false)
 - can_view_period: bool (always false, not user-configurable — see §9)
 - can_comment: bool (default true)

Habit
 - id, user_id, title, emoji/icon
 - schedule_type: 'daily' | 'weekdays' | 'x_per_week' | 'date_range' | 'single_day'
 - schedule_data: JSON (e.g. weekdays: [Mon,Wed,Fri]; x_per_week: 5; date_range: {start,end}; single_day: date)
 - color_tag
 - archived: bool
 - created_at

HabitLog
 - id, habit_id, date, status: 'done' | 'skipped' | 'missed'
 - completed_at

TimerSession
 - id, user_id, task_description, started_at, ended_at, duration_seconds
 - is_active: bool

MoodEntry
 - id, user_id, date, mood: enum, note (optional)
 - UNIQUE(user_id, date)   -- one mood per day

PeriodLog
 - id, user_id, cycle_start_date, cycle_length_days, period_length_days
 - notes (private, never exposed via any friend-facing API)

StickyNote
 - id, author_id (friend), owner_id (whose screen it's on)
 - target_type: 'habit_grid' | 'timer_session' | 'mood_calendar'
 - target_id (nullable — which habit/session/day it's attached to)
 - position_x, position_y (relative %, 0.0–1.0, so it survives screen resizing)
 - color, text
 - created_at
```

---

## 6. Feature Spec: Home Page

**Layout (top to bottom), combining images 1 & 2:**

1. **GitHub-style contribution grid widget** — one per habit (or an aggregate "all habits" heatmap as the top one, then per-habit ones below, collapsible). Each cell = one day; color intensity = how many habits completed that day, or for a single-habit widget, done/not-done. Tapping a cell shows a mini popover with the date's detail.
2. **Weekly Habits card** (image 1 style) — list of habits, each row shows Mon–Sun circles, checked/unchecked, with the habit's schedule label (e.g. "Everyday," "5 times a week," "Mo, Th, Fr"). Tapping a circle toggles that day's completion (only for valid scheduled days).
3. **"+ Add Habit"** button (top right, matches image 1) opens the Add Habit flow (§7).
4. **Friend activity strip** (new, see §11) — small avatars of friends with a subtle indicator if they left a new sticky note or hit a streak milestone, so the social layer isn't hidden behind navigation.

---

## 7. Feature Spec: Habit Creation & Scheduling

**Add Habit modal fields:**
- Title + emoji/icon picker
- Color tag
- **Schedule type** (this is the part the original idea under-specified):
  - **Every day**
  - **Specific weekdays** (multi-select Mon–Sun)
  - **X times per week** (number stepper; app doesn't care which days, just counts toward the weekly total — like the "Reading: 5 times a week" in image 1)
  - **Single day** — pick one date on a calendar; habit appears only that day and disappears after
  - **Date range** — pick start and end date on a calendar; habit is active only within that window (e.g. "30-Day Plank Challenge")
- ⚠️ **Issue Found & Fix:** the original request treats "single day" and "date range" as if they were alternatives to the weekly recurring model, but doesn't say what happens after a date-range habit's end date passes. **Fix:** date-range and single-day habits auto-archive (move to an "Ended" section, not deleted) once their window passes, but their historical logs remain visible in the contribution grid so streak history isn't lost.
- Reminder time (optional, per habit)

**Editing:** changing schedule type only affects future days; past logs are immutable history.

---

## 8. Feature Spec: Friend System

**Flow:**
1. User A searches for User B by exact `@username` (no public directory/browse — search-only, to avoid a stranger-harvesting problem).
2. Sends a friend request.
3. User B gets a notification, sees a request card with Accept/Decline.
4. On accept, a `Friendship` row is created with `status: accepted`, and a default `FriendPermission` row is created for **each direction** (A viewing B's data, and B viewing A's data) with the defaults in §9.
5. Either user can **unfriend** at any time (soft delete — removes access instantly, doesn't notify the other person to avoid awkwardness) or **block** (prevents future requests).

⚠️ **Issue Found & Fix:** the original idea implies one-directional sharing ("added friend can view my tracking data"), but if it's meant to be a mutual friendship (which "accepting" implies), both directions need their own permission row, since Person A might want to share their timer but not their mood, while Person B shares the opposite. Treat it as two independent permission sets, not one shared "friendship visibility" flag.

---

## 9. Privacy & Permission Model (critical section)

Per-friend, per-module toggles, editable any time from **Friends → [friend name] → Sharing settings**:

| Module | Default | User-editable? |
|---|---|---|
| Habit tracker + contribution grid | Visible | Yes |
| Timer sessions | Visible | Yes |
| Mood | Hidden | Yes |
| Period cycle | Hidden | **No — never shown to any friend, ever, under any setting** |
| Sticky note posting | Allowed if any module is visible | Yes, can be revoked independently |

⚠️ **Issue Found & Fix:** Period data is the one exception with no toggle to make it shareable. This isn't paternalism for its own sake — it's the one category of data in this app where a bug, a UI mis-tap, or a future feature that "shares everything by default" could out someone's medical status to a friend, coworker, or family member without a deliberate, unambiguous action. Keeping it structurally unshareable (no API path exists for it, not just hidden in the UI) means that failure mode is impossible rather than just unlikely. If you want a "share my mood/period with a partner" feature later, build it as a completely separate, explicitly-named "Health Sharing" flow with its own confirmation step — not as part of the general friend system.

**Blocking/unfriending must immediately revoke all sticky-note write access** and hide their historical sticky notes from view (soft-hide, not delete, in case of un-block later).

---

## 10. Feature Spec: Sticky Notes (Friend Comments)

- A friend viewing your Home page, Timer dashboard, or Mood calendar (whichever modules you've shared with them) can tap **"Leave a note"** and drop a draggable sticky note anywhere on that screen.
- Sticky notes store a relative `position_x/position_y` (0–1 range) so they stay roughly in place across different phone screen sizes, and optionally a `target_id` linking to the specific habit, day, or session they're commenting on — so if you rearrange your habit list, the note follows its subject instead of floating over the wrong habit.
- ⚠️ **Issue Found & Fix:** "sticky notes anywhere on the screen" as originally described has no data anchor, which means the note becomes meaningless once the underlying list re-sorts or the user adds/removes habits. **Fix:** every sticky note is anchored to a `target_type` + `target_id` (a specific habit, a specific date cell, a specific timer session) *in addition to* its free-form x/y offset — so it renders near where it was dropped, but re-attaches sensibly if layout shifts.
- Owner can delete any note on their own data; author can delete/edit their own note within 15 minutes of posting (then locked, like a light edit window).
- Push notification to the owner when a friend leaves a note.
- Notes are private between owner and that one friend — not visible to other friends (avoid a group-chat-on-your-data feeling unless you want that; if you want shared visibility among all friends, make it an explicit toggle later, not the default).

---

## 11. Feature Spec: Timer / Focus Page

- Big **Start Timer** button. Before starting, user types what they're about to do (free text, e.g. "Deep work: finish report").
- Running timer shows elapsed time, task text, and a **Stop** button. Optional pause.
- On stop, session is saved to `TimerSession` with total duration.
- **Friend-facing widget:** if timer sharing is enabled, friends see a compact card ("Budi is working on: Finish report — 42 min so far," live-updating if you're using realtime, or last-known state otherwise).
- Tapping that widget opens a **detailed dashboard**: today's total focus time, a bar chart of sessions by day (past 7/30 days), and a list of past session titles + durations.
- ⚠️ **Issue Found & Fix:** live real-time viewing of someone's active timer needs a decision on refresh strategy — a raw "live" feed is expensive and mostly unnecessary. **Fix:** update the friend-facing card on session start/stop and every 5 minutes while active, rather than sub-second live ticking; this is nearly indistinguishable to the friend and far cheaper to build/run.

---

## 12. Feature Spec: Mood Tracker

- On first app open **each day** (not every launch), show a light, dismissible prompt: "How are you feeling today?" with mood choices (e.g. 😄 😊 😐 😔 😣 — 5-point scale, optionally with a short label like "Great / Good / Okay / Low / Rough").
- ⚠️ **Issue Found & Fix:** "when I enter the app" read literally means every single app open, which would be an intrusive, naggy popup shown dozens of times a day. **Fix:** ask once per calendar day; if answered, don't ask again until tomorrow; always offer a small "skip today" so it's never a hard block, and let the user log/edit today's mood manually from the Mood page at any time even after skipping or answering.
- Optional short note attached to the mood entry.
- **Mood history widget:** a single-line horizontal calendar strip (like a heart-rate line or the contribution grid's cousin) showing the last ~30 days as small colored dots/segments, one per mood level, so a friend (if mood sharing is on) can see the shape of your mood over time at a glance without reading every entry.
- Friends never see the optional text note by default — only the mood level/color — unless the user separately opts to share notes too (another sub-toggle, off by default).

---

## 13. Feature Spec: Period Cycle Calculator (private, opt-in)

- Turned on only via Settings → Health → "Track period cycle" (not gender-gated — anyone can opt in, per §4's fix).
- Input: last period start date, typical cycle length (default 28, editable), typical period length (default 5, editable).
- App calculates and displays: predicted next period start, predicted fertile window, current cycle day.
- Simple calendar view, color-coded (period days, fertile window, predicted days).
- User can log actual period start each cycle to improve future predictions (rolling average of last 3–6 cycles).
- **Never exposed to any friend, in any widget, under any permission setting** (§9). No API endpoint should even accept a friend's ID as a viewer of this table — enforce it at the database/query layer, not just hidden in the UI, so a future bug can't accidentally leak it.
- Include a plain disclaimer in-app: predictions are estimates, not medical advice, and irregular cycles will reduce accuracy.

---

## 14. Additional Ideas Worth Adding

- **Streaks & milestones:** auto-detect streaks (7-day, 30-day, 100-day) and let the user optionally share a milestone card with friends (opt-in per event, not automatic).
- **Habit templates:** starter templates (Drink water, Read, Workout, Meditate) so onboarding's "create your first habit" step isn't a blank form.
- **Weekly recap notification:** "You completed 18/21 scheduled habits this week" — private, not shared.
- **Dark/light theme toggle** — your reference images show both aesthetics; support both rather than picking one.
- **Widget support (iOS/Android home-screen widgets):** the contribution grid and weekly habit card are natural candidates, mirroring image 2's actual OS-widget style.
- **Accessibility:** color-blind-safe palette option for the contribution grid (shape/pattern in addition to color).

---

## 15. Notification Types Needed

- Friend request received / accepted
- Sticky note left on your data
- Daily habit reminders (per-habit, if user sets a time)
- Mood check-in reminder (optional, user-controlled time, e.g. evening)
- Weekly recap
- (Period predictions can optionally notify the user privately — "Period expected in 2 days" — never a push that could be seen on a lock screen by someone else without the user opting into showing notification previews, which is an OS-level setting worth mentioning in onboarding.)

---

## 16. Screen Map

```
Onboarding: Welcome → Sign Up → Username → Avatar → Feature Opt-ins → 
            (Period details if opted in) → Notifications → First Habit → Home

Main tabs: [Home] [Timer] [Mood] [Friends] [Profile/Settings]

Home        → Contribution grid widget(s) → Weekly Habits card → Add Habit modal
            → Habit detail (tap a habit) → its own history + friend sticky notes
Timer       → Start/Stop → Session history → Detailed dashboard (charts)
Mood        → Today's check-in → Mood history strip → (Period sub-page if enabled)
Friends     → Friend list → Requests → Search/add → Per-friend sharing settings
Profile     → Edit profile → Privacy defaults → Data export → Delete account
```

---

## 17. Suggested Build Phases (for Claude Code)

**Phase 1 — Foundation**
- Auth, onboarding flow, username/avatar setup, basic navigation shell.

**Phase 2 — Core habit tracking**
- Habit CRUD, all 4 schedule types, weekly card UI, contribution grid widget, habit detail page.

**Phase 3 — Friends & permissions**
- Search/request/accept, `FriendPermission` model, per-friend sharing settings screen.

**Phase 4 — Sticky notes**
- Draggable note component, anchoring logic, notifications on new note.

**Phase 5 — Timer**
- Start/stop timer, session history, friend-facing widget, detailed dashboard with charts.

**Phase 6 — Mood tracker**
- Daily prompt logic (once/day), mood entry, history strip widget, friend visibility toggle.

**Phase 7 — Period cycle calculator**
- Opt-in settings, cycle input, prediction calendar, hard-enforced non-shareability.

**Phase 8 — Polish**
- Notifications, streaks/milestones, themes, accessibility pass, home-screen widgets.

---

## 18. Edge Cases Checklist (for QA)

- [ ] Un-friending mid-conversation removes sticky-note access immediately, doesn't retroactively delete history unless user chooses to.
- [ ] Single-day/date-range habits correctly archive and don't clutter the active list.
- [ ] Changing a habit's schedule doesn't rewrite past logs.
- [ ] Mood prompt respects timezone changes (traveling users shouldn't get double-prompted or skipped).
- [ ] Period data query paths are unit-tested to confirm no friend-facing endpoint can return them, even with a manipulated request.
- [ ] Blocking a user removes both directions of `FriendPermission` and hides both users from each other's search.
- [ ] Sticky note position renders sensibly on both small and large phone screens (relative coordinates, tested on at least 2 screen sizes).
- [ ] Deleting a habit doesn't orphan its sticky notes (either cascade-delete or reassign to a general "deleted habit" placeholder so friend comments aren't lost silently).

---

*End of spec. This document is meant to be read top to bottom by Claude Code before scaffolding the project — the ⚠️ sections are the parts most likely to cause rework if skipped.*
