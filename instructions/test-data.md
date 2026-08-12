# Test Data

## Login account

- URL and username source: `config/aes-stage.json`
- Primary password source: `AES_STAGE_PASSWORD`
- Local fallback password source: `.secrets/aes-stage.credentials.json`

Resolve credentials before opening the browser. Use the environment variable first and the ignored local credentials file second. Do not pause for password entry when either source is valid. If neither source exists or the local value is still a placeholder, mark the scenario **BLOCKED** and stop before browser actions. Never print, display, repeat, screenshot, report, or copy the resolved password.

## Employee record

- First Name: `7618`
- Last Name: `Emp_Auto_7618`
- Email: `automationUser@gmail.com`
- Gender: `Male`
- Start Date: `09/24/2019`
- End Date: `09/25/2020`
- Birth Date: `03/05/1993`
- Employee: `Security Guard`
- Phone: `3788069839`
- Pin: `69839`
- Identifier: `7618`
- School: `Global Logic STAGE Org 2 11AB025A-EE18-43D5-9082-4`

## Verification key

- Search field: `Last Name`
- Search value: `Emp_Auto_7618`

This is synthetic Stage data. Before creating it, stop if an existing employee with the same exact Last Name and Identifier is found.
