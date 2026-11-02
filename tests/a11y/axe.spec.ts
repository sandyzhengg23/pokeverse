import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Automated axe-core scan (WCAG 2.0/2.1/2.2 A + AA rules axe can evaluate).
 * Passing this does NOT mean the site is WCAG compliant: axe finds roughly a third
 * of issues. See docs/ACCESSIBILITY.md for what still needs manual testing.
 */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// One Pokémon per distinct pastel theme family, so dynamic colours are scanned too.
const THEMED = ["charmander", "squirtle", "pikachu", "bulbasaur", "glaceon", "gengar", "umbreon", "clefairy", "onix", "weedle", "machop", "dratini", "pidgey", "mewtwo", "steelix", "diglett", "jigglypuff", "arbok"];

const PAGES = ["/", "/explore", "/explore?q=pikachu", "/explore?q=zzzzzz", "/scan", "/journey", "/journey?pokemon=25,94", "/collection", "/pokemon/pikachu/story", "/pokemon/pikachu", "/does-not-exist"];

async function scan(page: Page) {
  // Let the 0.6s theme colour transition finish so axe reads final colours.
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" });
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(
    violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n   ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join("\n   ")}`),
  ).toEqual([]);
}

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.locator("main").waitFor();
    await page.waitForLoadState("networkidle");
    await scan(page);
  });
}

for (const name of THEMED) {
  test(`axe themed profile: ${name}`, async ({ page }) => {
    await page.goto(`/pokemon/${name}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForLoadState("networkidle");
    await scan(page);
  });
}

test("axe: mobile menu open", async ({ page, isMobile, viewport }) => {
  test.skip((viewport?.width ?? 1280) >= 768 && !isMobile, "menu only on small screens");
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await scan(page);
});
