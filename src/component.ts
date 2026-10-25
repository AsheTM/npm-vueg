import { vuegc, type VuegcOptions, type VuegcStyle } from "vuegc";
import { getValue, isOn, parseList } from "./args";

/**
 * A flag value passed on to vuegc: absent → `undefined` (vuegc's default).
 * A flag without value (`true`) is passed as is: vuegc validates it at runtime and reports it,
 * exactly like the vuegc command does.
 */
function passOn(value: string | true | null): string | undefined {
    return value === null ? undefined : value as string;
}

/**
 * `vueg component` flags → `vuegc()` options. Same flags and same defaults as the vuegc command.
 * Only the required `--name` is checked here; everything else is validated by vuegc.
 */
export function componentOptions(flags: readonly string[], cwd: string = process.cwd()): VuegcOptions {
    const name = getValue(flags, "--name");
    if(typeof name !== "string")
        throw { errno: 0x0003, flag: "name", exit: true };

    const props = getValue(flags, "--props");
    return {
        name,
        style:      passOn(getValue(flags, "--style")) as VuegcStyle | undefined,
        scoped:     getValue(flags, "--scoped") !== "false",
        path:       passOn(getValue(flags, "--path")),
        blank:      isOn(getValue(flags, "--blank")),
        force:      isOn(getValue(flags, "--force")),
        dryRun:     isOn(getValue(flags, "--dry-run")),
        noTemplate: isOn(getValue(flags, "--no-template")),
        noScript:   isOn(getValue(flags, "--no-script")),
        noStyle:    isOn(getValue(flags, "--no-style")),
        props:      props === null ? undefined : parseList(props),
        cssModule:  isOn(getValue(flags, "--module")),
        cwd,
    };
}

/**
 * `vueg component`: generate the component with vuegc.
 * @returns Path of the generated component. Throws vuegc's errors.
 */
export function generateComponent(flags: readonly string[], cwd: string = process.cwd()): string {
    return vuegc(componentOptions(flags, cwd));
}
