# vueg

CLI to generate files in a **Vue 2** project: components, and views with their route. Services are planned.

Generation relies on [vuegc](https://github.com/AsheTM/npm-vuegc): `vueg component` and `vueg view` accept the same flags and produce exactly the same files.

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

Run it at the root of a Vue project (the folder that contains `src/main.js` and `src/App.vue`):

``` sh
vueg component --name HelloWorld.vue [--scoped [true|false]] [--style css] [--path components] [--blank] [--force] [--dry-run] [--no-template|--no-script|--no-style] [--props title,items] [--module]
```

| Flag | Description | Default |
|---|---|---|
| `--name` | **Required.** Name of the component, with or without `.vue` | |
| `--style` | CSS pre-processor: `css`, `scss`, `sass` (indented syntax), `less` or `stylus` | `scss` |
| `--scoped` | `scoped` attribute on `<style>` (`--scoped false` to remove it) | `true` |
| `--path` | Folder inside `src/` for the component, created if missing | `src/` |
| `--blank` | Empty template and style, without the demo content | `false` |
| `--force` | Overwrite the component if it already exists | `false` |
| `--dry-run` | Print the component instead of writing it; same checks as a real run | `false` |
| `--no-template`, `--no-script`, `--no-style` | Leave the section out (at least one must remain) | `false` |
| `--props` | Comma-separated prop names, e.g. `title,items`, declared as `title: null` (any type) | none |
| `--module` | CSS modules: `<style module>` and `:class="$style.root"` instead of `scoped` | `false` |

Examples:

``` sh
vueg component --name HelloWorld                          # src/HelloWorld.vue
vueg component --name Button --path components/ui         # src/components/ui/Button.vue
vueg component --name Card --props title,items --blank    # empty component with 2 props
vueg component --name Card --style sass --module --dry-run  # preview, nothing written
```

An existing component is never overwritten without `--force`. On failure, `vueg` prints the reason and exits with code `1`.

`vueg component --name Card --props title,items --blank` generates `src/Card.vue`:

``` vue
<template>
    <div></div>
</template>

<script>
export default {
    name: "Card",
    props: {
        title: null,
        items: null
    },
    data() {
        return { };
    },
    methods: { }
}
</script>

<style lang="scss" scoped>
</style>
```

## `vueg view`

A view is a page: a component in `src/views/`, shown by the router. `vueg view` generates it and adds its route.

``` sh
vueg view --name Home [component flags] [--route /home] [--no-route]
```

- **Every `vueg component` flag** works the same, except `--path`, which is a sub-folder **of `src/views/`** (`--path admin` → `src/views/admin/`).
- The route is added to the `routes` array of `src/router/index.js` (or `router/index.ts`, `router.js`, `router.ts`), **lazy loaded**, so no `import` line is needed. It follows the file's indentation, quotes, trailing commas and line endings.

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

In `src/router/index.js` (Vue CLI project):

``` js
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/admin/user-profile',
    name: 'UserProfile',
    component: () => import('../views/admin/UserProfile.vue')
  }
]
```

**Nothing is written if something is wrong**: no router, no `routes` array, a route path or name already used, an invalid `--route`, or a view that can't be generated (e.g. it exists, without `--force`) → the reason is printed, exit code `1`, project unchanged. `--dry-run` prints the view and the route without writing anything.

## Versions

| vueg | Vue | vuegc |
|---|---|---|
| 1.x | Vue 2 | `^1.4.0` |
| 2.x | Vue 3 (planned) | `^2` |

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
