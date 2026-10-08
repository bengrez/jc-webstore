---
name: playwright
description: Take screenshots of the running web app using Playwright for visual review and iteration.
user_invocable: true
---

# Playwright Screenshot Skill

Take a screenshot of the web app running at http://localhost:5173 using Playwright.

## Usage

When invoked, capture a full-page screenshot of the specified URL (default: http://localhost:5173).
An optional argument can be passed to specify a different path (e.g., `/catalog`, `/cart`).

## Steps

1. Run Playwright to capture a screenshot:
   ```bash
   npx playwright screenshot --full-page --wait-for-timeout=2000 "http://localhost:5173${path}" /tmp/screenshot.png
   ```
   Where `${path}` is the optional argument (default: empty string for home page).

2. Read the screenshot file using the Read tool so it can be visually reviewed.

3. Return the screenshot to the conversation for analysis.

## Notes
- If the command fails, check that the dev server is running and that playwright browsers are installed (`npx playwright install chromium`).
- Use `--wait-for-timeout=2000` to allow the page to fully render before capturing.
