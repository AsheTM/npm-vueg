const BANNER = String.raw`
__     ___   _ _____ ____
\ \   / / | | | ____/ ___|
 \ \ / /| | | |  _|| |  _
  \ V / | |_| | |__| |_| |
   \_/   \___/|_____\____|
`;

const FLAGS = "[--scoped [true|false]] [--style css] [--path folder] [--blank] [--force] [--dry-run] [--no-template|--no-script|--no-style] [--props title,items] [--module]";

/** Flags shared by `vueg component` and `vueg view`; only `--path` differs. */
function optionalFlags(pathLine: string): string {
    return `Optional flag(s):
--scoped:   Boolean for scoped tag on style inside the file.vue [Default: true]
--style:    Pre-processor CSS [Default: scss] [Value supported: css, scss, sass, less, stylus]
--path:     ${ pathLine }
--blank:    Empty template and style, without the demo content [Default: false]
--force:    Overwrite the file if it already exists [Default: false]
--dry-run:  Print the file instead of writing it [Default: false]
--no-template, --no-script, --no-style:
            Leave the section out (at least one must remain) [Default: false]
--props:    Comma-separated prop names, declared with an open type [Default: none]
--module:   CSS modules (<style module> + $style) instead of scoped [Default: false]`;
}

/** Help of `vueg`: the list of commands. */
export function mainHelp(): string {
    return `${ BANNER }
vueg <command>

Command(s):
component:      Generate a Vue component
view:           Generate a view (page) in src/views/

Run "vueg <command> --help" for the flags of a command.
`;
}

/** Help of `vueg component`. */
export function componentHelp(): string {
    return `${ BANNER }
vueg component --name HelloWorld.vue ${ FLAGS }

Required flag(s):
--name:     Name of the component

${ optionalFlags("Folder inside src/ for the component, created if missing [Default: src/]") }
`;
}

/** Help of `vueg view`. */
export function viewHelp(): string {
    return `${ BANNER }
vueg view --name Home ${ FLAGS } [--route /home] [--no-route]

The view is added to the routes of src/router/index.js (or router.js, .ts), lazy loaded.

Required flag(s):
--name:     Name of the view

${ optionalFlags("Folder inside src/views/ for the view, created if missing [Default: src/views/]") }
--route:    Path of the route [Default: /<path>/<name in kebab-case>]
--no-route: Generate the view only, leave the router as is [Default: false]
`;
}
