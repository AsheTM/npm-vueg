#!/usr/bin/env node
import { errorHandler, type VuegcError } from "vuegc";
import { getValue } from "./args";
import { generateComponent } from "./component";
import { mainHelp, componentHelp } from "./help";

/** Commands of vueg, more to come (view, service…). */
const COMMANDS = ["component"] as const;

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

    switch(command) {
        case "component":
            if(wantsHelp) {
                print(componentHelp());
                return 0;
            }
            try {
                generateComponent(flags);
                return 0;
            } catch(err) {
                // Same messages and exit code 1 as the vuegc command
                errorHandler(err as VuegcError);
            }
        default:
            print(`\t[!] Unknown command "${ command }", use one of: ${ COMMANDS.join(", ") } [!]`);
            print(mainHelp());
            return 1;
    }
}

// Run the CLI only when launched as a command, not when imported
if(require.main === module)
    process.exitCode = run(process.argv.slice(2));
