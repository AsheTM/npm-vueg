import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { serviceBase, serviceContent } from "../src/service";
import { service, errorMessage } from "../src/vueg";
import { VUEG, createVueProject, removeFolder, runScript, readComponent } from "./support/vue-project";

// What a function throws (errors here are plain objects, not Error)
function thrown(fn: () => unknown): unknown {
    try {
        fn();
    } catch(err) {
        return err;
    }
    return null;
}

const files = (project: string, folder = "services") => {
    const dir = path.join(project, "src", folder);
    return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
};

describe("serviceBase() (the file name)", () => {
    it.each([
        { name: "User",                 base: "user" },
        { name: "user",                 base: "user" },
        { name: "UserProfile",          base: "user-profile" },
        { name: "user-profile",         base: "user-profile" },
        { name: "user.service",         base: "user" },
        { name: "user.service.ts",      base: "user" },
        { name: "API2Client",           base: "api2-client" },
    ])("$name -> $base", ({ name, base }) => {
        expect(serviceBase(name)).toBe(base);
    });

    it.each(["2fa", "user profile", "admin/user", "-user"])("rejects %s", (name) => {
        expect(thrown(() => serviceBase(name))).toMatchObject({ vueg: true, message: expect.stringContaining(`Invalid service name "${ name }"`) });
    });
});

describe("vueg service (CLI)", () => {
    let project: string;

    beforeEach(() => { project = createVueProject(); });
    afterEach(() => { removeFolder(project); });

    it("writes src/services/<name>.service.js with the API calls", () => {
        const { status, stdout } = runScript(VUEG, project, ["service", "--name", "User"]);

        expect(status).toBe(0);
        expect(stdout).toContain("> Service written: src/services/user.service.js");
        expect(files(project)).toEqual(["user.service.js"]);
        expect(readComponent(project, "services/user.service.js")).toBe(serviceContent("user", false, false));
    });

    it("calls /api/<name> with fetch, and exports the 5 functions", () => {
        runScript(VUEG, project, ["service", "--name", "UserProfile"]);
        const content = readComponent(project, "services/user-profile.service.js")!;

        expect(content).toContain('const BASE_URL = "/api/user-profile";');
        expect(content).toContain("const response = await fetch(BASE_URL + path, {");
        expect(content.match(/^export function (\w+)/gm)).toEqual([
            "export function getAll", "export function getById", "export function create", "export function update", "export function remove",
        ]);
        expect(content).not.toMatch(/: Promise|<T/);
    });

    it("writes a typed .service.ts with --ts", () => {
        runScript(VUEG, project, ["service", "--name", "User", "--ts"]);
        const content = readComponent(project, "services/user.service.ts")!;

        expect(files(project)).toEqual(["user.service.ts"]);
        expect(content).toContain('async function request<T>(path = "", options: RequestInit = {}): Promise<T> {');
        expect(content).toContain("export function getById<T = unknown>(id: string | number): Promise<T> {");
        expect(content).toContain("export function remove(id: string | number): Promise<void> {");
    });

    it("writes the Vitest test next to it with --test, fetch stubbed", () => {
        const { stdout } = runScript(VUEG, project, ["service", "--name", "User", "--test"]);
        const test = readComponent(project, "services/user.service.spec.js")!;

        expect(stdout).toContain("> Test written: src/services/user.service.spec.js");
        expect(files(project)).toEqual(["user.service.js", "user.service.spec.js"]);
        expect(test).toContain('import { getAll, getById, create, remove } from "./user.service";');
        expect(test).toContain('vi.stubGlobal("fetch", fetch);');
        expect(test).toContain('.rejects.toThrow("GET /api/user/1 failed: 404");');
    });

    it("writes .service.spec.ts with --ts --test", () => {
        runScript(VUEG, project, ["service", "--name", "User", "--ts", "--test"]);

        expect(files(project)).toEqual(["user.service.spec.ts", "user.service.ts"]);
        expect(readComponent(project, "services/user.service.spec.ts")).toContain("function mockFetch(status: number, body: unknown) {");
    });

    it("writes an empty module (and a todo test) with --blank", () => {
        runScript(VUEG, project, ["service", "--name", "User", "--blank", "--test"]);

        expect(readComponent(project, "services/user.service.js")).toBe("// user service\nexport {};\n");
        expect(readComponent(project, "services/user.service.spec.js")).toContain('it.todo("test the service\'s functions");');
    });

    it("puts the service in the --path folder inside src/", () => {
        const { stdout } = runScript(VUEG, project, ["service", "--name", "User", "--path", "api/v2"]);

        expect(stdout).toContain("> Service written: src/api/v2/user.service.js");
        expect(files(project, "api/v2")).toEqual(["user.service.js"]);
    });

    it("prints the files with --dry-run, and writes nothing", () => {
        const { status, stdout } = runScript(VUEG, project, ["service", "--name", "User", "--test", "--dry-run"]);

        expect(status).toBe(0);
        expect(stdout).toContain("> Dry run, nothing written: src/services/user.service.js\n\n// user service");
        expect(stdout).toContain("> Dry run, nothing written: src/services/user.service.spec.js");
        expect(fs.existsSync(path.join(project, "src", "services"))).toBe(false);
    });

    it.each([
        { label: "the service", file: "user.service.js" },
        { label: "its test",    file: "user.service.spec.js" },
    ])("writes nothing if $label exists, and names it; --force overwrites", ({ file }) => {
        fs.mkdirSync(path.join(project, "src", "services"));
        fs.writeFileSync(path.join(project, "src", "services", file), "my own work");

        const refused = runScript(VUEG, project, ["service", "--name", "User", "--test"]);
        expect(refused.status).toBe(1);
        expect(refused.stdout).toContain(`src/services/${ file } already exists, use --force to overwrite it`);
        expect(files(project)).toEqual([file]);

        expect(runScript(VUEG, project, ["service", "--name", "User", "--test", "--force"]).status).toBe(0);
        expect(readComponent(project, `services/${ file }`)).not.toBe("my own work");
    });

    it.each([
        { label: "missing --name",          args: ["--ts"],                                 message: "Flag name required" },
        { label: "an invalid name",         args: ["--name", "2fa"],                        message: 'Invalid service name "2fa"' },
        { label: "a path outside src/",     args: ["--name", "User", "--path", ".."],       message: 'Path ".." must be a folder inside src/' },
        { label: "--path without value",    args: ["--name", "User", "--path"],             message: 'Path "" must be a folder inside src/' },
    ])("fails on $label, and writes nothing", ({ args, message }) => {
        const { status, stdout } = runScript(VUEG, project, ["service", ...args]);

        expect(status).toBe(1);
        expect(stdout).toContain(message);
        expect(fs.readdirSync(path.join(project, "src")).sort()).toEqual(["App.vue", "main.js"]);
    });

    it("fails outside a Vue project (no src/)", () => {
        fs.rmSync(path.join(project, "src"), { recursive: true });
        const { status, stdout } = runScript(VUEG, project, ["service", "--name", "User"]);

        expect(status).toBe(1);
        expect(stdout).toContain("It is not the root of Vue project");
        expect(fs.readdirSync(project)).toEqual([]);
    });

    it.each([
        { label: "without Vitest",  pkg: { devDependencies: { vite: "^7.0.0" } },     hint: true },
        { label: "with Vitest",     pkg: { devDependencies: { vitest: "^4.0.0" } },   hint: false },
    ])("hints to install Vitest with --test, $label", ({ pkg, hint }) => {
        fs.writeFileSync(path.join(project, "package.json"), JSON.stringify(pkg));
        const { stdout } = runScript(VUEG, project, ["service", "--name", "User", "--test"]);

        expect(stdout.includes("Tests run with Vitest: npm install -D vitest")).toBe(hint);
    });

    it("shows its help, and is listed in the main help", () => {
        expect(runScript(VUEG, project, ["service"]).stdout).toContain("vueg service --name User [--path folder]");
        expect(runScript(VUEG, project, ["--help"]).stdout).toContain("service:        Generate a service (API calls) in src/services/");
    });
});

