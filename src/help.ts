const BANNER = String.raw`
__     ___   _ _____ ____
\ \   / / | | | ____/ ___|
 \ \ / /| | | |  _|| |  _
  \ V / | |_| | |__| |_| |
   \_/   \___/|_____\____|
`;

const FLAGS = "[--scoped [true|false]] [--style scss] [--path folder] [--blank] [--force] [--dry-run] [--no-template|--no-script|--no-style] [--props title,items] [--emits update,close] [--module] [--options] [--ts] [--template pug] [--test] [--story]";

/** Flags shared by `vueg component` and `vueg view`; only `--path` differs. */
function optionalFlags(pathLine: string): string {
    return `Optional flag(s):
--scoped:   Boolean for scoped tag on style inside the file.vue [Default: true]
--style:    Pre-processor CSS [Default: css] [Value supported: css, scss, sass, less, stylus]
--path:     ${ pathLine }
--blank:    Empty template and style, without the demo content [Default: false]
--force:    Overwrite the file if it already exists [Default: false]
--dry-run:  Print the file instead of writing it [Default: false]
--no-template, --no-script, --no-style:
            Leave the section out (at least one must remain; without the template,
            a script with --props, --emits or --options) [Default: false]
--props:    Comma-separated prop names, declared with an open type [Default: none]
--emits:    Comma-separated event names, e.g. update:modelValue [Default: none]
--module:   CSS modules (<style module> + $style) instead of scoped [Default: false]
--options:  Options API (export default { ... }) instead of <script setup> [Default: false]
--ts:       TypeScript (lang="ts"): typed props and events [Default: false]
--template: Template language [Default: html] [Value supported: html, pug]
--test:     Also write a Vitest test next to the file (Name.spec.js, .spec.ts with --ts) [Default: false]
--story:    Also write a Storybook story next to the file (Name.stories.js, .stories.ts with --ts) [Default: false]`;
}

/** Help of `vueg`: the list of commands. */
export function mainHelp(): string {
    return `${ BANNER }
vueg <command>

Command(s):
component:      Generate a Vue component
view:           Generate a view (page) in src/views/
service:        Generate a service (API calls) in src/services/

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

/** Help of `vueg service`. */
export function serviceHelp(): string {
    return `${ BANNER }
vueg service --name User [--path folder] [--ts] [--test] [--blank] [--force] [--dry-run]

The service is a module of API calls with fetch: getAll, getById, create, update, remove on /api/<name>.

Required flag(s):
--name:     Name of the service: User or user gives user.service.js

Optional flag(s):
--path:     Folder inside src/ for the service, created if missing [Default: services]
--ts:       TypeScript: user.service.ts, typed functions [Default: false]
--test:     Also write a Vitest test next to it (user.service.spec.js) [Default: false]
--blank:    An empty module, without the API calls [Default: false]
--force:    Overwrite the service (and its test) if it already exists [Default: false]
--dry-run:  Print the files instead of writing them [Default: false]
`;
}
