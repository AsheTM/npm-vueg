import { describe, it, expect, expectTypeOf } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
// The published declarations (npm test builds them first), as a TypeScript user of the package gets them
import { component, view, errorMessage, run, type ComponentOptions, type ViewOptions, type ViewResult, type VuegcStyle, type VuegcTemplate } from "../dist/vueg";

const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));

describe("TypeScript declarations", () => {
    it("are where package.json says", () => {
        expect(pkg.types).toBe("dist/vueg.d.ts");
        expect(fs.existsSync(path.join(root, pkg.types))).toBe(true);
    });

    it("are published", () => {
        const [{ files }] = JSON.parse(execSync("npm pack --dry-run --json --ignore-scripts", { cwd: root, encoding: "utf-8" }));
        const published: string[] = files.map((file: { path: string }) => file.path);

        expect(published).toEqual(expect.arrayContaining(["dist/vueg.d.ts", "dist/api.d.ts", "dist/view.d.ts"]));
    });

    // Checked by `npm run typecheck` (tsc), not at runtime
    it("type the library API", () => {
        expectTypeOf(component).parameter(0).toEqualTypeOf<ComponentOptions>();
        expectTypeOf(component).returns.toEqualTypeOf<string>();
        expectTypeOf(view).parameter(0).toEqualTypeOf<ViewOptions>();
        expectTypeOf(view).returns.toEqualTypeOf<ViewResult>();
        expectTypeOf(errorMessage).returns.toEqualTypeOf<string>();
        expectTypeOf(run).returns.toEqualTypeOf<number>();

        expectTypeOf<ViewResult["route"]>().toEqualTypeOf<{ path: string; name: string; router: string } | null>();
        expectTypeOf<ViewOptions["route"]>().toEqualTypeOf<string | false | undefined>();
        expectTypeOf<"scss">().toExtend<VuegcStyle>();
        expectTypeOf<VuegcTemplate>().toEqualTypeOf<"html" | "pug">();
        expectTypeOf<{ name: "Card"; test: true; story: true; template: "pug" }>().toExtend<ComponentOptions>();
        expectTypeOf<{ name: "Home"; test: true; story: true; route: false }>().toExtend<ViewOptions>();
        expectTypeOf<{ name: "Card"; ts: true; props: ["title"] }>().toExtend<ComponentOptions>();
        // @ts-expect-error: name is required
        expectTypeOf<{ ts: true }>().toExtend<ComponentOptions>();
    });
});
