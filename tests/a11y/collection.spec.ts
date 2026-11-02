import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const KEY = "pokeverse:collection:v1";
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function seed(page: Page, value: unknown) {
  await page.addInitScript(([k, v]) => { if (!localStorage.getItem(k as string)) localStorage.setItem(k as string, v as string); }, [KEY, JSON.stringify(value)]);
}
const stored = (page: Page) => page.evaluate((k) => localStorage.getItem(k), KEY);

test("empty collection explains itself and states the local-only limit", async ({ page }) => {
  await page.goto("/collection");
  await expect(page.getByRole("heading", { name: "Your collection is empty" })).toBeVisible();
  await expect(page.getByText("Stored only in this browser.")).toBeVisible();
  await expect(page.getByText("won’t sync to your other devices")).toBeVisible();
  await expect(page.getByRole("link", { name: "Scan a card" })).toHaveAttribute("href", "/scan");
  await expect(page.getByRole("link", { name: /Build a Story Journey/ })).toHaveCount(0);
});

test("axe: populated collection", async ({ page }) => {
  await seed(page, [{ speciesId: 25, name: "Pikachu" }, { speciesId: 1, name: "Bulbasaur" }, { speciesId: 94, name: "Gengar" }]);
  await page.goto("/collection");
  await expect(page.getByRole("img", { name: /Official artwork/ }).first()).toBeVisible().catch(() => {});
  await page.getByRole("button", { name: "Remove Gengar from collection" }).waitFor();
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" });
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

test("journey action preselects only saved Pokémon with verified anime episodes", async ({ page }) => {
  await seed(page, [{ speciesId: 25, name: "Pikachu" }, { speciesId: 1, name: "Bulbasaur" }, { speciesId: 94, name: "Gengar" }]);
  await page.goto("/collection");
  const link = page.getByRole("link", { name: /Build a Story Journey/ });
  await expect(link).toHaveAttribute("href", "/journey?pokemon=25,94");
  await link.click();
  await expect(page.getByRole("button", { name: "Pikachu", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Gengar", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("2 selected · Maximum 5")).toBeVisible();
});

test("no journey action when nothing saved has episodes", async ({ page }) => {
  await seed(page, [{ speciesId: 1, name: "Bulbasaur" }]);
  await page.goto("/collection");
  await expect(page.getByText("None of your saved Pokémon have verified anime episodes")).toBeVisible();
  await expect(page.getByRole("link", { name: /Build a Story Journey/ })).toHaveCount(0);
});

test("remove works by keyboard, is announced, persists, and focus stays in the page", async ({ page }) => {
  await seed(page, [{ speciesId: 25, name: "Pikachu" }, { speciesId: 1, name: "Bulbasaur" }]);
  await page.goto("/collection");
  const remove = page.getByRole("button", { name: "Remove Bulbasaur from collection" });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#a11y-announcer")).toContainText("Bulbasaur removed from your collection.");
  await expect(page.getByRole("heading", { name: "Saved Pokémon (1)" })).toBeFocused();
  expect(JSON.parse((await stored(page))!)).toEqual([{ speciesId: 25, name: "Pikachu" }]);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Saved Pokémon (1)" })).toBeVisible();
});

test("corrupt or hand-edited storage is ignored safely", async ({ page }) => {
  await seed(page, [{ speciesId: "25", name: "x" }, { speciesId: 25, name: "Pikachu" }, { speciesId: 25, name: "Dup" }, { speciesId: 999999, name: "Nope" }, null, 7]);
  await page.goto("/collection");
  await expect(page.getByRole("heading", { name: "Saved Pokémon (1)" })).toBeVisible();
  await page.addInitScript(() => localStorage.setItem("pokeverse:collection:v1", "{not json"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your collection is empty" })).toBeVisible();
});

test("blocked localStorage shows a clear message instead of crashing", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("blocked", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("blocked", "SecurityError"); };
  });
  await page.goto("/collection");
  await expect(page.locator("main").getByRole("alert")).toContainText("Collection isn’t available in this browser");
});

test.describe("save from scan", () => {
  const scan = {
    isPokemonCard: true, confidence: "high", modelGuess: "Pikachu", verification: "verified",
    card: { cardName: "Pikachu ex", cardNumber: "025/165", setName: "Secret Set" },
    pokemon: { id: 25, speciesId: 25, name: "pikachu", displayName: "Pikachu", types: ["electric"], heightM: 0.4, weightKg: 6, abilities: [], stats: [], artworkUrl: null },
  };
  async function scanCard(page: Page) {
    await page.route("**/api/scan", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scan) }));
    await page.goto("/scan");
    await page.locator("input[type=file]:not([capture])").setInputFiles({ name: "c.png", mimeType: "image/png", buffer: PNG_1PX });
  }

  test("saves only verified species id + name, announces it, and prevents duplicates", async ({ page }) => {
    await scanCard(page);
    const save = page.getByRole("button", { name: "Save to Collection" });
    await save.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Saved to Collection/ })).toBeFocused();
    await expect(page.getByRole("button", { name: /Saved to Collection/ })).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("status").filter({ hasText: "Pikachu saved to your collection." })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "View Collection" })).toHaveAttribute("href", "/collection");

    await page.keyboard.press("Enter"); // second activation must not duplicate
    const raw = await stored(page);
    expect(JSON.parse(raw!)).toEqual([{ speciesId: 25, name: "Pikachu" }]); // no card name/number/set
    expect(raw).not.toContain("Secret Set");

    await page.getByRole("link", { name: "View Collection" }).click();
    await expect(page.getByRole("heading", { name: "Saved Pokémon (1)" })).toBeVisible();
  });

  test("shows an error when storage is blocked", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => { throw new DOMException("quota", "QuotaExceededError"); };
    });
    await scanCard(page);
    await page.getByRole("button", { name: "Save to Collection" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Couldn’t save");
  });
});
