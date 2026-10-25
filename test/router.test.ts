import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { stripTypeScriptTypes } from "node:module";
import { findRoutesArray, kebab, planRoute } from "../src/router";
import { createVueProject, removeFolder } from "./support/vue-project";

// Router files found in Vue 2 projects: [label, file inside src/, content]
const ROUTERS: [string, string, string][] = [
    ["Vue CLI default", "router/index.js", `import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting [about]
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = new VueRouter({ mode: 'history', routes })

export default router
`],
    ["empty routes", "router/index.js", `import VueRouter from 'vue-router'

const routes = []

export default new VueRouter({ routes })
`],
    ["inline routes option", "router.js", `import VueRouter from 'vue-router'
import Home from './views/Home.vue'

export default new VueRouter({ routes: [{ path: '/', component: Home }] })
`],
    ["TypeScript, double quotes, 4 spaces, trailing comma", "router/index.ts", `import VueRouter, { RouteConfig } from "vue-router";

const routes: Array<RouteConfig> = [
    {
        path: "/",
        name: "Home",
        component: () => import("../views/Home.vue"),
    },
];

export default new VueRouter({ routes });
`],
    ["comment after the last route", "router/index.js", `import VueRouter from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') }
  // more routes later, see [docs]
]

export default new VueRouter({ routes })
`],
    ["brackets inside strings", "router/index.js", `import VueRouter from 'vue-router'

const routes = [
  { path: '/files/:path(.*)', name: 'Files', component: () => import('../views/Files.vue'), meta: { title: 'Files ] [' } }
]

export default new VueRouter({ routes })
`],
    ["Windows line endings", "router/index.js", "import VueRouter from 'vue-router'\r\n\r\nconst routes = [\r\n  {\r\n    path: '/',\r\n    name: 'Home',\r\n    component: () => import('../views/Home.vue')\r\n  }\r\n]\r\n\r\nexport default new VueRouter({ routes })\r\n"],
    ["routes typed with brackets", "router/index.ts", `import VueRouter, { RouteConfig } from 'vue-router'

const routes: RouteConfig[] = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') }
]

export default new VueRouter({ routes })
`],
];

/**
 * Syntax errors of a router file, checked by Node itself:
 * TypeScript types stripped by Node (fails on invalid syntax), then `node --check` on the ES module.
 */
function syntaxErrors(file: string, content: string): string[] {
    let code = content;
    if(file.endsWith(".ts")) {
        try {
            code = stripTypeScriptTypes(content);
        } catch(err) {
            return [(err as Error).message];
        }
    }
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "vueg-check-")), "router.mjs");
    fs.writeFileSync(tmp, code);
    const result = spawnSync(process.execPath, ["--check", tmp], { encoding: "utf-8" });
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
    return result.status === 0 ? [] : [result.stderr.split("\n").find(line => line.includes("Error")) ?? result.stderr];
}

describe("kebab()", () => {
    it.each([
        ["Home", "home"], ["HelloWorld", "hello-world"], ["helloWorld", "hello-world"],
        ["UserProfile2", "user-profile2"], ["HTMLPage", "html-page"],
    ])("%s -> %s", (name, expected) => {
        expect(kebab(name)).toBe(expected);
    });
});

describe("findRoutesArray()", () => {
    it("finds the closing bracket, skipping brackets in strings and comments", () => {
        const source = `const routes = [ { path: '/a]' }, /* ] */ // ]\n ]; const other = []`;
        const array = findRoutesArray(source)!;

        expect(source[array.open]).toBe("[");
        expect(source.slice(array.close)).toBe("]; const other = []");
    });

    it("returns null without a routes array", () => {
        expect(findRoutesArray("export default new VueRouter({ mode: 'history' })")).toBeNull();
    });
});

describe("planRoute() on real router files", () => {
    let project: string;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it.each(ROUTERS)("%s", (_label, file, content) => {
        const routerFile = path.join(project, "src", file);
        fs.mkdirSync(path.dirname(routerFile), { recursive: true });
        fs.writeFileSync(routerFile, content);
        const viewFile = path.join(project, "src", "views", "admin", "UserProfile.vue");

        const plan = planRoute(project, viewFile, "UserProfile", "/admin/user-profile");

        // Still valid code, the new route is there, everything else unchanged
        expect(syntaxErrors(file, plan.content)).toEqual([]);
        expect(plan.content).toContain("/admin/user-profile");
        expect(plan.content.replace(/\r\n/g, "\n")).toMatchSnapshot();
        // Line endings of the file are kept
        expect(plan.content.includes("\r\n")).toBe(content.includes("\r\n"));
        // planRoute() writes nothing
        expect(fs.readFileSync(routerFile, "utf-8")).toBe(content);
    });

    it("imports the view relatively to the router file", () => {
        fs.writeFileSync(path.join(project, "src", "router.js"), "const routes = []\n");

        const plan = planRoute(project, path.join(project, "src", "views", "Home.vue"), "Home", "/home");

        expect(plan.content).toContain("import('./views/Home.vue')");
    });
});

describe("planRoute() errors", () => {
    let project: string;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    const view = () => path.join(project, "src", "views", "Home.vue");
    const router = (content: string) => {
        fs.mkdirSync(path.join(project, "src", "router"));
        fs.writeFileSync(path.join(project, "src", "router", "index.js"), content);
    };
    const error = (fn: () => unknown) => {
        try {
            fn();
        } catch(err) {
            return (err as { message: string }).message;
        }
        return null;
    };

    it("no router", () => {
        expect(error(() => planRoute(project, view(), "Home", "/home"))).toMatch(/No router found .* use --no-route/);
    });

    it("no routes array", () => {
        router("export default new VueRouter({ mode: 'history' })\n");
        expect(error(() => planRoute(project, view(), "Home", "/home"))).toMatch(/No routes array found in src\/router\/index\.js/);
    });

    it("route path already used", () => {
        router("const routes = [{ path: '/home', name: 'Start' }]\n");
        expect(error(() => planRoute(project, view(), "Home", "/home"))).toMatch(/Route "\/home" already exists/);
    });

    it("route name already used", () => {
        router('const routes = [{ path: "/start", name: "Home" }]\n');
        expect(error(() => planRoute(project, view(), "Home", "/home"))).toMatch(/A route named "Home" already exists/);
    });
});
