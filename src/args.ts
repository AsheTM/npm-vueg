/**
 * Value of a flag in the command line arguments:
 * - the next argument (`--name Card` → `"Card"`),
 * - `true` when the flag has no value (last argument, or followed by another flag),
 * - `null` when the flag is absent.
 * The last occurrence wins, like in vuegc.
 */
export function getValue(args: readonly string[], flag: string): string | true | null {
    const index = args.lastIndexOf(flag);
    if (index === -1)
        return null;
    const next = args[index + 1];
    return next === undefined || next.startsWith("-") ? true : next;
}

/** A boolean flag is on when present, unless its value is `"false"`. */
export function isOn(value: string | true | null): boolean {
    return value !== null && value !== "false";
}

/**
 * `"title, items,title"` → `["title", "items"]`.
 * A flag without value (`true`) gives `[""]`, so the invalid name is reported by vuegc.
 */
export function parseList(value: string | true): string[] {
    if (value === true)
        return [""];
    return [...new Set(value.split(",").map(item => item.trim()).filter(item => item))];
}
