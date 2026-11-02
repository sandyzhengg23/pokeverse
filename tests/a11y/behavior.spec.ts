import { expect, test, type Page } from "@playwright/test";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const noOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

test("skip link is the first tab stop and moves focus into main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("no horizontal overflow on key pages (320px and desktop)", async ({ page }) => {
  for (const path of ["/", "/explore", "/explore?q=crabominable", "/scan", "/journey", "/pokemon/pikachu", "/pokemon/crabominable", "/pokemon/pikachu/story"]) {
    await page.goto(path);
    await page.locator("main").waitFor();
    await page.waitForLoadState("networkidle");
    await noOverflow(page);
  }
});

test("mobile menu: toggles with aria-expanded, closes on Escape and returns focus", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 1280) >= 768, "menu only on small screens");
  await page.goto("/");
  const button = page.getByRole("button", { name: "Menu" });
  await button.click();
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

test("touch targets are at least 44px for primary controls", async ({ page }) => {
  await page.goto("/journey");
  for (const loc of [page.getByRole("button", { name: "Generate My Journey" }), page.getByRole("radio", { name: /No spoilers/ }).locator("..")]) {
    const box = await loc.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  }
});

test("reduced motion removes animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pokemon/pikachu");
  await page.locator("h1").waitFor();
  const names = await page.evaluate(() =>
    [...document.querySelectorAll("main *")].map((el) => getComputedStyle(el).animationName).filter((n) => n !== "none" && n !== ""),
  );
  // Only skeleton/spinner pulses may remain (duration is clamped to ~0 by the global rule).
  expect(names.filter((n) => n === "float" || n === "pop-in")).toEqual([]);
});

