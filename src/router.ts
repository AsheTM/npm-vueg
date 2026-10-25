import fs from "node:fs";
import path from "node:path";
import { vuegError } from "./errors";

/** Where Vue 2 projects keep their router, relative to src/ (first found wins). */
export const ROUTER_FILES = ["router/index.js", "router/index.ts", "router.js", "router.ts"];

/** A route to add, and the router file once it's added. */
export interface RoutePlan {
    /** Router file (absolute). */
    file: string;
    /** Route path, e.g. "/admin/users". */
    route: string;
    /** The route object as inserted. */
    snippet: string;
    /** Content of the router file with the route added. */
    content: string;
}

/** "HelloWorld" -> "hello-world" */
export function kebab(name: string): string {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
}

/** Router file of the project, or null. */
export function findRouter(cwd: string): string | null {
    for(const file of ROUTER_FILES) {
        const full = path.join(cwd, "src", file);
        if(fs.existsSync(full))
            return full;
    }
    return null;
}

/**
 * Position of the routes array: `const routes = [ … ]` (with or without a TS type) or `routes: [ … ]`.
 * Brackets inside strings and comments are skipped. Returns null if not found or not closed.
 */
export function findRoutesArray(source: string): { open: number; close: number } | null {
    const match = /\broutes\s*(?::[^=;]*)?=\s*\[/.exec(source) ?? /\broutes\s*:\s*\[/.exec(source);
    if(!match)
        return null;
    const open = match.index + match[0].length - 1;
    let depth = 0;
    for(let i = open; i < source.length; i++) {
        const char = source[i];
        // Skip strings and comments
        if(char === "'" || char === '"' || char === "`") {
            i = skipString(source, i);
            continue;
        }
        if(char === "/" && source[i + 1] === "/") {
            i = source.indexOf("\n", i);
            if(i === -1)
                return null;
            continue;
        }
        if(char === "/" && source[i + 1] === "*") {
            i = source.indexOf("*/", i + 2) + 1;
            if(i === 0)
                return null;
            continue;
        }
        if(char === "[")
            depth++;
        else if(char === "]" && --depth === 0)
            return { open, close: i };
    }
    return null;
}

/** Index of the last character of code (not whitespace, not in a comment), or -1. */
function lastCodeIndex(text: string): number {
    let last = -1;
    for(let i = 0; i < text.length; i++) {
        const char = text[i];
        if(char === "/" && text[i + 1] === "/") {
            const end = text.indexOf("\n", i);
            i = end === -1 ? text.length : end;
            continue;
        }
        if(char === "/" && text[i + 1] === "*") {
            const end = text.indexOf("*/", i + 2);
            i = end === -1 ? text.length : end + 1;
            continue;
        }
        if(char === "'" || char === '"' || char === "`") {
            i = skipString(text, i);
            last = i;
            continue;
        }
        if(!/\s/.test(char))
            last = i;
    }
    return last;
}

/** Index of the closing quote of the string starting at `start`. */
function skipString(source: string, start: number): number {
    const quote = source[start];
    for(let i = start + 1; i < source.length; i++) {
        if(source[i] === "\\")
            i++;
        else if(source[i] === quote)
            return i;
    }
    return source.length;
}

/** Indentation and quotes used by the routes already in the array (defaults: 2 spaces, single quotes). */
function detectStyle(source: string, inside: string): { indent: string; unit: string; quote: string } {
    const lines = inside.split("\n").filter(line => line.trim());
    const indent = lines.length ? /^\s*/.exec(lines[0])![0] : "  ";
    const deeper = lines.find(line => /^\s*/.exec(line)![0].length > indent.length);
    const unit = deeper ? /^\s*/.exec(deeper)![0].slice(indent.length) : indent || "  ";
    const quote = (source.match(/"/g)?.length ?? 0) > (source.match(/'/g)?.length ?? 0) ? '"' : "'";
    return { indent: indent || "  ", unit, quote };
}

/**
 * Plan the route of a view, without writing anything: finds the router and the routes array,
 * checks the route doesn't exist yet. Throws a vueg error otherwise.
 * @param viewFile Absolute path of the view (where vuegc writes it).
 */
export function planRoute(cwd: string, viewFile: string, routeName: string, route: string): RoutePlan {
    const file = findRouter(cwd);
    if(!file)
        throw vuegError(`No router found (src/${ ROUTER_FILES.join(", src/") }): install vue-router or use --no-route`);

    const source = fs.readFileSync(file, "utf-8");
    const shown = path.relative(cwd, file).split(path.sep).join("/");
    const array = findRoutesArray(source);
    if(!array)
        throw vuegError(`No routes array found in ${ shown }: add the route by hand or use --no-route`);

    const inside = source.slice(array.open + 1, array.close);
    const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    if(new RegExp(`path\\s*:\\s*['"\`]${ escaped(route) }['"\`]`).test(inside))
        throw vuegError(`Route "${ route }" already exists in ${ shown }: use --route or --no-route`);
    if(new RegExp(`name\\s*:\\s*['"\`]${ escaped(routeName) }['"\`]`).test(inside))
        throw vuegError(`A route named "${ routeName }" already exists in ${ shown }: use --no-route`);

    // Lazy import: no import line to add at the top of the router
    let importPath = path.relative(path.dirname(file), viewFile).split(path.sep).join("/");
    if(!importPath.startsWith("."))
        importPath = "./" + importPath;

    const eol = source.includes("\r\n") ? "\r\n" : "\n";
    const { indent, unit, quote } = detectStyle(source, inside.replace(/\r\n/g, "\n"));
    const q = (text: string) => quote + text + quote;

    // Insert after the last route (and after any comment following it): the comma goes right after
    // the last piece of code, never inside a comment; the closing bracket line is kept as is
    const before = inside.replace(/\s*$/, "");
    const tail = inside.slice(before.length);
    const lastCode = lastCodeIndex(before);
    // Trailing commas in the file (last route ends with ","): the new route gets them too
    const trailing = lastCode !== -1 && before[lastCode] === "," ? "," : "";

    const snippet = [
        `${ indent }{`,
        `${ indent }${ unit }path: ${ q(route) },`,
        `${ indent }${ unit }name: ${ q(routeName) },`,
        `${ indent }${ unit }component: () => import(${ q(importPath) })${ trailing }`,
        `${ indent }}${ trailing }`,
    ].join(eol);

    const needsComma = lastCode !== -1 && before[lastCode] !== ",";
    const head = needsComma ? before.slice(0, lastCode + 1) + "," + before.slice(lastCode + 1) : before;
    const closing = tail.includes("\n") ? tail.slice(tail.lastIndexOf("\n")) : eol;
    const newInside = `${ head }${ eol }${ snippet }${ closing }`;

    return {
        file,
        route,
        snippet,
        content: source.slice(0, array.open + 1) + newInside + source.slice(array.close),
    };
}
