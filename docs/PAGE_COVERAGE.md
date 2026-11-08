# Page and feature coverage

All 39 original destinations have React implementations. The four backend-aligned additions are implemented with local sample data. UI actions do not call production services. Better Design verification was waived by the user; final browser review of the expanded pages remains pending.

| Original route | Page | Frontend features |
| --- | --- | --- |
| `index.html` | Sign in | Admin and teacher roles; Email and password; Password visibility |
| `admin.html` | School overview | School overview; Student attendance; Module shortcuts; Teacher attendance; Recent activity |
| `students.html` | Students | Student search; Class filter; Student count; Add and edit student |
| `add-student.html` | Add student | Admission number; Name and gender; Class and section; Guardian name and mobile; Validation |
| `edit-student.html` | Edit student | Edit student details; Save changes; Archive and restore confirmation |
| `teachers.html` | Teachers | Teacher search; Active teachers; Add and edit teacher |
| `add-teacher.html` | Add teacher | Employee code; Name and gender; Mobile and email; Account invitation replacing administrator-set passwords |
| `edit-teacher.html` | Edit teacher | Edit teacher details; Reset invitation; Archive and restore confirmation |
| `classses.html` | Classes | Class and section search; Academic year; Class teacher; Student count; Add and edit class |
| `add-class.html` | Add class | Grade; Section; Academic year; Class teacher |
| `edit-class.html` | Edit class | Edit class; Save changes; Archive confirmation; preserve history |
| `subjects.html` | Subjects | Subject search; Code; Class; Teacher assignment; Add and edit subject |
| `add-subject.html` | Add subject | Name; Code; Class and section; Assigned teacher; Save subject |
| `edit-subject.html` | Edit subject | Edit subject; Save changes; Archive and restore confirmation |
| `attendance.html` | Teacher attendance | Attendance date; Teacher statuses; Refresh; QR verification context |
| `fee-dashboard.html` | Fee overview | Assessed fees; Collections; Outstanding balances; Class, category and status filters; Record payment |
| `fee-structure.html` | Fee structure | Academic year; Class and fee category; Payment schedule; Installments; Fee totals |
| `fee-collection.html` | Collect fees | Student lookup; One-time payable setup and locked discount; Category allocations; Cash, UPI and bank reference; Payment date; Print receipt |
| `fee-history.html` | Fee history | Search; Class, payment mode and date filters; Payment details; Receipt lookup |
| `notices.html` | Notices | Notice list; Audience; Published date; Create notice |
| `create-notice.html` | Create notice | Title and message; All or selected teachers; Publish confirmation |
| `whatsapp.html` | WhatsApp broadcast | Subject and message; Recipient count; Message preview; Send confirmation; Delivery results |
| `reports.html` | Reports | Report categories; School totals; Links to detailed reports |
| `attendance-reports.html` | Attendance reports | Search and status filters; Period attendance coverage; PDF and Excel exports |
| `class-reports.html` | Class reports | Class search and filter; Academic-year filter; Class summaries; PDF and Excel exports |
| `student-reports.html` | Student reports | Student directory; Gender and class filters; Guardian contacts; PDF and Excel export |
| `teacher-reports.html` | Teacher reports | Teacher directory; Gender and class filters; Contact and assignment details; PDF and Excel exports |
| `profile.html` | School profile | School details; Administrator identity; Sign out |
| `teacher-screens/teacher-dashboard.html` | Teacher dashboard | Assigned classes and subjects; Attendance shortcuts; Notices; Profile |
| `teacher-screens/assigned-classes.html` | Assigned classes | Class search; Class roster; Attendance shortcut |
| `teacher-screens/assigned-subjects.html` | Assigned subjects | Subject search; Classes; Teaching assignment |
| `teacher-screens/self-attendance.html` | My attendance | Arrival check-in; Rotating QR scan replacing self-selected status; Verification result |
| `teacher-screens/student-attendance.html` | Student attendance | Class, date and period selection; Student search; Mark all present or absent; Explicit roster validation; Submit confirmation |
| `teacher-screens/attendance-history.html` | Attendance history | Search; Class and period history; Submission details |
| `teacher-screens/absent-alerts.html` | Absence alerts | Class and student search; Refresh; Individual and bulk simulation; Progress and notification status |
| `teacher-screens/reports.html` | Teacher reports | Class selection; Daily PDF; Monthly register preview and export; Period coverage |
| `teacher-screens/teacher-notices.html` | Teacher notices | Authorized notice list; Notice dialog; Notice details |
| `teacher-screens/notice-details.html` | Notice details | Full notice; Audience and date; Back navigation; Print |
| `teacher-screens/teacher-profile.html` | Teacher profile | Profile details; Assigned subjects and classes; Sign out |

## Backend-aligned additions

| Route | Page | Frontend features |
| --- | --- | --- |
| `timetable` | Timetable | Academic year; Period slots; Teacher assignments; Schedule conflicts |
| `academic-years` | Academic years | Current year; Year dates; Closed-year history |
| `attendance-corrections` | Attendance corrections | Requested changes; Reasons; Approval and revision history |
| `qr-display` | School check-in screen | Rotating QR challenge; Expiry; Sample display status; production registration pending |

Hard-delete actions are represented by reversible archive/restore flows to preserve history. Administrator-set teacher passwords are replaced by simulated invitations/resets. QR check-in replaces self-selected teacher status as agreed. Broadcast delivery and authentication remain simulations. PDF/Excel exports are generated locally.
