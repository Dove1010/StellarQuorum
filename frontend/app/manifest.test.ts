import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import manifest from "./manifest";

// Issue #144: the icon set. A manifest is only worth anything if every path in
// it resolves, so the assertions here read the filesystem rather than trusting
// the strings — a renamed or deleted asset is a 404 in the launcher, not a
// type error.
const APP_DIR = join(__dirname);
const PUBLIC_DIR = join(APP_DIR, "..", "public");

describe("app icons", () => {
  it("ships a favicon, a modern icon and an apple-touch icon", () => {
    expect(existsSync(join(APP_DIR, "favicon.ico"))).toBe(true);
    expect(existsSync(join(APP_DIR, "icon.svg"))).toBe(true);
    expect(existsSync(join(APP_DIR, "apple-icon.png"))).toBe(true);
  });

  it("leaves no create-next-app starter assets behind", () => {
    const assets = readdirSync(PUBLIC_DIR);
    const starters = ["next.svg", "vercel.svg", "file.svg", "globe.svg", "window.svg"];

    for (const starter of starters) {
      expect(assets).not.toContain(starter);
    }
  });
});

describe("manifest", () => {
  const result = manifest();

  it("names the app", () => {
    expect(result.name).toBeTruthy();
    expect(result.short_name).toBeTruthy();
    expect(result.description).toBeTruthy();
    // A short_name is what a home screen has room for.
    expect((result.short_name as string).length).toBeLessThanOrEqual(12);
  });

  it("carries the app's dark surface as its theme colour", () => {
    expect(result.theme_color).toBe("#080c10");
    expect(result.background_color).toBe("#080c10");
  });

  it("points at icons that exist, at both sizes a launcher asks for", () => {
    const icons = result.icons as { src: string; sizes: string; type: string }[];
    const sizes = icons.map((icon) => icon.sizes);

    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    for (const icon of icons) {
      expect(icon.type).toBe("image/png");
      expect(existsSync(join(PUBLIC_DIR, icon.src))).toBe(true);
    }
  });

  it("claims no purpose its artwork cannot serve", () => {
    // The mark fills its tile, so a maskable icon would be cropped by a
    // circular mask. Advertising one would install a clipped icon.
    for (const icon of result.icons as { purpose?: string }[]) {
      expect(icon.purpose ?? "any").toBe("any");
    }
  });

  it("declares standalone display for PWA installability", () => {
    expect(result.display).toBe("standalone");
  });
});
