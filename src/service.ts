import fs from "node:fs";
import path from "node:path";
import { getValue, isOn } from "./args";
import { vuegError } from "./errors";
import { kebab } from "./router";

/** Default folder of the services, inside src/. */
export const SERVICES = "services";

/** Options of `service()`, like the flags of `vueg service`. */
export interface ServiceOptions {
    /** Service name: `User`, `user-profile`… The file is `<name in kebab-case>.service.js`. */
    name: string;
    /** Folder inside `src/`, created if missing. Must stay inside `src/`. @default "services" */
    path?: string;
    /** TypeScript: `.service.ts`, typed functions. @default false */
    ts?: boolean;
    /** Also write a Vitest test next to it: `.service.spec.js` (`.ts` with `ts`). @default false */
    test?: boolean;
    /** An empty module, without the API calls. @default false */
    blank?: boolean;
    /** Overwrite the service (and its test) if they exist. @default false */
    force?: boolean;
    /** Print the files instead of writing them; same checks as a real run. @default false */
    dryRun?: boolean;
    /** Root of the Vue project (the folder that contains `src/`). @default process.cwd() */
    cwd?: string;
}

/** A relative folder that stays inside src/ (no "..", not absolute). */
function isInsideSrc(folder: string): boolean {
    if(path.isAbsolute(folder))
        return false;
    const relative = path.relative("src", path.join("src", folder));
    return relative !== ".." && !relative.startsWith(".." + path.sep);
}

/** The file name of a service: User, user.service, user.service.ts → user */
export function serviceBase(name: string): string {
    const base = name.replace(/(\.service)?(\.[jt]s)?$/, "");
    if(!/^[A-Za-z][\w-]*$/.test(base))
        throw vuegError(`Invalid service name "${ name }": letters, digits, - and _ only, starting with a letter`);
    return kebab(base);
}

/** The service module: JSON requests to /api/<base> with fetch, or an empty module with blank. */
export function serviceContent(base: string, ts: boolean, blank: boolean): string {
    if(blank)
        return `// ${ base } service\nexport {};\n`;

    const id = ts ? "id: string | number" : "id";
    const data = ts ? "data: unknown" : "data";
    const generic = ts ? "<T = unknown>" : "";
    const returns = (type: string) => ts ? `: Promise<${ type }>` : "";
    const call = (type: string) => ts ? `request<${ type }>` : "request";
    return `// ${ base } service: the API calls about ${ base }
const BASE_URL = "/api/${ base }";

/** Send a request to the API and return its JSON (null for 204 No Content); throw on an HTTP error. */
async function request${ ts ? "<T>" : "" }(path = "", options${ ts ? ": RequestInit" : "" } = {})${ returns("T") } {
    const response = await fetch(BASE_URL + path, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers }
    });
    if (!response.ok) {
        throw new Error(\`\${options.method ?? "GET"} \${BASE_URL + path} failed: \${response.status}\`);
    }
    return ${ ts ? "(" : "" }response.status === 204 ? null : ${ ts ? "await " : "" }response.json()${ ts ? ") as T" : "" };
}

export function getAll${ generic }()${ returns("T[]") } {
    return ${ call("T[]") }();
}

export function getById${ generic }(${ id })${ returns("T") } {
    return ${ call("T") }(\`/\${id}\`);
}

export function create${ generic }(${ data })${ returns("T") } {
    return ${ call("T") }("", { method: "POST", body: JSON.stringify(data) });
}

export function update${ generic }(${ id }, ${ data })${ returns("T") } {
    return ${ call("T") }(\`/\${id}\`, { method: "PUT", body: JSON.stringify(data) });
}

export function remove(${ id })${ returns("void") } {
    return ${ call("void") }(\`/\${id}\`, { method: "DELETE" });
}
`;
}