describe("service() (library)", () => {
    let project: string;

    beforeEach(() => {
        project = createVueProject();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
        removeFolder(project);
    });

    it("writes the service and returns its path", () => {
        expect(service({ name: "User", ts: true, test: true, cwd: project })).toBe(path.join(project, "src", "services", "user.service.ts"));
        expect(files(project)).toEqual(["user.service.spec.ts", "user.service.ts"]);
    });

    it("returns the path without writing anything with dryRun", () => {
        expect(service({ name: "User", dryRun: true, cwd: project })).toBe(path.join(project, "src", "services", "user.service.js"));
        expect(files(project)).toEqual([]);
    });

    it.each([
        { label: "an invalid name",     options: { name: "user profile" },  message: 'Invalid service name "user profile": letters, digits, - and _ only, starting with a letter' },
        { label: "a path outside src/", options: { name: "User", path: "../x" }, message: 'Path "../x" must be a folder inside src/, e.g. --path components' },
    ])("throws an error for errorMessage() on $label", ({ options, message }) => {
        expect(errorMessage(thrown(() => service({ ...options, cwd: project })))).toBe(message);
    });

    it("throws EEXIST with the existing file", () => {
        service({ name: "User", cwd: project });

        const error = thrown(() => service({ name: "User", cwd: project }));
        expect(error).toMatchObject({ code: "EEXIST", file: "src/services/user.service.js" });
        expect(errorMessage(error)).toBe("src/services/user.service.js already exists, use --force to overwrite it");
    });
});
