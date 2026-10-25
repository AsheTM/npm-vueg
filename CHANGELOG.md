# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/AsheTM/npm-vueg/compare/v1.1.0...develop
[1.1.0]: https://github.com/AsheTM/npm-vueg/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AsheTM/npm-vueg/releases/tag/v1.0.0
