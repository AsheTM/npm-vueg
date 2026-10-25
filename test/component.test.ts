import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { componentOptions } from "../src/component";
import { VUEG, createVueProject, removeFolder, runScript, readComponent } from "./support/vue-project";

// The vuegc command installed as vueg's dependency, to compare both CLIs
const VUEGC = require.resolve("vuegc");

describe("componentOptions() (flags -> vuegc options)", () => {
    it("uses vuegc's defaults when only --name is given", () => {
        expect(componentOptions(["--name", "Card"], "/project")).toEqual({
            name: "Card", style: undefined, scoped: true, path: undefined,
            blank: false, force: false, dryRun: false,
            noTemplate: false, noScript: false, noStyle: false,
            props: undefined, cssModule: false, cwd: "/project",
        });
    });

    it("maps every flag", () => {
        const flags = ["--name", "Card", "--style", "sass", "--scoped", "false", "--path", "components/ui",
            "--blank", "--force", "--dry-run", "--no-template", "--props", "title, items", "--module"];

        expect(componentOptions(flags, "/project")).toMatchObject({
            name: "Card", style: "sass", scoped: false, path: "components/ui",
            blank: true, force: true, dryRun: true, noTemplate: true,
            props: ["title", "items"], cssModule: true,
        });
    });

    it.each([
        { label: "missing",         flags: ["--style", "css"] },
        { label: "without value",   flags: ["--name", "--force"] },
    ])("throws vuegc's 0x0003 when --name is $label", ({ flags }) => {
        expect(() => componentOptions(flags)).toThrow();
        try {
            componentOptions(flags);
        } catch(err) {
            expect(err).toMatchObject({ errno: 0x0003, flag: "name" });
        }
    });
});

describe("vueg component (CLI)", () => {
    let project: string;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("generates the component and exits with 0", () => {
        const { status, stdout } = runScript(VUEG, project, ["component", "--name", "Card"]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/Generating vue component success/);
        expect(readComponent(project, "Card.vue")).toMatch(/name: "Card"/);
    });

    it.each([
        { label: "(no flag)",   args: [] },
        { label: "--help",      args: ["--name", "Card", "--help"] },
        { label: "-h",          args: ["-h"] },
    ])("shows the component help: $label", ({ args }) => {
        const { status, stdout } = runScript(VUEG, project, ["component", ...args]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/vueg component --name/);
        expect(readComponent(project, "Card.vue")).toBeNull();
    });

    // vuegc's errors come through with the same message and exit code 1
    it.each([
        { label: "missing --name",      args: ["--style", "css"],                       message: /Flag name required/ },
        { label: "unsupported style",   args: ["--name", "Card", "--style", "tailwind"], message: /Style tailwind not supported/ },
        { label: "path outside src/",   args: ["--name", "Card", "--path", ".."],        message: /must be a folder inside src\// },
        { label: "invalid prop",        args: ["--name", "Card", "--props", "user-name"], message: /Prop "user-name"/ },
        { label: "--props without value", args: ["--name", "Card", "--props"],          message: /--props needs a list of names/ },
    ])("fails like vuegc: $label", ({ args, message }) => {
        const { status, stdout } = runScript(VUEG, project, ["component", ...args]);

        expect(status).toBe(1);
        expect(stdout).toMatch(message);
    });

    it("never overwrites an existing component without --force", () => {
        const file = path.join(project, "src", "Card.vue");
        fs.writeFileSync(file, "my own work");

        expect(runScript(VUEG, project, ["component", "--name", "Card"]).status).toBe(1);
        expect(fs.readFileSync(file, "utf-8")).toBe("my own work");
        expect(runScript(VUEG, project, ["component", "--name", "Card", "--force"]).status).toBe(0);
    });
});

// vueg component must produce exactly what the vuegc command produces for the same flags
describe("parity with the vuegc command", () => {
    let forVueg: string, forVuegc: string;

    beforeEach(() => {
        forVueg = createVueProject();
        forVuegc = createVueProject();
    });
    afterEach(() => {
        removeFolder(forVueg);
        removeFolder(forVuegc);
    });

    // Objects, not arrays: it.each spreads arrays into separate arguments
    it.each([
        { flags: [] },
        { flags: ["--style", "css", "--scoped", "false"] },
        { flags: ["--style", "sass", "--module"] },
        { flags: ["--style", "less", "--blank", "--props", "title,items"] },
        { flags: ["--no-style", "--props", "title"] },
        { flags: ["--no-template", "--no-script", "--style", "stylus"] },
        { flags: ["--path", "components/ui"] },
    ])("same file for: $flags", ({ flags }) => {
        const vueg = runScript(VUEG, forVueg, ["component", "--name", "Card", ...flags]);
        const vuegc = runScript(VUEGC, forVuegc, ["--name", "Card", ...flags]);
        const file = flags.includes("--path") ? "components/ui/Card.vue" : "Card.vue";

        expect(vueg.status).toBe(0);
        expect(vuegc.status).toBe(0);
        expect(readComponent(forVueg, file)).toBe(readComponent(forVuegc, file));
    });
});
