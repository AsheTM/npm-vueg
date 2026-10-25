import path from "node:path";
import { vuegc, type VuegcOptions } from "vuegc";
import { componentOptions } from "./component";
import { vuegError } from "./errors";

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
 * `vueg view`: generate the view with vuegc.
 * @returns Path of the generated view. Throws vueg's and vuegc's errors.
 */
export function generateView(flags: readonly string[], cwd: string = process.cwd()): string {
    return vuegc(viewOptions(flags, cwd));
}
