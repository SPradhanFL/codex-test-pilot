# Time & Attendance Multi-Context Coverage Decision

## Purpose

Record how the supplied multi-role/multi-organization Gherkin was reconciled with the executable repository suite, current Jira work, and the Time & Attendance one-to-many role-mapping design. This is a scope decision, not an executable scenario file.

## Authoritative product and suite findings

- A selectable entry is a combined application, role/identity, and organization context. A changed selector label alone is not proof that the destination switched.
- Absence and Time assignments that share an IDM role identifier must remain distinct application-qualified mappings.
- The same role type may legitimately appear more than once for distinct identities or organizations; each executable entry needs a stable visible differentiator.
- Organization, role, permissions, and read-only content must be validated together after every switch to prevent cross-context contamination.
- Organization-only routes remain prohibited for Campus User, Employee, and Substitute contexts.
- The suite is Markdown-driven browser execution, read-only by default, with configured non-production accounts, full-browser screenshots, one continuous video, sanitized navigation evidence, and independent results.

## Supplied scenario disposition

| Supplied sections | Decision | Repository coverage |
|---|---|---|
| 1, 7, 14, 15, 20, 24, 27, 29, 34 | Consolidated and required | Scenarios 40, 41, 43, and 44 validate inventory, unique repeated-role identities, role/org availability, forward/back switching, return consistency, and isolation. |
| 2, 9, 17, 22, 36, 38, 40 | Consolidated and required | Existing scenarios 29-32 cover each role's ordinary TA -> AM -> TA path; new scenarios 42 and 45 specifically validate the newly selected role/org after a switch. |
| 3, 4, 5, 10, 11, 12, 18, 21, 23, 25 | Already covered or routed per context | Scenarios 20, 33, 34, and 35 plus the controller role matrix cover authorized Report Writer, Manage User Access, View in AM, and role restrictions. The same authorized set is repeated separately in every discoverable role/org context. |
| 6, 13, 37 | Consolidated and required | Existing scenarios 36-39 validate per-role logout; new scenario 46 validates logout after multiple context changes. |
| 16, 19 | Partially required | Observable navigation restrictions are checked in scenario 41. Guessed restricted URLs, assumed Employee report access, and an assumed globally read-only Substitute model are excluded unless product requirements/configuration define them. |
| 26, 30, 33 | Not executable in this browser-navigation suite | Session-expiry and in-flight loading races need a deterministic session/latency control harness. They must not be simulated with arbitrary waits or reported as passing from an unforced timeout. |
| 28 | Not required for this suite | Form/wizard switching would require a configured safe form and a documented unsaved-changes contract. The current TA suite is read-only and does not invent Save/Discard/Cancel behavior. |
| 31 | Required in supported form | Scenario 44 verifies strict isolation and browser-history safety using non-sensitive read-only proof; broad inspection of cached personal data is prohibited. |
| 32, 35 | Data-provisioning/integration coverage, not routine UI smoke | Inactive orgs, recently deactivated orgs, and assignments with no valid role require controlled provisioning or API/event setup. An unavailable selector entry is not enough to prove the backend lifecycle rule. |
| 39 | Rejected as written | An oracle that accepts either TA retaining Org A or inheriting Org B cannot produce a meaningful PASS. Scenarios 42 and 45 instead require preservation of the explicitly selected pre-switch context; change this only when a product requirement defines shared cross-product context propagation. |

## Additional coverage added beyond the supplied file

1. Application-qualified separation when Absence and Time share an IDM role identifier.
2. Stable differentiation and independent execution of repeated same-type role identities.
3. Selector-versus-destination proof to catch a changed label with stale loaded context.
4. Browser-history isolation after an organization change.
5. Sanitized console and HTTP 404 comparison across cross-product context transitions.

## Additional non-UI coverage still recommended

The reviewed one-to-many mapping plan contains integration behavior that cannot be proven by this browser-navigation suite. Add a separate API/event/migration suite for:

1. manual and automatic migration with Shared Staff Directory both enabled and disabled;
2. the supported five-role boundary, including repeated same-type identities;
3. add, delete, ungrant, and recreate lifecycle behavior, including a new ID on recreation where required;
4. idempotent retry, duplicate/collision rejection, missing application, unknown role, and organization-mismatch errors;
5. unique `(application, role, identity, organization)` mapping and non-mixing of Absence versus Time Morpheus role IDs in persisted data and event payloads; and
6. correlation-ID/log evidence for partial sync failure and recovery.

Consortia migration remains separate until its documented development dependencies are complete. Morpheus-origin grant/ungrant synchronization that the source plan marks On Hold must not be reported as passing.

## External references reviewed

- Confluence: [E2E Test Plan - One to Many Role Mappings For Time and Attendance](https://frontlinetechnologies.atlassian.net/wiki/spaces/PRO/pages/39076233222/E2E+Test+Plan+-+One+to+Many+Role+Mappings+For+Time+and+Attendance).
- Confluence: [Design Document: Separation of Absence and TA for One-to-Many Role Mappings in Morpheus](https://frontlinetechnologies.atlassian.net/wiki/spaces/PRO/pages/39084130701/Design+Document+Separation+of+Absence+and+TA+for+One-to-Many+Role+Mappings+in+Morpheus.).
- Confluence: [Morpheus Native: Master Test Strategy and Test Plan](https://frontlinetechnologies.atlassian.net/wiki/spaces/PRO/pages/39910113801/Morpheus+Native+Master+Test+Strategy+and+Test+Plan).
- Jira: [HCMAT-79893](https://frontlinetechnologies.atlassian.net/browse/HCMAT-79893), multi-organization role-based validation and reporting.
- Jira: [HCMAT-79725](https://frontlinetechnologies.atlassian.net/browse/HCMAT-79725), AM/TA below-the-line navigation automation.
- Jira: [HCMAT-79693](https://frontlinetechnologies.atlassian.net/browse/HCMAT-79693), cross-application navigation, validation, and logout automation.

These references inform scope. The live accessible UI, selected organization configuration, approved host policy, role authorization matrix, and observable evidence remain execution authority.
