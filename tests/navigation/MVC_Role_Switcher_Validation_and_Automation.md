# Complete MVC Pages Validation and Automation

## Test Summary

| Field | Details |
|---|---|
| Application | AES Stage |
| Base URL | https://aesstage.flqa.net/ |
| Validation date | 14 August 2026 |
| Test account | `report_139963` |
| Credential handling | The password is intentionally excluded. Store it as a secure environment variable. |
| Scope | Validate every identified MVC page, navigation between pages, key read-only controls, and the role/profile menu. |
| MVC page result | **PASS - all 3 identified MVC pages loaded and their tested functions worked** |
| Employee scenario | **BLOCKED - the supplied account is displayed as Organization User, not Employee** |

## Important Result 

The application accepted the supplied credentials, but the authenticated header displayed:

```text
Report 139963 - Organization User
```

Therefore, the MVC pages and role/profile menu were validated successfully for the supplied **Organization User** account. The specific requirement to perform the same validation **as an Employee** cannot be marked as passed until an Employee-role account is supplied.

## Complete Page-by-Page Validation

| # | Page | Route used | Validations performed | Result |
|---|---|---|---|---|
| 1 | Import Data / Upload Files | `/mvc.aspx/dataimport` | Page title and heading loaded; object-type list loaded; Choose File, Add File, Next, and Status Summary controls were present; role/profile menu opened; no console errors. | **PASS** |
| 2 | Import Status | `/mvc.aspx/dataimport/status` | Status table loaded; completed records were visible; View imports from all users filter toggled and was restored; Details links loaded; New Import link worked; role/profile menu opened; no console errors. | **PASS** |
| 3 | Import Status Detail | `/mvc.aspx/dataimport/StatusDetail/1151394` | Real import details loaded; status, submission data, file summary, object counts, error count, file-download link, New Import, and Return to Status Summary were present; role/profile menu opened; no console errors. | **PASS** |

## Supporting Route Validation

| Finding | Validation evidence | Result |
|---|---|---|
| Status pagination | `/mvc.aspx/dataimport/Status/0/2` loaded older records and displayed working `<Newer` and `Older>` links. | **PASS** |
| Download action | The detail page exposed `/mvc.aspx/Download?...` for the imported file. The route/link was verified without downloading the potentially sensitive data file. | **PASS - link verified** |
| Navigation menu | Expanding **Extract / Import** displayed **Import Data** and **Import Status**, with routes matching the identified MVC pages. | **PASS** |
| Cross-page navigation | `New Import -> Status Summary -> Details` successfully navigated through all three MVC pages. | **PASS** |

## Role/Profile Menu Validation on All Pages

The user button was opened separately on every identified MVC page.

| MVC page | Button displayed | Menu state | Menu content | Result |
|---|---|---|---|---|
| Import Data | `Report 139963 - Organization User` | Active/open | Your Frontline Account, Account Settings, Sign Out | **PASS** |
| Import Status | `Report 139963 - Organization User` | Active/open | Your Frontline Account, Account Settings, Sign Out | **PASS** |
| Import Status Detail | `Report 139963 - Organization User` | Active/open | Your Frontline Account, Account Settings, Sign Out | **PASS** |

No Employee role or role-switch option appeared in the opened menu. This is a test-data/account-role issue, not a failure of the menu to load.

## Detailed Findings

### 1. Import Data / Upload Files

**Page title:** `Web Navigator (139963) Select Import Files`  
**URL:** `https://aesstage.flqa.net/mvc.aspx/dataimport`  
**Navigation:** Extract / Import -> Import Data

Validated controls:

- Upload Files heading
- Status Summary link
- Object Type selection
- Employee, Org/Campus User, School, Substitute, Vacancy Profile, and Reference Data import options
- Choose File button
- Add File button
- Next button
- Shared application navigation and profile menu

No file was uploaded because creating an import was outside this read-only validation.

### 2. Import Status

**Page title:** `Web Navigator (139963) Import Status`  
**URL:** `https://aesstage.flqa.net/mvc.aspx/dataimport/status`  
**Navigation:** Extract / Import -> Import Status; or Import Data -> Status Summary

Validated controls and data:

- Import Status heading
- New Import link
- View imports from all users filter
- Status grid columns and completed import records
- Details links
- Older/Newer pagination
- Shared application navigation and profile menu

The filter was toggled successfully and restored to its original checked state.

### 3. Import Status Detail

**Page title:** `Web Navigator (139963) Import Status`  
**Validated URL:** `https://aesstage.flqa.net/mvc.aspx/dataimport/StatusDetail/1151394`  
**Navigation:** Import Status -> Details

Validated controls and data:

- Import Status Detail heading
- Import number `1151394`
- Completed status
- Submitted timestamp and submitter information
- File count and imported-file link
- Object Details table
- Total, New, Changed, Removed, No Change, and Error counts
- Error Details summary
- New Import link
- Return to Status Summary link
- Shared application navigation and profile menu

## Final Manual Test Status

