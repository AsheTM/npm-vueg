import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { viewOptions } from "../src/view";
import { VUEG, VUE_ROUTER, addRouter, createVueProject, removeFolder, runScript, readComponent } from "./support/vue-project";

const readRouter = (project: string) => fs.readFileSync(path.join(project, "src", "router", "index.js"), "utf-8");

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

    // A Vue project with the Vue CLI router: views get their route
    beforeEach(() => {
        project = createVueProject();
        addRouter(project);
    });
    afterEach(() => { removeFolder(project); });

    it("generates src/views/<Name>.vue", () => {
        const { status, stdout } = runScript(VUEG, project, ["view", "--name", "Dashboard"]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/Generating vue component success/);
        expect(readComponent(project, "views/Dashboard.vue")).toMatch(/id="Dashboard"/);
        expect(readComponent(project, "Dashboard.vue")).toBeNull();
    });

    it("creates the --path sub-folder of views/", () => {
        expect(runScript(VUEG, project, ["view", "--name", "Users", "--path", "admin"]).status).toBe(0);
        expect(readComponent(project, "views/admin/Users.vue")).toMatch(/id="Users"/);
    });

    it("produces the same file as vuegc --path views", () => {
        const other = createVueProject();
        runScript(VUEG, project, ["view", "--name", "Dashboard", "--style", "sass", "--props", "id"]);
        runScript(VUEGC, other, ["--name", "Dashboard", "--style", "sass", "--props", "id", "--path", "views"]);

        expect(readComponent(project, "views/Dashboard.vue")).toBe(readComponent(other, "views/Dashboard.vue"));
        removeFolder(other);
    });

    it.each([
        { label: "a parent folder",     args: ["--path", "../escape"],  message: /Path "\.\.\/escape" must be a folder inside src\/views\// },
        { label: "--path without value", args: ["--path"],              message: /Path "" must be a folder inside src\/views\// },
    ])("rejects $label with exit 1 and writes nothing", ({ args, message }) => {
        const { status, stdout } = runScript(VUEG, project, ["view", "--name", "X", ...args]);

        expect(status).toBe(1);
        expect(stdout).toMatch(message);
        expect(fs.readdirSync(path.join(project, "src")).sort()).toEqual(["App.vue", "main.js", "router"]);
        expect(readRouter(project)).toBe(VUE_ROUTER);
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

describe("vueg view: the route", () => {
    let project: string;

    beforeEach(() => {
        project = createVueProject();
        addRouter(project);
    });
    afterEach(() => { removeFolder(project); });

    it.each([
        { label: "kebab-case of the name",  args: ["--name", "UserProfile"],                       route: "/user-profile",        imported: "../views/UserProfile.vue" },
        { label: "with the --path folder",  args: ["--name", "Users", "--path", "admin"],          route: "/admin/users",         imported: "../views/admin/Users.vue" },
        { label: "--route",                 args: ["--name", "Users", "--route", "/people"],       route: "/people",              imported: "../views/Users.vue" },
    ])("adds the route: $label", ({ args, route, imported }) => {
        const { status, stdout } = runScript(VUEG, project, ["view", ...args]);

        expect(status).toBe(0);
        expect(stdout).toContain(`> Route ${ route } added to src/router/index.js`);
        expect(readRouter(project)).toContain(`    path: '${ route }',`);
        expect(readRouter(project)).toContain(`    component: () => import('${ imported }')`);
    });

    // create-vue names its routes 'home', 'about': the new one follows
    it.each([
        { label: "lowercase names (create-vue)",  router: VUE_ROUTER,                                                expected: "name: 'userProfile'," },
        { label: "capitalized names",             router: "const routes = [\n  { path: '/', name: 'Home' }\n]\n",    expected: "name: 'UserProfile'," },
        { label: "no names",                      router: "const routes = []\n",                                     expected: "name: 'UserProfile'," },
    ])("names the route like the router: $label", ({ router, expected }) => {
        addRouter(project, router);

        expect(runScript(VUEG, project, ["view", "--name", "UserProfile"]).status).toBe(0);
        expect(readRouter(project)).toContain(expected);
    });

    it("--no-route generates the view and leaves the router as is", () => {
        const { status, stdout } = runScript(VUEG, project, ["view", "--name", "Users", "--no-route"]);

        expect(status).toBe(0);
        expect(stdout).not.toMatch(/Route/);
        expect(readComponent(project, "views/Users.vue")).not.toBeNull();
        expect(readRouter(project)).toBe(VUE_ROUTER);
    });

    it("--dry-run shows the view and the route, and writes nothing", () => {
        const { status, stdout } = runScript(VUEG, project, ["view", "--name", "Users", "--dry-run"]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/Dry run, nothing written: src\/views\/Users\.vue/);
        expect(stdout).toMatch(/Dry run, route not added to src\/router\/index\.js/);
        expect(stdout).toContain("path: '/users',");
        expect(readComponent(project, "views/Users.vue")).toBeNull();
        expect(readRouter(project)).toBe(VUE_ROUTER);
    });

    // Every failure leaves the project as it was: no view, router unchanged
    it.each([
        { label: "the route already exists",    args: ["--name", "Start", "--route", "/"],  message: /Route "\/" already exists in src\/router\/index\.js/ },
        { label: "the route name exists",       args: ["--name", "About", "--route", "/x"], message: /A route named "about" already exists/ },
        { label: "--route without /",           args: ["--name", "Users", "--route", "users"], message: /--route needs a path starting with "\/"/ },
        { label: "--route without value",       args: ["--name", "Users", "--route"],       message: /--route needs a path starting with "\/"/ },
        { label: "an invalid component option", args: ["--name", "Users", "--style", "tailwind"], message: /Style tailwind not supported/ },
    ])("fails and changes nothing when $label", ({ args, message }) => {
        const { status, stdout } = runScript(VUEG, project, ["view", ...args]);

        expect(status).toBe(1);
        expect(stdout).toMatch(message);
        expect(fs.existsSync(path.join(project, "src", "views"))).toBe(false);
        expect(readRouter(project)).toBe(VUE_ROUTER);
    });

    it("leaves the router as is when the view already exists (no --force)", () => {
        fs.mkdirSync(path.join(project, "src", "views"));
        fs.writeFileSync(path.join(project, "src", "views", "Users.vue"), "my own work");

        const { status, stdout } = runScript(VUEG, project, ["view", "--name", "Users"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/Component already exists/);
        expect(readRouter(project)).toBe(VUE_ROUTER);
    });

    it("fails without a router, and creates no view", () => {
        fs.rmSync(path.join(project, "src", "router"), { recursive: true });

        const { status, stdout } = runScript(VUEG, project, ["view", "--name", "Users"]);

        expect(status).toBe(1);
        expect(stdout).toMatch(/No router found .* use --no-route/);
        expect(fs.existsSync(path.join(project, "src", "views"))).toBe(false);
    });

    it("adds several views one after the other", () => {
        runScript(VUEG, project, ["view", "--name", "Users"]);
        runScript(VUEG, project, ["view", "--name", "Settings", "--path", "admin"]);

        const router = readRouter(project);
        expect(router.match(/path: /g)).toHaveLength(4);
        expect(router.indexOf("/users")).toBeLessThan(router.indexOf("/admin/settings"));
    });
});
