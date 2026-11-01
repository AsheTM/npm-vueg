import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { component, view, errorMessage } from "../src/vueg";
import { VUEG, VUE_ROUTER, addRouter, createVueProject, removeFolder, runScript, readComponent } from "./support/vue-project";

const readRouter = (project: string) => fs.readFileSync(path.join(project, "src", "router", "index.js"), "utf-8");

// What a function throws (errors here are plain objects, not Error)
function thrown(fn: () => unknown): unknown {
    try {
        fn();
    } catch(err) {
        return err;
    }
    return null;
}

let project: string;

beforeEach(() => {
    project = createVueProject();
    // vuegc reports its progress on the console: keep the test output clean
    vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
    vi.restoreAllMocks();
    removeFolder(project);
});

describe("package entry", () => {
    it("exports the library API next to run()", () => {
        expect(Object.keys(require(VUEG)).sort()).toEqual(["component", "errorMessage", "run", "view"]);
    });
});

describe("component()", () => {
    it("generates the component and returns its path", () => {
        const file = component({ name: "Card", path: "components", cwd: project });

        expect(file).toBe(path.join(project, "src", "components", "Card.vue"));
        expect(readComponent(project, "components/Card.vue")).toMatch(/<script setup>/);
    });

    it("takes vuegc's options", () => {
        component({ name: "Card", ts: true, props: ["title"], style: "scss", cwd: project });

        const card = readComponent(project, "Card.vue");
        expect(card).toMatch(/<script setup lang="ts">/);
        expect(card).toMatch(/defineProps<\{\s+title\?: unknown;\s+\}>\(\)/);
        expect(card).toMatch(/<style lang="scss" scoped>/);
    });

    it("writes nothing with dryRun", () => {
        expect(component({ name: "Card", dryRun: true, cwd: project })).toBe(path.join(project, "src", "Card.vue"));
        expect(readComponent(project, "Card.vue")).toBeNull();
    });

    it("generates the same component as vueg component", () => {
        component({ name: "Card", props: ["title"], emits: ["close"], cwd: project });
        const other = createVueProject();
        try {
            runScript(VUEG, other, ["component", "--name", "Card", "--props", "title", "--emits", "close"]);
            expect(readComponent(project, "Card.vue")).toBe(readComponent(other, "Card.vue"));
        } finally {
            removeFolder(other);
        }
    });
});

describe("view()", () => {
    beforeEach(() => { addRouter(project); });

    it("generates the view in src/views/ and adds its default route", () => {
        const result = view({ name: "UserProfile", path: "admin", cwd: project });

        expect(result).toEqual({
            file: path.join(project, "src", "views", "admin", "UserProfile.vue"),
            route: { path: "/admin/user-profile", name: "userProfile", router: path.join(project, "src", "router", "index.js") },
        });
        expect(readComponent(project, "views/admin/UserProfile.vue")).not.toBeNull();
        expect(readRouter(project)).toMatch(/path: '\/admin\/user-profile',\s+name: 'userProfile',\s+component: \(\) => import\('\.\.\/views\/admin\/UserProfile\.vue'\)/);
    });

    it("uses the given route", () => {
        expect(view({ name: "Dashboard", route: "/home", cwd: project }).route?.path).toBe("/home");
        expect(readRouter(project)).toMatch(/path: '\/home'/);
    });

    it("adds no route with route: false", () => {
        const result = view({ name: "Dashboard", route: false, cwd: project });

        expect(result.route).toBeNull();
        expect(readComponent(project, "views/Dashboard.vue")).not.toBeNull();
        expect(readRouter(project)).toBe(VUE_ROUTER);
    });

    it("returns the route without writing anything with dryRun", () => {
        const result = view({ name: "Dashboard", dryRun: true, cwd: project });

        expect(result.route?.path).toBe("/dashboard");
        expect(readComponent(project, "views/Dashboard.vue")).toBeNull();
        expect(readRouter(project)).toBe(VUE_ROUTER);
    });

    it.each([
        { label: "a path outside src/views/",   options: { name: "X", path: "../components" },  message: /Path "\.\.\/components" must be a folder inside src\/views\// },
        { label: "a route without /",           options: { name: "X", route: "home" },          message: /--route needs a path starting with "\/"/ },
        { label: "an existing route",           options: { name: "X", route: "/about" },        message: /Route "\/about" already exists/ },
    ])("leaves the project unchanged on $label", ({ options, message }) => {
        expect(errorMessage(thrown(() => view({ ...options, cwd: project })))).toMatch(message);
        expect(fs.existsSync(path.join(project, "src", "views"))).toBe(false);
        expect(readRouter(project)).toBe(VUE_ROUTER);
    });
});

describe("errorMessage()", () => {
    // The CLI's message for the same failure: "\t[!] <message> [!]"
    function cliMessage(args: string[]): string {
        const { stdout } = runScript(VUEG, project, args);
        return /\[!\] (.*) \[!\]/.exec(stdout)![1];
    }

    it.each([
        { label: "an existing component",   setup: () => component({ name: "Card", cwd: project }), options: { name: "Card" },                  args: ["--name", "Card"] },
        { label: "an unsupported style",    setup: () => {},                                        options: { name: "Card", style: "styl" },   args: ["--name", "Card", "--style", "styl"] },
        { label: "an invalid prop",         setup: () => {},                                        options: { name: "Card", props: ["1st"] },  args: ["--name", "Card", "--props", "1st"] },
        { label: "a path outside src/",     setup: () => {},                                        options: { name: "Card", path: "../x" },    args: ["--name", "Card", "--path", "../x"] },
    ])("gives the CLI's message for $label", ({ setup, options, args }) => {
        setup();
        const error = thrown(() => component({ ...options, cwd: project } as Parameters<typeof component>[0]));

        expect(errorMessage(error)).toBe(cliMessage(["component", ...args]));
    });

    it("gives the message of a Vue 2 project", () => {
        fs.writeFileSync(path.join(project, "src", "main.js"), "import Vue from 'vue'\nnew Vue({ render: h => h(App) }).$mount('#app')\n");

        expect(errorMessage(thrown(() => component({ name: "Card", cwd: project })))).toMatch(/This is a Vue 2 project/);
    });

    it("gives the message of vueg's own errors", () => {
        expect(errorMessage(thrown(() => view({ name: "Home", cwd: project })))).toMatch(/^No router found/);
    });

    it("gives the message of any other error", () => {
        expect(errorMessage(new Error("disk full"))).toBe("disk full");
        expect(errorMessage("oops")).toBe("oops");
    });

    it("prints nothing, doesn't exit, and restores the console and process.exit", () => {
        const log = console.log;
        const exit = process.exit;
        const error = thrown(() => component({ name: "Card", style: "styl" as never, cwd: project }));
        vi.mocked(console.log).mockClear();
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        errorMessage(error);
        errorMessage({ errno: 0xFFFF });

        expect(console.log).not.toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
        expect(console.log).toBe(log);
        expect(process.exit).toBe(exit);
    });
});
