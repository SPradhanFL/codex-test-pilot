# Employee General Information Validation — Execution Report

- Scenario: `employee-general-Info_Validate`
- Started: `2026-08-11 17:59:00 +05:30`
- Finished: `2026-08-11 18:09:19 +05:30`
- Environment: `https://aesstage.flqa.net`
- Approved authentication host: `https://idgatewayawsstage.flqa.net`
- Overall status: **FAIL**

## Summary

Authentication, navigation, Add Employee access, valid-value entry, required-field alerting, keyboard focus, and cancellation all worked. Several invalid values were accepted by the controls without immediate validation feedback, including malformed email, impossible or inconsistent dates, alphabetic values in numeric-looking fields, and a non-leap-year February 29. Typed text also exceeded the input controls' declared maximum lengths. No employee record was saved.

## Step results

| Step | Action | Expected result | Actual result | Status |
|---:|---|---|---|---|
| 1 | Open AES Stage in Chrome. | Login page shows username and password controls. | The approved authentication host displayed both controls. | **PASS** |
| 2 | Enter the configured username. | Username field contains the configured value. | Username was accepted and displayed. | **PASS** |
| 3 | Enter the runtime-supplied password without recording it. | Password is populated without exposing it in project artifacts. | Password was entered and was not written to this report or the scenario file. | **PASS** |
| 4 | Sign in. | AES Stage home page and `Master Data` are visible. | Web Navigator loaded at the AES Stage application and `Master Data` was visible. | **PASS** |
| 5 | Navigate `Master Data` → `Employee` → `General Information`. | Employee General Information selection page is displayed. | Employee selection page displayed successfully. | **PASS** |
| 6 | Confirm `Add Employee`. | Link is visible. | `Add Employee` was visible. | **PASS** |
| 7 | Open `Add Employee`. | General Information form and `Apply Changes` are visible. | Add form opened and both `Apply Changes` and `Cancel` were visible. | **PASS** |
| 8 | Inspect the form structure. | Fields, required markers, types, and actions are observable. | Controls were mapped. Required UI fields included First Name, Last Name, Identifier, Employee Type, School, Phone/PIN indicators, and declared constraints. | **PASS** |
| 9 | Enter valid synthetic employee values. | Valid values are accepted. | First/Last Name, Identifier, Employee Type, Email, School, Gender, dates, Phone, and PIN displayed the intended values. | **PASS** |
| 10 | Validate the documented valid dates. | Valid date sequence is accepted. | `09/24/2019`, `09/25/2020`, and `03/05/1993` were accepted. | **PASS** |
| 11 | Validate valid Email, Phone, PIN, and Identifier. | No immediate format error. | All documented valid values were accepted. | **PASS** |
| 12 | Avoid submitting the complete valid form. | No employee is created. | The complete valid form was not submitted. | **PASS** |
| 13 | Trigger validation with required values missing. | Required-field validation prevents creation. | An alert was observed and the browser remained on the unsaved Add Employee form. | **PASS** |
| 14 | Enter malformed email `invalid-email`. | Value is rejected or clear validation feedback appears. | The text control accepted the malformed email and no email-specific feedback was observable during the safe incomplete-form test. | **FAIL** |
| 15 | Enter a non-date value. | Value is rejected or clear validation feedback appears. | A separate safe submit-level result could not be isolated without risking record creation. | **NOT TESTED** |
| 16 | Enter impossible date `02/30/2020`. | Impossible date is rejected or flagged. | The control accepted and displayed the impossible date without immediate feedback. | **FAIL** |
| 17 | Enter Start `09/25/2020` and End `09/24/2020`. | Invalid range is rejected or flagged. | Both values were accepted without immediate feedback. | **FAIL** |
| 18 | Enter alphabetic Phone, PIN, and Identifier values. | Unsupported characters are blocked or flagged. | The controls displayed alphabetic values without immediate feedback. | **FAIL** |
| 19 | Enter leading/trailing spaces in Last Name. | Handling is consistent and recorded. | Spaces were preserved in the control (`  Emp_Auto_7618  `). | **PASS** |
| 20 | Enter one-character or one-digit values. | Controls remain stable and enforce any minimum constraints. | One-character/digit values were accepted and the page remained stable; no immediate minimum-length feedback appeared. | **PASS** |
| 21 | Type beyond declared maximum lengths. | Maximum length is enforced or behavior is safely bounded. | Values exceeded declared limits: First Name 40/30, Email 72/50, Phone 20/10, and PIN 10/5 (typed length/declared maximum). | **FAIL** |
| 22 | Enter special characters in name and phone fields. | Supported input is accepted or clearly rejected without instability. | `O'Neil-Test` and a formatted phone value were accepted; the page remained stable. | **PASS** |
| 23 | Test `02/29/2020` and `02/29/2019`. | Leap date accepted; non-leap date rejected. | Both values were accepted without immediate feedback. | **FAIL** |
| 24 | Tab from First Name. | Focus moves logically. | Focus moved from First Name to Middle Name. | **PASS** |
| 25 | Confirm environment and responsiveness. | AES Stage Add Employee page remains responsive. | The page remained responsive on the AES Stage application. | **PASS** |
| 26 | Cancel without saving. | No employee is created. | `Cancel` returned to the Employee selection page and `Add Employee` was visible. | **PASS** |

## Observed control constraints

| Control | Declared maximum | Observed typed length |
|---|---:|---:|
| First Name | 30 | 40 |
| Email | 50 | 72 |
| Phone Number | 10 | 20 |
| Phone PIN | 5 | 10 |

## Safety and cleanup

- No valid completed employee form was submitted.
- No employee record was created or modified.
- The unsaved Add Employee form was cancelled.
- No cleanup record is required.
- No password, token, cookie, or browser-session secret is included.
- No screenshot files were saved for this run.
