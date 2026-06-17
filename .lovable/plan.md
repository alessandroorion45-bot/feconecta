

## Plan: Fix Critical Bugs and Improve UX

### Root Cause Analysis

**1. TRIGGERS STILL NOT IN DATABASE (CRITICAL)**
Despite two migration files creating triggers, `<db-triggers>` confirms "There are no triggers in the database." The migrations were either not applied or silently failed. This is the root cause of:
- Friend requests not generating notifications for the receiver
- Accepted requests not auto-creating friendships at DB level
- No notification on new messages, likes, comments, etc.

**Fix:** Re-run trigger creation via a new migration.

**2. HEADER: NotificationPanel Popover clipped by `overflow-x-auto`**
Line 247 of Header.tsx: the desktop nav has `overflow-x-auto` which creates a new stacking context and clips the Popover dropdown from NotificationPanel. The popover renders inside the scrollable nav, so it gets cut off.

**Fix:** Move NotificationPanel OUT of the scrollable `<nav>` into the right-side action bar (alongside Profile/Logout buttons), where there's no overflow clipping.

**3. DUPLICATE NOTIFICATION REQUESTS**
Network logs show notifications being fetched twice at the same timestamp. This happens because `useNotifications()` is called in Header (line 15) AND NotificationPanel also calls it. The Header only uses `unreadCount` but the hook runs the full load + realtime setup. On mobile, both the mobile sheet and desktop nav are rendered (just hidden via CSS), so the hook runs twice.

**Fix:** Remove `useNotifications()` from Header.tsx -- let NotificationPanel be the sole consumer. The unread badge on the Bell button is already handled inside NotificationPanel.

**4. FRIENDS PAGE TIMEOUT**
The `loadData` function runs ~6 parallel/sequential queries with 15s individual timeouts. On cold Supabase instances or slow connections, this chain exceeds tolerance and shows "Erro ao carregar." The `FriendSuggestions` component adds 5+ more queries on top.

**Fix:** Increase timeout to 20s, defer FriendSuggestions loading with a 1s delay after main data loads, and wrap the entire loadData in a single try/catch that shows partial data on partial failure instead of blanking everything.

**5. MOBILE MENU LACKS POLISH**
The Sheet menu is a flat list of 20+ buttons with no visual grouping, no active state indication, and no transition feedback.

**Fix:** Add section headers with dividers, active route highlighting via `useLocation`, hover/active background transitions, and icon color coding by category.

---

### Changes

#### 1. SQL Migration: Re-create ALL triggers
New migration with same content as the existing one (DROP IF EXISTS + CREATE for all ~30 triggers). This will succeed even if triggers somehow exist.

#### 2. Header.tsx -- Fix notification clipping + menu polish
- Remove `useNotifications()` import from Header (line 7, 15) -- eliminates duplicate hook call
- Move NotificationPanel and PushNotificationToggle from inside the `<nav>` (lines 290-295) to the right-side action bar (before Profile button)
- Add `overflow-visible` to the container holding notifications so Popover isn't clipped
- **Mobile menu improvements:**
  - Add section labels ("Principal", "Ferramentas", "Comunidade", "Conta")
  - Add active route highlighting using `useLocation()`
  - Add subtle left border accent on active items
  - Group related items with visual separators

#### 3. Friends.tsx -- Increase resilience
- Increase `QUERY_TIMEOUT_MS` from 15000 to 20000
- Defer `FriendSuggestions` render with a state flag that activates 1s after main data loads
- Ensure `loadData` catches individual query failures without blocking the entire page

#### 4. NotificationPanel.tsx -- No changes needed
Already works correctly as sole consumer of the hook.

---

### Technical Details

**Header notification move (before/after):**
```
BEFORE: <nav overflow-x-auto> ... <NotificationPanel/> ... </nav>
AFTER:  <nav overflow-x-auto> ... links only ... </nav>
        <div> <NotificationPanel/> <Profile/> <Logout/> <Menu/> </div>
```

**Mobile menu grouping:**
```
── Principal ──
  Bíblia, Depoimentos, Orações, Eventos, Feed, Chat, Amigos
── Ferramentas ──
  Quiz, Desafios, Conquistas, Ranking
── Estudo & Louvor ──
  Devocional, Estudos, Louvores, Perguntas, Dicionário
── Comunidade ──
  Leitura em Grupo, Comunidade da Igreja, Mentoria, Igrejas Próximas
── Conta ──
  Notificações, Favoritos, Perfil, Sair
```

### Files to modify
1. New SQL Migration -- re-attach all triggers
2. `src/components/Header.tsx` -- fix notification clipping, remove duplicate hook, improve menu
3. `src/pages/Friends.tsx` -- increase timeout, defer suggestions

874305085520-6lkqp7m4jbn9u8m48b1e90v97nps3ca4.apps.googleusercontent.com