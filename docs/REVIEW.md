# Frontend review

Date: 1 November 2026. Scope: the isolated local sample-data redesign.

## Review authorization

The user explicitly requested: **"Bypass the better design verification and continue"**. This overrides the earlier Better Design verification gate for this work. Its review APIs previously returned quota exhaustion. No formal Better Design score, public preview capture or VALID receipt is claimed. The site was not published.

## Verification

- TypeScript compilation and the Vite production build pass.
- Twelve domain/export tests pass. They check school-scoped attendance, missing-versus-absent semantics, frozen-roster reconciliation, complete/unique attendance marks, excused denominators, all 39 original routes plus four additions, exact payment allocation, overpayment rejection, noncash references, reversals, QR expiry/school matching, readable Excel output and PDF pagination.
- `scripts/verify-isolation.mjs` checks the original-file hashes and absence of production provider endpoints. Run it at handoff; the baseline contains 79 original files.
- The initial shell, dashboard, login, search, school switching and phone navigation had local browser verification at widths 390, 1440 and 1728 before the expanded workflows were added.
- During this continuation the browser tool rejected the localhost URL under its URL policy. No alternate browser or automation workaround was used. Final screenshots, phone geometry, camera interaction and end-to-end clicks for the expanded workflows have **not** been verified.

The Node server-render smoke test passes for all 43 route components. Existing-record editor rendering is also checked. These checks are separate from visual or browser interaction testing.

## Code review corrections

- Canonical notice records now supply notification links and dashboard notice activity.
- Dashboard payment activity and school counts use the local workspace. Attendance overview is scoped to the fixed sample day.
- Attendance-history links carry class, date and period, and snapshot ownership is checked before loading.
- Closed-year attendance/payment changes are rejected. Submitted marks require a version-checked correction approval. Missing marks are not auto-absent.
- Payments allocate integer paise and record the receipt, payment and ledger change together. Repeated confirmation uses the same operation ID; reversals retain original receipts.
- QR validation checks current token, expiry and school. Camera access has an explicit action, unsupported-browser fallback and track cleanup.
- Excel's CommonJS default export is handled explicitly. Spreadsheet formula-like values are stored as text. PDF tables repeat headers and paginate long content.
- School commands clone local state and reject changes to another school's records. This is a preview guard, not server-side tenant security.

## Manual acceptance checklist

1. Open the administrator preview and inspect the dashboard and all module pages at desktop and phone widths.
2. Add/edit/archive/restore a fictional student. Try a duplicate admission number.
3. Open a student fee account, record a cash payment, inspect/download its receipt, reject an overpayment and reverse a payment with a reason.
4. Sign in as `teacher7@maplewood.example`, load period 3, mark the roster, submit, then request a correction. In the admin preview approve it and compare reports.
5. Open the QR display, then use `teacher12@maplewood.example` to try a current sample token. Test camera permissions manually if supported.
6. Publish a specific-teacher notice and confirm its recipient view. Simulate broadcasts/absence alerts and confirm they remain labelled simulated.
7. Export filtered PDF/Excel reports and a monthly register. Check the school switcher, global search, empty states and local reset.

## Production integration remaining

Actual authentication/role authorization, database tenant isolation, protected registered displays, signed/one-time QR redemption, server idempotency/transactions, audit integrity, provider delivery and settlement verification belong to the future backend. The local preview is not a substitute for these controls. Original backend proposal files remain unchanged.

## Original workflow restoration — 8 November 2026

Restored the original fee collection structure and two-step payable/discount lock, category status, installment dialog and receipt totals. Original student/teacher/class directory filters and export columns, monthly register preview, class-teacher visibility, explicit subject-assignment replacement, senior-secondary streams, planned-year preparation, individual absence alerts and progress have been restored. Added Vercel rewrites for original HTML URLs. Sample sign-in now requires a known active teacher/admin identity and does not enter the administrator workspace automatically; school context survives reload. Existing demo concessions migrate without being credited again.

The 17 domain/export checks cover payable setup, zero discount, repeat rejection, assignment replacement and legacy local-data migration in addition to prior rules. Route-render checks include restored fee stages, report fields, streams and future years. The production build and original-file isolation check are required before handoff.

Browser visual/interaction verification remains unavailable following the earlier browser URL-policy rejection; no workaround or successful visual review is claimed. The local interface still uses the fixed fictional demo day and simulated services, with per-period attendance, QR arrival and reversible archives retained as agreed.

## Class-wise fee overview

Implemented the new reference layout with cumulative grade/class rows across sections and URL-based student drill-down. Twenty domain/export tests cover aggregation, student/class/school reconciliation, discount and reversal accounting, year/school isolation and zero-payable statuses. A route-render check verifies the default class list and the student breakdown. Actual browser visual/interaction checks remain unavailable under the earlier URL-policy block.
