# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `vueg component` and `vueg view` accept vuegc 2.1's new flags: `--test` (a Vitest test next to the file), `--story` (a Storybook story next to it) and `--template pug`; a view's test and story go next to it in `src/views/`. An existing test or story is reported like an existing file, and `vueg view` then leaves the router as is. Library: `component()` and `view()` take `test`, `story` and `template`, and the `VuegcTemplate` type is exported ([#51](https://github.com/AsheTM/npm-vueg/issues/51)).

### Changed
- Relies on [vuegc](https://github.com/AsheTM/npm-vuegc) `^2.1.0`, which also refuses `--no-template` when the component wouldn't compile (an empty `<script setup>`, or no script): add `--props`, `--emits` or `--options` ([#51](https://github.com/AsheTM/npm-vueg/issues/51)).

## [2.1.0] - 2026-11-01

vueg as a **library**: `component()`, `view()` and `errorMessage()`, with TypeScript declarations.

### Added
- Library API, `require("@ashetm/vueg")`: `component(options)` generates a component with vuegc's options and returns its path; `view(options)` generates a view in `src/views/` and adds its route (`route: "/path"`, or `false` for none), and returns `{ file, route: { path, name, router } }`; `errorMessage(err)` gives the message of their errors, the same one the CLI prints, without printing or exiting ([#32](https://github.com/AsheTM/npm-vueg/issues/32)).
- TypeScript declarations (`dist/*.d.ts`, `types` in `package.json`): `ComponentOptions`, `ViewOptions`, `ViewResult`, `ViewRoute`, `VuegcStyle` and the typed functions ([#33](https://github.com/AsheTM/npm-vueg/issues/33)).
- README: Library section, with an example from the real output, the options and return values of each function, and how errors work ([#34](https://github.com/AsheTM/npm-vueg/issues/34)).
- CI: GitHub Actions run `npm ci` and `npm test` (build, typecheck, tests) on every pull request into `develop` or `main` and every push to `develop`, on Node 22 and 24, on Ubuntu and Windows ([#28](https://github.com/AsheTM/npm-vueg/issues/28)).
- Dependabot: a weekly pull request into `develop` for npm packages (development dependencies grouped) and for GitHub Actions ([#29](https://github.com/AsheTM/npm-vueg/issues/29)).

### Changed
- A project `.npmrc` pins the registry to registry.npmjs.org, also for `@ashetm` packages: installs, the lock file and `npm publish` no longer depend on the developer's own npm config, and publishing needs no `--@ashetm:registry` flag (no token in it; npm never packs it) ([#26](https://github.com/AsheTM/npm-vueg/issues/26)).
- `package-lock.json` is committed (all packages from registry.npmjs.org, vuegc 2.0.0 from npm), for reproducible installs with `npm ci` ([#24](https://github.com/AsheTM/npm-vueg/issues/24)).

### Fixed
- The build empties `dist/` first: building an older version no longer keeps files of a newer build (published 1.0.0 contains 3 unused files from the 2.0 build) ([#22](https://github.com/AsheTM/npm-vueg/issues/22)).

## [2.0.0] - 2026-10-25

**Vue 3**, on vuegc 2. For Vue 2, use vueg 1 (`npm install -g @ashetm/vueg@1`).

### Added
- `vueg component` and `vueg view` accept vuegc 2's new flags: `--emits`, `--options` (Options API), `--ts` ([#17](https://github.com/AsheTM/npm-vueg/issues/17)).
- `vueg view` works with **Vue Router 4** (`createRouter({ routes: [...] })`, `RouteRecordRaw[]`), and names the route like the router does: `'userProfile'` when the existing names are lowercase (create-vue: `'home'`, `'about'`), `'UserProfile'` otherwise ([#17](https://github.com/AsheTM/npm-vueg/issues/17)).

### Changed
- **BREAKING**: relies on [vuegc](https://github.com/AsheTM/npm-vuegc) `^2.0.0`, so vueg 2 generates **Vue 3** components (Vue 3 projects only, `css` and `<script setup>` by default). For Vue 2, use vueg 1 (`npm install -g @ashetm/vueg@1`, `1.x` branch) ([#17](https://github.com/AsheTM/npm-vueg/issues/17)).
- README for Vue 3: new flags, examples from the real output (TypeScript component, view on a create-vue router), versions table with the vuegc range, migrating from 1.x ([#19](https://github.com/AsheTM/npm-vueg/issues/19)).

## [1.1.0] - 2026-10-25

### Added
- `vueg view --name Home` generates a view in `src/views/` through vuegc, with the same flags as `vueg component`; `--path admin` is a sub-folder of `views/` and must stay inside it ([#10](https://github.com/AsheTM/npm-vueg/issues/10)).
- `vueg view` adds the view's route to the router (`src/router/index.js`, `router.js`, or `.ts`), lazy loaded: `{ path, name, component: () => import('../views/…') }`, in the file's indentation, quotes, trailing commas and line endings. Default path from the folder and the name in kebab-case (`/admin/user-profile`); `--route /path` to choose it, `--no-route` to skip it; `--dry-run` shows the route too. Everything is checked before writing: no router, no routes array, an existing route path or name, or a failing view leave the project unchanged ([#12](https://github.com/AsheTM/npm-vueg/issues/12)).
- README: `vueg view` section, with a real example ([#14](https://github.com/AsheTM/npm-vueg/issues/14)).

## [1.0.0] - 2026-10-25

First release, for **Vue 2**.

### Added
- `vueg` command (package `@ashetm/vueg`), started from the unfinished `viu` command of [vuegc](https://github.com/AsheTM/npm-vuegc) ([#1](https://github.com/AsheTM/npm-vueg/issues/1)).
- `vueg component --name Card [flags]` generates a Vue 2 component through vuegc (`^1.4.0`): every vuegc flag, same behavior, messages and exit codes, and the same files ([#5](https://github.com/AsheTM/npm-vueg/issues/5)).
- Help: `vueg`, `vueg help`, `--help`, `-h`; `vueg component` alone or with `--help`. An unknown command fails with exit code `1` and lists the commands ([#3](https://github.com/AsheTM/npm-vueg/issues/3)).
- README: install, commands, flags, examples ([#7](https://github.com/AsheTM/npm-vueg/issues/7)).
- Written in TypeScript, compiled to `dist/` (the only published folder); tested with Vitest, including parity tests with the vuegc command ([#3](https://github.com/AsheTM/npm-vueg/issues/3)).

[Unreleased]: https://github.com/AsheTM/npm-vueg/compare/v2.1.0...develop
[2.1.0]: https://github.com/AsheTM/npm-vueg/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/AsheTM/npm-vueg/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/AsheTM/npm-vueg/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AsheTM/npm-vueg/releases/tag/v1.0.0
