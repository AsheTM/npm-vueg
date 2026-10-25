// Shared tools for the CLI tests: a throwaway Vue 2 project and a way to run a CLI in it
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

/** The built vueg CLI (npm test builds it first, see "pretest"). */
export const VUEG = path.join(__dirname, "..", "..", "dist", "vueg.js");

/** Create a minimal Vue 2 project in a temporary folder, returns its root. */
export function createVueProject(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vueg-test-"));
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(path.join(root, "src", "main.js"), "import Vue from 'vue';\nnew Vue({ render: h => h(App) }).$mount('#app');\n");
    fs.writeFileSync(path.join(root, "src", "App.vue"), "<template><div id=\"app\"></div></template>\n");
    return root;
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