test.describe("spoiler setting (story page)", () => {
  test("keyboard-operable, announced, and hidden text is absent from the DOM", async ({ page }) => {
    await page.goto("/pokemon/pikachu/story");
    const group = page.getByRole("group", { name: "Spoiler setting" });
    const none = group.getByRole("radio", { name: "No spoilers" });
    await expect(none).toBeChecked();
    await expect(group).toContainText("Current setting: No spoilers.");

    // Nothing from a hidden outcome may be in the accessibility tree or the DOM.
    expect(await page.getByText("Spoiler", { exact: true }).count()).toBe(0);
    await expect(page.getByText("hidden by your spoiler setting").first()).toBeVisible();

    await none.focus();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Mild spoilers" })).toBeChecked();
    await expect(group).toContainText("Current setting: Mild spoilers.");
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Everything" })).toBeChecked();
    await expect(page.getByText("Spoiler", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("hidden by your spoiler setting")).toHaveCount(0);

    // Going back hides it again (removed from DOM, not just visually hidden).
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByText("Spoiler", { exact: true })).toHaveCount(0);
  });

  test("focus ring on a selected chip is visible (not currentColor/white)", async ({ page }) => {
    await page.goto("/pokemon/pikachu/story");
    await page.getByRole("radio", { name: "No spoilers" }).focus();
    await page.keyboard.press("Tab"); // ensure keyboard modality
    await page.keyboard.press("Shift+Tab");
    const label = page.locator("label.chip", { hasText: "No spoilers" });
    // Poll: the chip has a colour transition, so wait for the ring to settle.
    await expect
      .poll(() =>
        label.evaluate((el) => {
          const s = getComputedStyle(el);
          return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`;
        }),
      )
      .toBe("solid 3px rgb(94, 74, 0)"); // Pikachu's --theme-ink (#5e4a00): the dark theme colour, never white/currentColor
  });
});

test.describe("journey builder", () => {
  test("Pokémon selection is a keyboard-operable toggle with state exposed to screen readers", async ({ page }) => {
    await page.goto("/journey");
    const pikachu = page.getByRole("button", { name: "Pikachu", exact: true });
    await expect(pikachu).toHaveAttribute("aria-pressed", "false");
    await pikachu.focus();
    await page.keyboard.press("Space");
    await expect(pikachu).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("1 selected · Maximum 5")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(pikachu).toHaveAttribute("aria-pressed", "false");
  });

  test("limit of 5: extra tiles stay focusable but cannot be added, and it is announced", async ({ page }) => {
    await page.goto("/journey?pokemon=25,92,93,94,133");
    const extra = page.getByRole("button", { name: "Vaporeon", exact: true });
    await expect(extra).toHaveAttribute("aria-disabled", "true");
    await extra.focus();
    await expect(extra).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(extra).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("status").filter({ hasText: "Maximum reached" })).toHaveCount(1);
  });

  test("announces loading, success and error; keeps focus on the button", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/journey", async (route) => {
      calls++;
      await new Promise((r) => setTimeout(r, 600));
      if (calls === 1) {
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "The planner is busy." }) });
      }
      const episode = {
        id: "e1", title: "Test Episode", series: "Test", episodeNumber: 1, airDate: null, summary: "A premise.",
        characters: [], pokemon: [], spoilerLevel: "none", source: { name: "Serebii", url: "https://example.com" },
        verifiedOn: "2026-01-01", pokemonId: 25, role: "main", significance: "introduction", why: "Because.",
        outcome: { level: "major", text: "" },
      };
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          title: "Pikachu’s Path", introduction: "Intro.", titleSource: "dataset", introductionSource: "dataset",
          request: { pokemonIds: [25], budgetMinutes: 60, maxSpoilerLevel: "none", interests: [] },
          steps: [{ order: 1, episode, featuredPokemonIds: [25], reason: "Why.", reasonSource: "dataset", linkToPrevious: null, estimatedMinutes: 25 }],
          connections: [], estimate: { minutesPerEpisode: 25, totalMinutes: 25, note: "Estimate." }, notices: ["A notice."], model: "test",
        }),
      });
    });

    await page.goto("/journey?pokemon=25");
    const live = page.locator("p[role=status].sr-only");
    const generate = page.getByRole("button", { name: /Generate My Journey/ });
    await generate.focus();
    await page.keyboard.press("Enter");

    await expect(live).toContainText("Muse Spark is planning your journey");
    await expect(page.getByRole("button", { name: "Planning…" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Planning…" })).toHaveAttribute("aria-disabled", "true");

    await expect(page.locator("main").getByRole("alert")).toContainText("The planner is busy.");

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(live).toContainText("Your journey is ready: Pikachu’s Path. 1 episode");
    await expect(page.getByRole("heading", { name: "Pikachu’s Path" })).toBeVisible();
    await expect(page.getByText("hidden spoiler")).toBeVisible();
  });
});

test.describe("card scanner", () => {
  const verified = {
    isPokemonCard: true, confidence: "high", modelGuess: "Pikachu", verification: "verified",
    card: { cardName: "Pikachu", cardNumber: "025/165", setName: null },
    pokemon: {
      id: 25, speciesId: 25, name: "pikachu", displayName: "Pikachu", types: ["electric"], heightM: 0.4, weightKg: 6,
      abilities: [], stats: [], artworkUrl: null,
    },
  };

  test("upload preview has alt text; progress and result are announced; controls keep focus", async ({ page }) => {
    await page.route("**/api/scan", async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(verified) });
    });
    await page.goto("/scan");
    const live = page.getByRole("status").filter({ hasNotText: /^$/ }).or(page.locator("p[role=status]"));
    await page.locator('input[type=file]:not([capture])').setInputFiles({ name: "card.png", mimeType: "image/png", buffer: PNG_1PX });

    await expect(page.getByRole("img", { name: /Preview of the Pokémon card photo/ })).toBeVisible();
    await expect(live.first()).toContainText(/Preparing|Reading your card/);
    await expect(page.locator("p[role=status]").filter({ hasText: "Scan complete" })).toContainText("Scan complete. Found Pikachu.");
    await expect(page.getByRole("heading", { name: "Pikachu", level: 2 })).toBeVisible();
    await expect(page.getByText("Species verified with PokéAPI")).toBeVisible();
  });

  test("error is announced via alert", async ({ page }) => {
    await page.route("**/api/scan", (route) =>
      route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ error: "Too many scans. Try later." }) }),
    );
    await page.goto("/scan");
    await page.locator('input[type=file]:not([capture])').setInputFiles({ name: "card.png", mimeType: "image/png", buffer: PNG_1PX });
    await expect(page.locator("main").getByRole("alert")).toContainText("Too many scans");
  });

  test("Start over returns keyboard focus to the first control", async ({ page }) => {
    await page.route("**/api/scan", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(verified) }),
    );
    await page.goto("/scan");
    await page.locator('input[type=file]:not([capture])').setInputFiles({ name: "card.png", mimeType: "image/png", buffer: PNG_1PX });
    await page.getByRole("button", { name: "Start over" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Take a photo/ })).toBeFocused();
  });

  test("correction form: 'Not right?' exposes expanded state and focuses the field", async ({ page }) => {
    await page.route("**/api/scan", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(verified) }),
    );
    await page.goto("/scan");
    await page.locator('input[type=file]:not([capture])').setInputFiles({ name: "card.png", mimeType: "image/png", buffer: PNG_1PX });
    const notRight = page.getByRole("button", { name: "Not right?" });
    await expect(notRight).toHaveAttribute("aria-expanded", "false");
    await notRight.click();
    await expect(notRight).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("textbox", { name: /Pokémon name or Pokédex number/ })).toBeFocused();
  });
});

test("explore: search field has an accessible name and results are announced", async ({ page }) => {
  await page.goto("/explore");
  const input = page.getByRole("searchbox", { name: /Search Pokémon/ });
  await input.fill("pikachu");
  await input.press("Enter");
  await expect(page.locator("#a11y-announcer")).toContainText("result", { timeout: 15_000 });
  await expect(page.getByRole("list", { name: "Pokémon results" })).toBeVisible();
});
