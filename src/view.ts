import fs from "node:fs";
import path from "node:path";
import { vuegc, type VuegcOptions } from "vuegc";
import { getValue, isOn } from "./args";
import { componentOptions } from "./component";
import { vuegError } from "./errors";
import { kebab, planRoute, type RoutePlan } from "./router";

/** Folder of the views, inside src/. */
export const VIEWS = "views";

/** The route added for a view. */
export interface ViewRoute {
    /** Route path, e.g. "/admin/users". */
    path: string;
    /** Route name, in the router's casing, e.g. "AdminUsers" or "adminUsers". */
    name: string;
    /** Router file (absolute). */
    router: string;
}

/** What generating a view gives. */
export interface ViewResult {
    /** Path of the generated view. */
    file: string;
    /** The route added (with `dryRun`: the route that would be added), or null without route. */
    route: ViewRoute | null;
}

/** A relative folder that stays inside views/ (no "..", not absolute). */
function isInsideViews(folder: string): boolean {
    if(path.isAbsolute(folder))
        return false;
    const relative = path.relative(VIEWS, path.join(VIEWS, folder));
    return relative !== ".." && !relative.startsWith(".." + path.sep);
}

/**
 * The vuegc `path` of a view: `views/`, or a sub-folder of it.
 * A `--path` without value comes as `true`: rejected like any folder outside views/.
 */
export function viewPath(folder: string | true | undefined): string {
    if(folder === undefined)
        return VIEWS;
    if(typeof folder !== "string" || !isInsideViews(folder))
        throw vuegError(`Path "${ typeof folder === "string" ? folder : "" }" must be a folder inside src/${ VIEWS }/, e.g. --path admin`);
    return path.posix.join(VIEWS, folder.split(path.sep).join("/"));
}

/**
 * `vueg view` flags → `vuegc()` options: the same as `vueg component`,
 * with `--path` as a sub-folder of `src/views/`.
 */
export function viewOptions(flags: readonly string[], cwd: string = process.cwd()): VuegcOptions {
    const options = componentOptions(flags, cwd);
    // A --path without value is passed on as true by componentOptions()
    return { ...options, path: viewPath(options.path as string | true | undefined) };
}

/**
 * The route of the view: the given path (`--route /path`), or by default the view's folder and name in kebab-case
 * (`--name AdminUsers --path admin` → `/admin/admin-users`).
 */
export function viewRoute(value: string | true | null, options: VuegcOptions): { route: string; routeName: string; viewFile: string } {
    const base = options.name.replace(/\.vue$/, "");
    const folder = (options.path ?? VIEWS).slice(VIEWS.length).replace(/^\//, "");
    const viewFile = path.join(options.cwd ?? process.cwd(), "src", options.path ?? VIEWS, base + ".vue");
    const routeName = base.charAt(0).toUpperCase() + base.slice(1);

    if(value === null)
        return { route: "/" + [folder, kebab(base)].filter(part => part).join("/"), routeName, viewFile };
    if(value === true || !value.startsWith("/"))
        throw vuegError(`--route needs a path starting with "/", e.g. --route /home`);
    return { route: value, routeName, viewFile };
}

/**
 * Generate the view with vuegc, then add its route to the router (unless `route` is false).
 * The route is planned (checked) before anything is written, and the router is only written
 * once the view is generated: a failure never leaves a view without route or a route without view.
 * @param options vuegc options, `path` already inside views/ (see viewPath()).
 * @param route The route path, null for the default one, false for no route.
 * Throws vueg's and vuegc's errors.
 */
export function createView(options: VuegcOptions, route: string | true | null | false, cwd: string): ViewResult {
    let plan: RoutePlan | null = null;
    if(route !== false) {
        const { route: routePath, routeName, viewFile } = viewRoute(route, options);
        plan = planRoute(cwd, viewFile, routeName, routePath);
    }

    const file = vuegc(options);

    if(plan) {
        const shown = path.relative(cwd, plan.file).split(path.sep).join("/");
        if(options.dryRun) {
            console.log(`> Dry run, route not added to ${ shown }:\n`);
            console.log(plan.snippet + "\n");
        } else {
            fs.writeFileSync(plan.file, plan.content);
            console.log(`> Route ${ plan.route } added to ${ shown }`);
        }
    }
    return { file, route: plan && { path: plan.route, name: plan.name, router: plan.file } };
}

/**
 * `vueg view`: generate the view and add its route (unless --no-route).
 * @returns Path of the generated view. Throws vueg's and vuegc's errors.
 */
export function generateView(flags: readonly string[], cwd: string = process.cwd()): string {
    const route = isOn(getValue(flags, "--no-route")) ? false : getValue(flags, "--route");
    return createView(viewOptions(flags, cwd), route, cwd).file;
}
