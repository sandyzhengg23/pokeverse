import { defineConfig } from "@playwright/test";

/**
 * Accessibility tests run against a PRODUCTION build:
 *   npm run build && npm run test:a11y
 * They never call Meta or Upstash: /api/scan and /api/journey are mocked in the browser.
 * PokéAPI is contacted for Pokémon data, so network access is required.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "./tests/a11y",
  timeout: 60_000,
  fullyParallel: true,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Use the locally installed Google Chrome; in CI run `npx playwright install chromium` and set PW_BUNDLED=1.
    channel: process.env.PW_BUNDLED ? undefined : "chrome",
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile-320", use: { viewport: { width: 320, height: 640 }, hasTouch: true } },
  ],
});
