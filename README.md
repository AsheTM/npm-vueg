# vueg

CLI to generate files in a **Vue 3** project: components, and views with their route. Services are planned. Also usable as a [library](#library).

Generation relies on [vuegc](https://github.com/AsheTM/npm-vuegc): `vueg component` and `vueg view` accept the same flags and produce exactly the same files (`<script setup>`, TypeScript, CSS pre-processors, props and events).

For **Vue 2**, use vueg 1: `npm install -g @ashetm/vueg@1` (see [Versions](#versions)).

## Install

``` sh
npm install -g @ashetm/vueg
```

The package is `@ashetm/vueg`, the command is `vueg`. Or run it without installing: `npx @ashetm/vueg component --name HelloWorld`.

## Commands

| Command | Description |
|---|---|
| `vueg component` | Generate a Vue component |
| `vueg view` | Generate a view in `src/views/` and add its route to the router |
| `vueg help`, `vueg`, `--help`, `-h` | Show the commands |

`vueg <command>` without flags, or with `--help` / `-h`, shows the help of that command. An unknown command exits with code `1`.

## `vueg component`

Run it at the root of a Vue 3 project (the folder that contains `src/main.js` or `src/main.ts`, creating the app with `createApp`, and `src/App.vue`), e.g. a create-vue (Vite) project:

``` sh
vueg component --name HelloWorld.vue [--scoped [true|false]] [--style scss] [--path components] [--blank] [--force] [--dry-run] [--no-template|--no-script|--no-style] [--props title,items] [--emits update,close] [--module] [--options] [--ts] [--template pug] [--test] [--story]
```

| Flag | Description | Default |
|---|---|---|
| `--name` | **Required.** Name of the component, with or without `.vue` | |
| `--style` | CSS pre-processor: `css`, `scss`, `sass` (indented syntax), `less` or `stylus` | `css` |
| `--scoped` | `scoped` attribute on `<style>` (`--scoped false` to remove it) | `true` |
| `--path` | Folder inside `src/` for the component, created if missing | `src/` |
| `--blank` | Empty template and style, without the demo content | `false` |
| `--force` | Overwrite the component if it already exists | `false` |
| `--dry-run` | Print the component instead of writing it; same checks as a real run | `false` |
| `--no-template`, `--no-script`, `--no-style` | Leave the section out (at least one must remain). Without the template, the component needs a script with something in it: `--props`, `--emits` or `--options` | `false` |
| `--props` | Comma-separated prop names, e.g. `title,items`, declared as `title: null` (any type) | none |
| `--emits` | Comma-separated event names, e.g. `update:modelValue,close` | none |
| `--module` | CSS modules: `<style module>` and `:class="$style.root"` instead of `scoped` | `false` |
| `--options` | Options API (`export default { … }`) instead of `<script setup>` | `false` |
| `--ts` | TypeScript: `lang="ts"`, typed `defineProps<{ … }>()` / `defineEmits<{ … }>()` | `false` |
| `--template` | Template language: `html`, or `pug` (`<template lang="pug">`, needs the `pug` package) | `html` |
| `--test` | Also write a [Vitest](https://vitest.dev) test next to the component: `Name.spec.js` (`.spec.ts` with `--ts`), mounting it with Vue Test Utils | `false` |
| `--story` | Also write a [Storybook](https://storybook.js.org) story next to the component: `Name.stories.js` (`.stories.ts` with `--ts`), its props as args | `false` |

The test and the story are [vuegc's](https://github.com/AsheTM/npm-vuegc#test): see there what they contain and what they need.

Examples:

``` sh
vueg component --name HelloWorld                              # src/HelloWorld.vue
vueg component --name Button --path components/ui             # src/components/ui/Button.vue
vueg component --name Card --props title,items --emits close  # props and events
vueg component --name Card --ts --style scss --dry-run        # preview, nothing written
vueg component --name Card --test --story                     # and src/Card.spec.js, src/Card.stories.js
```

An existing component (or its test, or its story) is never overwritten without `--force`. On failure, `vueg` prints the reason and exits with code `1`.

`vueg component --name Card --props title,items --emits update:modelValue --ts --blank` generates `src/Card.vue`:

``` vue
<template>
    <div></div>
</template>

<script setup lang="ts">
const props = defineProps<{
    title?: unknown;
    items?: unknown;
}>();
const emit = defineEmits<{
    "update:modelValue": [...args: unknown[]];
}>();
</script>

<style lang="css" scoped>
</style>
```

## `vueg view`

A view is a page: a component in `src/views/`, shown by the router. `vueg view` generates it and adds its route.

``` sh
vueg view --name Home [component flags] [--route /home] [--no-route]
```

- **Every `vueg component` flag** works the same, except `--path`, which is a sub-folder **of `src/views/`** (`--path admin` → `src/views/admin/`). `--test` and `--story` write the view's test and story next to it.
- The route is added to the routes of `src/router/index.js` (or `router/index.ts`, `router.js`, `router.ts`), **Vue Router 4** (`createRouter({ routes: [...] })`, `const routes: RouteRecordRaw[] = [...]`), **lazy loaded**, so no `import` line is needed. It follows the file's indentation, quotes, trailing commas, line endings, and route name casing (`'userProfile'` next to create-vue's `'home'`, `'about'`).

| Flag | Description | Default |
|---|---|---|
| `--route` | Path of the route, starting with `/` | `/<path>/<name in kebab-case>` |
| `--no-route` | Generate the view only, leave the router as is | `false` |

`vueg view --name UserProfile --path admin --blank` generates `src/views/admin/UserProfile.vue` and prints:

```
> Generating vue component starting
> Generating vue component success
> Route /admin/user-profile added to src/router/index.js
```

In `src/router/index.js` (create-vue project, Vue Router 4):

``` js
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/admin/user-profile',
      name: 'userProfile',
      component: () => import('../views/admin/UserProfile.vue')
    }
  ]
```

**Nothing is written if something is wrong**: no router, no `routes` array, a route path or name already used, an invalid `--route`, or a view that can't be generated (e.g. it exists, without `--force`) → the reason is printed, exit code `1`, project unchanged. `--dry-run` prints the view and the route without writing anything.

## Library

Since 2.1.0, vueg's commands are also functions, with options instead of flags. TypeScript declarations are included.

``` sh
npm install @ashetm/vueg
```

``` js
const { component, view, errorMessage } = require("@ashetm/vueg");

try {
    component({ name: "Card", ts: true, props: ["title"], cwd: "/path/to/project" });
    // → "/path/to/project/src/Card.vue"

    view({ name: "UserProfile", path: "admin", cwd: "/path/to/project" });
    // → {
    //     file: "/path/to/project/src/views/admin/UserProfile.vue",
    //     route: { path: "/admin/user-profile", name: "userProfile", router: "/path/to/project/src/router/index.js" }
    //   }
} catch(err) {
    console.error(errorMessage(err));   // e.g. "Component already exists, use --force to overwrite it"
}
```

| Function | Like | Options | Returns |
|---|---|---|---|
| `component(options)` | `vueg component` | [vuegc's options](https://github.com/AsheTM/npm-vuegc#use-as-a-library): `name` (required), `style`, `path`, `props`, `emits`, `ts`, `optionsApi`, `template`, `test`, `story`, `force`, `dryRun`, `cwd`… | the component's path |
| `view(options)` | `vueg view` | the same, `path` inside `src/views/`, and `route`: a path starting with `/`, or `false` for no route (default: the view's folder and name in kebab-case) | `{ file, route }`: the view's path, and the route added (`{ path, name, router }`, or `null` with `route: false`) |
| `errorMessage(err)` | | an error thrown by `component()` or `view()` | the message the CLI prints for it |

- Both functions **throw** on failure, with the project unchanged. Their errors are plain objects, as in vuegc: `errorMessage()` gives their message, and prints nothing.
- Like the CLI, they print their progress (`> Generating vue component success`, `> Route … added`). `cwd` is the project's root (default: the current directory).
- `run(args)` runs the CLI itself (`run(["component", "--name", "Card"])`) and returns its exit code.

## Versions

| vueg | Vue | vuegc | Install |
|---|---|---|---|
| 1.x | Vue 2 | `^1.4.0` | `npm install -g @ashetm/vueg@1` |
| 2.x | Vue 3 | `^2.0.0` (`^2.1.0` since vueg 2.2.0) | `npm install -g @ashetm/vueg` |

**Migrating from 1.x**: vueg 2 inherits vuegc 2's changes: Vue 3 projects only, `css` and `<script setup>` by default. `--options --style scss` gives the 1.x output. See [vuegc's migration notes](https://github.com/AsheTM/npm-vuegc#migrating-from-1x).

See the [CHANGELOG](CHANGELOG.md) for the details of each version.

## Development

Written in TypeScript (`src/`), compiled to `dist/` with `tsc`. Needs Node 22.12+ or 24.

``` sh
npm install
npm run build       # src/*.ts -> dist/*.js
npm test            # builds, type-checks sources and tests, then runs the tests (Vitest)
npm run test:watch  # re-run on every change
```

`npm pack` and `npm publish` build automatically (`prepack`); only `dist/` is published.

Tests include a parity check: for the same flags, `vueg component` and the `vuegc` command must produce the same file.

## License

[MIT](LICENSE)
