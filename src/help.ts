const BANNER = String.raw`
__     ___   _ _____ ____
\ \   / / | | | ____/ ___|
 \ \ / /| | | |  _|| |  _
  \ V / | |_| | |__| |_| |
   \_/   \___/|_____\____|
`;

/** Help of `vueg`: the list of commands. */
export function mainHelp(): string {
    return `${ BANNER }
vueg <command>

Command(s):
component:      Generate a Vue component

Run "vueg <command> --help" for the flags of a command.
`;
}

/** Help of `vueg component`. */
export function componentHelp(): string {
    return `${ BANNER }
vueg component --name HelloWorld.vue [--scoped [true|false]] [--style css] [--path components] [--blank] [--force] [--dry-run] [--no-template|--no-script|--no-style] [--props title,items] [--module]

Required flag(s):
--name:     Name of the component

Optional flag(s):
--scoped:   Boolean for scoped tag on style inside the file.vue [Default: true]
--style:    Pre-processor CSS [Default: scss] [Value supported: css, scss, sass, less, stylus]
--path:     Folder inside src/ for the component, created if missing [Default: src/]
--blank:    Empty template and style, without the demo content [Default: false]
--force:    Overwrite the component if it already exists [Default: false]
--dry-run:  Print the component instead of writing it [Default: false]
--no-template, --no-script, --no-style:
            Leave the section out (at least one must remain) [Default: false]
--props:    Comma-separated prop names, declared with an open type [Default: none]
--module:   CSS modules (<style module> + $style) instead of scoped [Default: false]
`;
}
