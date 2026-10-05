---
name: frontend-design
description: Iterate on frontend visual design by taking screenshots, reviewing, making CSS/markup changes, and re-screenshotting.
user_invocable: true
---

# Frontend Design Iteration Skill

Iterate on the visual design of the web app through a screenshot-review-edit loop.

## Usage

When invoked, perform a design iteration cycle. An optional argument describes what to focus on or change.

## Steps

1. **Screenshot**: Use the `playwright` skill to capture the current state of the page.
2. **Review**: Analyze the screenshot for visual issues, layout problems, spacing, typography, color, alignment, responsiveness, and overall design quality.
3. **Edit**: Make targeted CSS and/or markup changes to address identified issues or fulfill the user's request.
4. **Re-screenshot**: Capture a new screenshot to verify the changes look correct.
5. **Report**: Show the before/after screenshots and summarize what was changed.

## Guidelines
- Make small, incremental changes — don't redesign everything at once.
- Prefer CSS changes over markup changes when possible.
- Preserve existing functionality — design changes should be visual only.
- If the user provides specific feedback, prioritize that over general improvements.
- Always verify changes with a new screenshot before reporting completion.
