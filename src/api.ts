// Library API: vueg's commands as functions, with options instead of flags
import { vuegc, errorHandler, type VuegcOptions, type VuegcError } from "vuegc";
import { isVuegError } from "./errors";
import { createView, viewPath, type ViewResult } from "./view";

export type { VuegcStyle, VuegcTemplate } from "vuegc";
export type { ViewResult, ViewRoute } from "./view";

/** Options of `component()`: vuegc's options (`dryRun` → `--dry-run`, `cssModule` → `--module`, …). */
export type ComponentOptions = VuegcOptions;

/** Options of `view()`: the same as `component()`, with `path` inside `src/views/` and the route. */
export interface ViewOptions extends ComponentOptions {
    /** Sub-folder of `src/views/`, created if missing. Must stay inside it. @default "" (src/views/) */
    path?: string;
    /** Route path, starting with "/"; false for no route. @default the view's folder and name in kebab-case, e.g. "/admin/user-profile" */
    route?: string | false;
}

/**
 * Generate a component, like `vueg component`.
 * @returns Path of the generated component (also with `dryRun`, where nothing is written).
 * @throws An error for `errorMessage()`: invalid options, not a Vue 3 project, component already exists (without `force`).
 */
export function component(options: ComponentOptions): string {
    return vuegc(options);
}

/**
 * Generate a view in `src/views/` and add its route to the router, like `vueg view`.
 * The route is checked before anything is written: on error, the project is left unchanged.
 * @returns Path of the view, and the route added (null with `route: false`).
 * @throws An error for `errorMessage()`: the errors of `component()`, a path outside `src/views/`, an invalid route,
 * no router or routes array, a route path or name that already exists.
 */
export function view(options: ViewOptions): ViewResult {
    const { route, ...rest } = options;
    const cwd = options.cwd ?? process.cwd();
    return createView({ ...rest, cwd, path: viewPath(options.path) }, route ?? null, cwd);
}

/** Thrown in place of process.exit() while errorHandler() runs. */
const EXIT = Symbol("exit");

/**
 * The message of an error thrown by `component()` or `view()`: the same as the CLI prints, e.g.
 * "Component already exists, use --force to overwrite it". Prints nothing and doesn't exit.
 */
export function errorMessage(err: unknown): string {
    if(isVuegError(err))
        return err.message;

    // vuegc keeps its messages in errorHandler(), which prints them and exits: run it with both intercepted
    const lines: string[] = [];
    const { log, error } = console;
    const { exit } = process;
    console.log = (...args: unknown[]) => { lines.push(args.join(" ")); };
    console.error = () => {};
    process.exit = (() => { throw EXIT; }) as typeof process.exit;
    try {
        errorHandler(err as VuegcError);
    } catch(caught) {
        if(caught !== EXIT)
            throw caught;
    } finally {
        console.log = log;
        console.error = error;
        process.exit = exit;
    }

    const message = lines.find(line => line.includes("[!]"));
    if(message)
        return message.replace(/^\s*\[!\]\s*/, "").replace(/\s*\[!\]\s*$/, "");
    // Not one of vuegc's errors (printed as is by the CLI)
    return err instanceof Error ? err.message : String(err);
}