| Requirement | Status | Reason |
|---|---|---|
| Login using the supplied credentials | **PASS** | Authentication succeeded. |
| Confirm all three identified MVC pages load | **PASS** | All routes, headings, and main content loaded. |
| Confirm navigation between all MVC pages | **PASS** | New Import, Status Summary, and Details navigation worked. |
| Confirm role/profile menu loads on all pages | **PASS** | The menu became active and displayed account options on every page. |
| Confirm browser-console health | **PASS** | No console errors were observed during the validation. |
| Validate specifically as Employee | **BLOCKED** | The application identifies this account as Organization User. |

## BDD Automation Scenarios

```gherkin
Feature: MVC import pages and role switcher

  Background:
    Given an authorized user is logged in to AES Stage

  Scenario Outline: Role menu loads on each MVC page
    When the user navigates to the "<page>" MVC page
    And the user opens the profile role menu
    Then the profile role menu should be visible
    And the menu should display "Your Frontline Account"
    And the menu should display "Account Settings"
    And the menu should display "Sign Out"

    Examples:
      | page                 |
      | Import Data          |
      | Import Status        |
      | Import Status Detail |

  Scenario: Navigate through the complete MVC import workflow
    When the user opens the Import Data MVC page
    And the user selects Status Summary
    And the user opens the first import Details link
    Then the Import Status Detail page should load

  Scenario: Employee role is required for the Employee test
    Then the authenticated user role should be "Employee"
```

## Playwright Automation Example

```ts
import { test, expect, Page } from '@playwright/test';

const baseUrl = process.env.AES_BASE_URL ?? 'https://aesstage.flqa.net';

async function login(page: Page) {
  const username = process.env.AES_USERNAME;
  const password = process.env.AES_PASSWORD;

  if (!username || !password) {
    throw new Error('Configure AES_USERNAME and AES_PASSWORD securely.');
  }

  await page.goto(`${baseUrl}/`);
  await page.getByLabel(/ID or Username/i).fill(username);
  await page.getByLabel(/PIN or Password/i).fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/aesstage\.flqa\.net/);
}

async function verifyNoConsoleErrors(page: Page, errors: string[]) {
  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
}

async function openAndVerifyProfileMenu(page: Page) {
  const userButton = page.getByRole('button', {
    name: /Report 139963 - (Employee|Organization User)/i,
  });

  await expect(userButton).toBeVisible();
  await userButton.click();
  await expect(userButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your Frontline Account' }))
    .toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Account Settings/i }))
    .toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Sign Out/i }))
    .toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('Import Data page and role menu load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));

  await page.goto(`${baseUrl}/mvc.aspx/dataimport`);
  await expect(page).toHaveTitle(/Select Import Files/i);
  await expect(page.getByRole('heading', { name: 'Upload Files' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose File' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add File' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next >' })).toBeVisible();
  await openAndVerifyProfileMenu(page);
  await verifyNoConsoleErrors(page, errors);
});

test('Import Status page, filter, pagination, and role menu work', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));

  await page.goto(`${baseUrl}/mvc.aspx/dataimport/status`);
  await expect(page.getByRole('heading', { name: 'Import Status' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'New Import' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Details' }).first()).toBeVisible();

  const allUsers = page.getByRole('checkbox');
  const originallyChecked = await allUsers.isChecked();
  await allUsers.click();
  await expect(allUsers).toBeChecked({ checked: !originallyChecked });
  await allUsers.click();
  await expect(allUsers).toBeChecked({ checked: originallyChecked });

  await page.getByRole('link', { name: 'Older>' }).click();
  await expect(page).toHaveURL(/\/mvc\.aspx\/dataimport\/Status\/0\/2/i);
  await expect(page.getByRole('link', { name: '<Newer' })).toBeVisible();

  await openAndVerifyProfileMenu(page);
  await verifyNoConsoleErrors(page, errors);
});

test('Import Status Detail page and role menu load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));

  await page.goto(`${baseUrl}/mvc.aspx/dataimport/status`);
  await page.getByRole('link', { name: 'Details' }).first().click();

  await expect(page).toHaveURL(/\/mvc\.aspx\/dataimport\/StatusDetail\/\d+/i);
  await expect(page.getByRole('heading', { name: 'Import Status Detail' }))
    .toBeVisible();
  await expect(page.getByText(/Status:\s*Completed/i)).toBeVisible();
  await expect(page.getByText(/Object Details/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'New Import' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to Status Summary' }))
    .toBeVisible();

  await openAndVerifyProfileMenu(page);
  await verifyNoConsoleErrors(page, errors);
});

test('Employee account prerequisite', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: /.+ - Employee$/i }),
    'Use an account assigned to the Employee role for this scenario.'
  ).toBeVisible();
});
```

## Secure Test Configuration

```text
AES_BASE_URL=https://aesstage.flqa.net
AES_USERNAME=<authorized-test-username>
AES_PASSWORD=<authorized-test-password>
```

Never commit real credentials to source control, feature files, or test reports.

## Final Conclusion

All three identified MVC pages and the related supporting routes were validated successfully using the supplied account. The application navigation, page content, key read-only functionality, cross-page links, role/profile menu, pagination, status filter, and console health all passed.

The only unresolved item is the Employee-role prerequisite. Obtain an Employee test account and rerun the automation's **Employee account prerequisite** test to convert the overall Employee scenario from **BLOCKED** to **PASS**.