/** The Vitest test of the service: fetch is stubbed, so no server is needed. */
export function serviceTestContent(base: string, ts: boolean, blank: boolean): string {
    if(blank)
        return `import { describe, it } from "vitest";

describe("${ base } service", () => {
    it.todo("test the service's functions");
});
`;

    return `import { describe, it, expect, vi, afterEach } from "vitest";
import { getAll, getById, create, remove } from "./${ base }.service";

// A fetch answering with the status and the JSON body
function mockFetch(status${ ts ? ": number" : "" }, body${ ts ? ": unknown" : "" }) {
    const fetch = vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });
    vi.stubGlobal("fetch", fetch);
    return fetch;
}

describe("${ base } service", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("gets all from /api/${ base }", async () => {
        const fetch = mockFetch(200, [{ id: 1 }]);

        expect(await getAll()).toEqual([{ id: 1 }]);
        expect(fetch).toHaveBeenCalledWith("/api/${ base }", expect.objectContaining({ headers: { "Content-Type": "application/json" } }));
    });

    it("creates with a POST of JSON", async () => {
        const fetch = mockFetch(201, { id: 1 });

        expect(await create({ name: "name" })).toEqual({ id: 1 });
        expect(fetch).toHaveBeenCalledWith("/api/${ base }", expect.objectContaining({ method: "POST", body: '{"name":"name"}' }));
    });

    it("returns null for 204 No Content", async () => {
        mockFetch(204, null);

        expect(await remove(1)).toBeNull();
    });

    it("throws on an HTTP error", async () => {
        mockFetch(404, null);

        await expect(getById(1)).rejects.toThrow("GET /api/${ base }/1 failed: 404");
    });
});
`;
}

/** Print how to install Vitest, when the project's package.json doesn't have it. */
function hintVitest(cwd: string): void {
    let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    try {
        pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8"));
    } catch {
        // No readable package.json: nothing to compare with
        return;
    }
    if(!("vitest" in { ...pkg.dependencies, ...pkg.devDependencies }))
        console.log("\t[!] Tests run with Vitest: npm install -D vitest [!]");
}

/**
 * Generate a service in `<cwd>/src/<path>/`, and its test with `test`.
 * Nothing is written if something is wrong: an invalid name or path, not a Vue project, an existing file (without `force`).
 * @returns Path of the service (also with `dryRun`, where nothing is written).
 * Throws vueg's and vuegc's errors (same messages).
 */
export function createService({ name, path: folder = SERVICES, ts = false, test = false, blank = false, force = false, dryRun = false, cwd = process.cwd() }: ServiceOptions): string {
    if(typeof name !== "string" || !name)
        throw { errno: 0x0003, flag: "name", exit: true };
    const base = serviceBase(name);
    // vuegc's errors: a path outside src/, not the root of a Vue project
    if(typeof folder !== "string" || !isInsideSrc(folder))
        throw { errno: 0x0005, path: typeof folder === "string" ? folder : "", exit: true };
    if(!fs.existsSync(path.join(cwd, "src")))
        throw { code: "ENOENT", exit: true };

    const extension = ts ? "ts" : "js";
    const dir = path.join(cwd, "src", folder);
    const files = [{ label: "Service", file: path.join(dir, `${ base }.service.${ extension }`), content: serviceContent(base, ts, blank) }];
    if(test)
        files.push({ label: "Test", file: path.join(dir, `${ base }.service.spec.${ extension }`), content: serviceTestContent(base, ts, blank) });
    const relative = (file: string) => path.relative(cwd, file).split(path.sep).join("/");

    // Nothing is written if one of the files exists, unless forced
    const existing = files.find(({ file }) => fs.existsSync(file));
    if(existing && !force)
        throw { code: "EEXIST", file: relative(existing.file), exit: true };

    for(const { label, file, content } of files) {
        if(dryRun) {
            console.log(`> Dry run, nothing written: ${ relative(file) }\n`);
            console.log(content);
        } else {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(file, content);
            console.log(`> ${ label } written: ${ relative(file) }`);
        }
    }
    if(test)
        hintVitest(cwd);
    return files[0].file;
}

/**
 * `vueg service`: generate the service (and its test).
 * @returns Path of the service. Throws vueg's and vuegc's errors.
 */
export function generateService(flags: readonly string[], cwd: string = process.cwd()): string {
    const name = getValue(flags, "--name");
    if(typeof name !== "string")
        throw { errno: 0x0003, flag: "name", exit: true };
    const folder = getValue(flags, "--path");
    if(folder === true)
        throw { errno: 0x0005, path: "", exit: true };
    return createService({
        name,
        path:   folder ?? undefined,
        ts:     isOn(getValue(flags, "--ts")),
        test:   isOn(getValue(flags, "--test")),
        blank:  isOn(getValue(flags, "--blank")),
        force:  isOn(getValue(flags, "--force")),
        dryRun: isOn(getValue(flags, "--dry-run")),
        cwd,
    });
}
