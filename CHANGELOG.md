# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-10-25

First release, for **Vue 2**.

### Added
- `vueg` command (package `@ashetm/vueg`), started from the unfinished `viu` command of [vuegc](https://github.com/AsheTM/npm-vuegc) ([#1](https://github.com/AsheTM/npm-vueg/issues/1)).
- `vueg component --name Card [flags]` generates a Vue 2 component through vuegc (`^1.4.0`): every vuegc flag, same behavior, messages and exit codes, and the same files ([#5](https://github.com/AsheTM/npm-vueg/issues/5)).
- Help: `vueg`, `vueg help`, `--help`, `-h`; `vueg component` alone or with `--help`. An unknown command fails with exit code `1` and lists the commands ([#3](https://github.com/AsheTM/npm-vueg/issues/3)).
- README: install, commands, flags, examples ([#7](https://github.com/AsheTM/npm-vueg/issues/7)).
- Written in TypeScript, compiled to `dist/` (the only published folder); tested with Vitest, including parity tests with the vuegc command ([#3](https://github.com/AsheTM/npm-vueg/issues/3)).

[Unreleased]: https://github.com/AsheTM/npm-vueg/compare/v1.0.0...develop
[1.0.0]: https://github.com/AsheTM/npm-vueg/releases/tag/v1.0.0
