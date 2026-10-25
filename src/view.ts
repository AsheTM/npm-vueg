import fs from "node:fs";
import path from "node:path";
import { vuegc, type VuegcOptions } from "vuegc";
import { getValue, isOn } from "./args";
import { componentOptions } from "./component";
import { vuegError } from "./errors";
import { kebab, planRoute, type RoutePlan } from "./router";

/** Folder of the views, inside src/. */
export const VIEWS = "views";

/** A relative folder that stays inside views/ (no "..", not absolute). */
function isInsideViews(folder: string): boolean {
    if(path.isAbsolute(folder))
        return false;
    const relative = path.relative(VIEWS, path.join(VIEWS, folder));
    return relative !== ".." && !relative.startsWith(".." + path.sep);
}

/**
 * `vueg view` flags → `vuegc()` options: the same as `vueg component`,
 * with `--path` as a sub-folder of `src/views/`.
 */
export function viewOptions(flags: readonly string[], cwd: string = process.cwd()): VuegcOptions {
    const options = componentOptions(flags, cwd);
    const folder = options.path;

    if(folder === undefined)
        return { ...options, path: VIEWS };
    // A --path without value is passed on as true by componentOptions()
    if(typeof folder !== "string" || !isInsideViews(folder))
        throw vuegError(`Path "${ typeof folder === "string" ? folder : "" }" must be a folder inside src/${ VIEWS }/, e.g. --path admin`);
    return { ...options, path: path.posix.join(VIEWS, folder.split(path.sep).join("/")) };
}

/**
 * The route of the view: `--route /path`, or by default the view's folder and name in kebab-case
 * (`--name AdminUsers --path admin` → `/admin/admin-users`).
 */
export function viewRoute(flags: readonly string[], options: VuegcOptions): { route: string; routeName: string; viewFile: string } {
    const base = options.name.replace(/\.vue$/, "");
    const folder = (options.path ?? VIEWS).slice(VIEWS.length).replace(/^\//, "");
    const viewFile = path.join(options.cwd ?? process.cwd(), "src", options.path ?? VIEWS, base + ".vue");
    const routeName = base.charAt(0).toUpperCase() + base.slice(1);

    const value = getValue(flags, "--route");
    if(value === null)
        return { route: "/" + [folder, kebab(base)].filter(part => part).join("/"), routeName, viewFile };
    if(value === true || !value.startsWith("/"))
        throw vuegError(`--route needs a path starting with "/", e.g. --route /home`);
    return { route: value, routeName, viewFile };
}

/**
 * `vueg view`: generate the view with vuegc, then add its route to the router (unless --no-route).
 * The route is planned (checked) before anything is written, and the router is only written
 * once the view is generated: a failure never leaves a view without route or a route without view.
 * @returns Path of the generated view. Throws vueg's and vuegc's errors.
 */
export function generateView(flags: readonly string[], cwd: string = process.cwd()): string {
    const options = viewOptions(flags, cwd);
    let plan: RoutePlan | null = null;
    if(!isOn(getValue(flags, "--no-route"))) {
        const { route, routeName, viewFile } = viewRoute(flags, options);
        plan = planRoute(cwd, viewFile, routeName, route);
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
    return file;
}
