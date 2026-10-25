import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { viewOptions } from "../src/view";
import { VUEG, createVueProject, removeFolder, runScript, readComponent } from "./support/vue-project";

const VUEGC = require.resolve("vuegc");

// What a function throws (errors here are plain objects, not Error)
function thrown(fn: () => unknown): unknown {
    try {
        fn();
    } catch(err) {
        return err;
    }
    return null;
}

describe("viewOptions() (flags -> vuegc options)", () => {
    it.each([
        { label: "no --path",           flags: ["--name", "Home"],                          expected: "views" },
        { label: "a sub-folder",        flags: ["--name", "Users", "--path", "admin"],      expected: "views/admin" },
        { label: "nested sub-folders",  flags: ["--name", "Users", "--path", "admin/users"], expected: "views/admin/users" },
    ])("puts the view in src/views/: $label", ({ flags, expected }) => {
        expect(viewOptions(flags, "/project").path).toBe(expected);
    });

    it("keeps the other flags of vueg component", () => {
        expect(viewOptions(["--name", "Home", "--style", "css", "--blank", "--props", "id"], "/project"))
            .toMatchObject({ name: "Home", style: "css", blank: true, props: ["id"] });
    });

    it.each([
        { label: "a parent folder",         flags: ["--name", "X", "--path", ".."] },
        { label: "a hidden parent folder",  flags: ["--name", "X", "--path", "admin/../.."] },
        { label: "an absolute path",        flags: ["--name", "X", "--path", path.resolve("/outside")] },
        { label: "no value",                flags: ["--name", "X", "--path"] },
    ])("rejects $label", ({ flags }) => {
        expect(thrown(() => viewOptions(flags))).toMatchObject({ vueg: true, message: expect.stringContaining("inside src/views/") });
    });
});

describe("vueg view (CLI)", () => {
    let project: string;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("generates src/views/<Name>.vue", () => {
        const { status, stdout } = runScript(VUEG, project, ["view", "--name", "Home"]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/Generating vue component success/);
        expect(readComponent(project, "views/Home.vue")).toMatch(/name: "Home"/);
        expect(readComponent(project, "Home.vue")).toBeNull();
    });

    it("creates the --path sub-folder of views/", () => {
        expect(runScript(VUEG, project, ["view", "--name", "Users", "--path", "admin"]).status).toBe(0);
        expect(readComponent(project, "views/admin/Users.vue")).toMatch(/name: "Users"/);
    });

    it("produces the same file as vuegc --path views", () => {
        const other = createVueProject();
        runScript(VUEG, project, ["view", "--name", "Home", "--style", "sass", "--props", "id"]);
        runScript(VUEGC, other, ["--name", "Home", "--style", "sass", "--props", "id", "--path", "views"]);

        expect(readComponent(project, "views/Home.vue")).toBe(readComponent(other, "views/Home.vue"));
        removeFolder(other);
    });

    it.each([
        { label: "a parent folder",     args: ["--path", "../escape"],  message: /Path "\.\.\/escape" must be a folder inside src\/views\// },
        { label: "--path without value", args: ["--path"],              message: /Path "" must be a folder inside src\/views\// },
    ])("rejects $label with exit 1 and writes nothing", ({ args, message }) => {
        const { status, stdout } = runScript(VUEG, project, ["view", "--name", "X", ...args]);

        expect(status).toBe(1);
        expect(stdout).toMatch(message);
        expect(fs.readdirSync(path.join(project, "src")).sort()).toEqual(["App.vue", "main.js"]);
    });

    it.each([
        { label: "(no flag)",   args: [] },
        { label: "--help",      args: ["--name", "Home", "--help"] },
    ])("shows the view help: $label", ({ args }) => {
        const { status, stdout } = runScript(VUEG, project, ["view", ...args]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/vueg view --name Home/);
        expect(stdout).toMatch(/Folder inside src\/views\//);
    });

    it("lists view in the main help", () => {
        expect(runScript(VUEG, project, []).stdout).toMatch(/view: +Generate a view/);
    });
});
