#!/usr/bin/env node
import { mainHelp, componentHelp } from "./help";

/** Commands of vueg, more to come (view, service…). */
const COMMANDS = ["component"] as const;

/**
 * Run vueg with the command line arguments (without `node` and the script).
 * @returns The exit code.
 */
export function run(args: readonly string[], print: (text: string) => void = console.log): number {
    const [command] = args;

    // vueg, vueg help, vueg --help, vueg -h
    if(command === undefined || command === "help" || command === "--help" || command === "-h") {
        print(mainHelp());
        return 0;
    }

    switch(command) {
        case "component":
            // Generation comes with vuegc: help only for now
            print(componentHelp());
            return 0;
        default:
            print(`\t[!] Unknown command "${ command }", use one of: ${ COMMANDS.join(", ") } [!]`);
            print(mainHelp());
            return 1;
    }
}

// Run the CLI only when launched as a command, not when imported
if(require.main === module)
    process.exitCode = run(process.argv.slice(2));
