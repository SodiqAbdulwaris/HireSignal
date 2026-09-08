# High — sign-in/register tabs share unreset form state, silently corrupting passwords

**Evidence:** `frontend/src/pages/AuthPage.jsx:18` holds one `form` state object (`{ email, password, fullName, role }`) shared by both the Sign in and Create account tabs. `switchTab()` (line 36) resets `error`, `successMsg`, and the resend-verification UI on tab change, but never resets `form`. Reproduced live against a real local backend on 2026-09-08: typed an email and password into Sign in, got "Invalid email or password", switched to Create account, typed a *different* password into the already-populated password field without clearing it first, and submitted. Querying the created user directly confirmed the stored (bcrypt-hashed) password was the literal concatenation `password123AuditPass123!` — both attempts' text, silently joined, because the input already contained the old value and the new keystrokes were inserted rather than replacing it.

**Impact:** The password field is masked (`type="password"`), so a user has no visual way to notice the field wasn't empty before they typed. Anyone who mistypes a password on Sign in, then switches to Create account (or vice versa) to register instead, is at real risk of registering with a corrupted password that doesn't match what they think they set — indistinguishable from "I forgot my password" on their very first login attempt, with no error pointing at the actual cause. The same leak applies to `email` and `fullName`, so a partially-typed name or email can carry over just as invisibly.

**Recommendation:** Reset `form` to its empty default inside `switchTab()` alongside the other UI-state resets, or scope `form` per-tab (two separate state slices) so switching tabs can never carry stale field values into a different submit. Add a regression test that types into one tab, switches, and asserts the other tab's fields start empty.

**Owner:** frontend maintainer. **Priority:** before public deployment — this affects the registration/sign-in flow every user goes through.

**Status (2026-09-08): Fixed.** `switchTab()` now resets `form` to its
empty defaults alongside the other UI-state resets it already
performed. Verified with a regression test and, live, by re-running
the exact repro against the running dev stack.
