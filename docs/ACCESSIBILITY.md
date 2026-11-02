# Accessibility

PokéVerse targets **WCAG 2.2 AA**. This is a goal, not a certification: automated tests catch only a fraction of
real-world barriers, and no screen-reader or assistive-technology user testing has been done yet.

## Automated checks

| Command | What it checks |
| --- | --- |
| `npm run lint` | ESLint incl. the `jsx-a11y` rules shipped with `eslint-config-next` |
| `npm run typecheck` | TypeScript |
| `npm run test:contrast` | WCAG contrast of every colour pair the UI renders, across all 18 pastel type themes (text 4.5:1, borders/focus 3:1) |
| `npm run build && npm run test:a11y` | Playwright + axe-core (WCAG 2.0/2.1/2.2 A/AA rules) on every page and 18 themed profiles at 1280px and 320px, plus behaviour tests: skip link, menu/Escape, spoiler radios, journey selection + live announcements, scanner states, focus management, reduced motion, no horizontal overflow, 44px targets |

`test:a11y` runs against a production build, mocks `/api/scan` and `/api/journey` in the browser (no Meta/Upstash calls),
and uses the locally installed Google Chrome (set `PW_BUNDLED=1` after `npx playwright install chromium` to use the bundled one).
PokéAPI network access is required.

## Not covered by automation: test manually

See the checklist in the PR/summary. In particular: real screen readers (VoiceOver, NVDA), 200–400% zoom/reflow, text spacing,
real phones (camera capture), Windows High Contrast / forced colours, and cognitive/readability review of the copy.
