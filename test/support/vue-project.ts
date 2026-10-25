// Shared tools for the CLI tests: a throwaway Vue 3 project and a way to run a CLI in it
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

/** The built vueg CLI (npm test builds it first, see "pretest"). */
export const VUEG = path.join(__dirname, "..", "..", "dist", "vueg.js");

/** Create a minimal Vue 3 project in a temporary folder (like create-vue), returns its root. */
export function createVueProject(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vueg-test-"));
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(path.join(root, "src", "main.js"), "import { createApp } from 'vue'\nimport App from './App.vue'\nimport router from './router'\n\nconst app = createApp(App)\napp.use(router)\napp.mount('#app')\n");
    fs.writeFileSync(path.join(root, "src", "App.vue"), "<template><RouterView /></template>\n");
    return root;
}

/** The router of a create-vue project (Vue Router 4, src/router/index.js): routes inline in createRouter(). */
export const VUE_ROUTER = `import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
`;

/** Add src/router/index.js to a project, returns its path. */
export function addRouter(root: string, content: string = VUE_ROUTER): string {
    const file = path.join(root, "src", "router", "index.js");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
}

export function removeFolder(folder: string): void {
    fs.rmSync(folder, { recursive: true, force: true });
}

/** Run a CLI script in a folder, like a user would. */
export function runScript(script: string, cwd: string, args: string[] = []): { status: number | null; stdout: string } {
    const result = spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf-8" });
    return { status: result.status, stdout: result.stdout + result.stderr };
}

/** Read a generated component (path relative to src/), or null if it doesn't exist. */
export function readComponent(root: string, file: string): string | null {
    const full = path.join(root, "src", file);
    return fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : null;
}
