# vueg

CLI to generate files in a **Vue 2** project. Version 1.0 generates components; views and services are planned.

Component generation relies on [vuegc](https://github.com/AsheTM/npm-vuegc): `vueg component` accepts the same flags and produces exactly the same files.

## Install

``` sh
npm install -g @ashetm/vueg
```

The package is `@ashetm/vueg`, the command is `vueg`. Or run it without installing: `npx @ashetm/vueg component --name HelloWorld`.

## Commands

| Command | Description |
|---|---|
| `vueg component` | Generate a Vue component |
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
