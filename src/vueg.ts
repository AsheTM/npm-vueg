#!/usr/bin/env node
import { getValue } from "./args";
import { generateComponent } from "./component";
import { handleError } from "./errors";
import { mainHelp, componentHelp, viewHelp } from "./help";
import { generateView } from "./view";

/** Commands of vueg: their help, and what they generate (returns the path of the file). */
const COMMANDS: Record<string, { help: () => string; generate: (flags: readonly string[]) => string }> = {
    component:  { help: componentHelp,  generate: generateComponent },
    view:       { help: viewHelp,       generate: generateView },
};

/**
 * Run vueg with the command line arguments (without `node` and the script).
 * @returns The exit code.
 */
export function run(args: readonly string[], print: (text: string) => void = console.log): number {
    const [command, ...flags] = args;
    const wantsHelp = flags.length === 0 || getValue(flags, "--help") !== null || getValue(flags, "-h") !== null;

    // vueg, vueg help, vueg --help, vueg -h
    if(command === undefined || command === "help" || command === "--help" || command === "-h") {
        print(mainHelp());
        return 0;
    }

    const known = Object.hasOwn(COMMANDS, command) ? COMMANDS[command] : undefined;
    if(!known) {
        print(`\t[!] Unknown command "${ command }", use one of: ${ Object.keys(COMMANDS).join(", ") } [!]`);
        print(mainHelp());
        return 1;
    }

    if(wantsHelp) {
        print(known.help());
        return 0;
    }
    try {
        known.generate(flags);
        return 0;
    } catch(err) {
        // vuegc's errors keep vuegc's messages; exit code 1
        return handleError(err);
    }
}

// Run the CLI only when launched as a command, not when imported
if(require.main === module)
    process.exitCode = run(process.argv.slice(2));
