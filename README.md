# ShalaTrack redesign

An isolated React + TypeScript frontend with a light lavender palette, a translucent app shell, and solid, readable forms and record tables. All new implementation files live in this directory. Original HTML, JavaScript, CSS and backend proposal files are reference-only.

## Run

```powershell
cd C:\Users\anant\OneDrive\Desktop\shalatrack-web\Redesign
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:5173/#/admin.html`. The administrator sample workspace opens by default. Sign out from the account menu to try the teacher preview. No real credentials are needed: use a sample email and any fictional password of six or more characters. Passwords are never saved.

Useful teacher emails: `teacher1@maplewood.example` (submitted periods), `teacher7@maplewood.example` (pending period 3), and `teacher12@maplewood.example` (no arrival record). Sample accounts are a role preview, not authentication. The school switcher changes the fictional school context.

```powershell
npm run build
npm test
npm run test:render
node scripts/verify-isolation.mjs
```

## Implemented frontend

- All 39 original destinations have React routes, including login, administrator and teacher pages. Four added routes provide timetable editing, academic years, attendance corrections and the rotating QR display.
- Student, teacher, class and subject lists, search, filters, forms, duplicate checks, archive/restore and simulated teacher invitations.
- Timetable class/teacher conflict checks; per-period attendance with frozen rosters, explicit marks, locked submissions and administrator-approved corrections.
- Rotating QR images and local token validation, an optional QR camera flow with manual-token fallback, teacher check-in history and reasoned administrator exceptions.
- Versioned fee structures, assessment snapshots, installment allocation, concessions, manual cash/UPI/bank entries, immutable receipt snapshots and full compensating reversals. Amounts use integer paise.
- School/recipient-specific notices, announcement preview, consent-aware simulated broadcast jobs and deduplicated daily absence alerts.
- Student, teacher, class and period reports; PDF and Excel exports; daily PDFs and monthly attendance registers.
- School and teacher profiles, local audit history, page search, notification links and phone drawer navigation.

See `docs/PAGE_COVERAGE.md` for the full page mapping and `docs/REVIEW.md` for verification and limitations.

## Data and backend boundary

The demo uses two fictional schools: Maplewood (200 students) and Riverdale (180 students), with eight periods per school day. The reproducible sample day is Monday, 2 November 2026. Additional dates can be selected in attendance and reports.

`src/domain/model.ts` defines typed records. `src/domain/operations.ts` holds attendance, payment and QR rules. `src/data/seed.ts` creates fictional records. `src/data/WorkspaceStore.tsx` owns local commands and checks that a command does not modify other-school records. Future integration should replace these local commands with server-authorized API calls matching the backend proposal.

Workspace records use only `shalatrack-redesign-workspace-v2` in localStorage. Preview identity uses `shalatrack-redesign-preview-session-v1` in sessionStorage. The account menu's **Reset sample data** action resets these fictional workspace records. It does not clear original application storage.

No Firebase/Supabase SDK, real authentication, payment gateway, messaging provider or email service is initialized. QR verification is a browser simulation, not secure production attendance verification. The camera requires browser support and permission; unsupported browsers can paste a sample token. Cross-tab QR demonstrations share this origin's local data; concurrent editing is not production-safe.

Fonts and icons are bundled locally. The connection policy is restricted to this origin and development WebSockets. `original-files.sha256.json` preserves the original-file baseline.

## Design review

Better Design verification was explicitly waived by the user on 1 November 2026 after its quota was exhausted. No Better Design approval, spacing score or VALID dashboard receipt is claimed. The initial shell/dashboard received local browser checks before this continuation. The subsequent browser attempt was rejected by the browser URL policy, so final visual and interaction review of the expanded pages remains pending.

The generated component registry is under `src/components/ui`; only imported components are compiled into the app. Unused registry examples have not been certified. Its older date picker is unused and requires compatibility work before adoption. Excel and PDF libraries are loaded only on export; Excel's lazy chunk is comparatively large.
