# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `vueg component --name Card [flags]` generates a Vue 2 component through [vuegc](https://github.com/AsheTM/npm-vuegc) (`^1.4.0`): every vuegc flag, same behavior, messages and exit codes ([#5](https://github.com/AsheTM/npm-vueg/issues/5)).
- `vueg` command, imported from the unfinished `viu` command of [vuegc](https://github.com/AsheTM/npm-vuegc): `vueg` and `vueg component` show their help ([#1](https://github.com/AsheTM/npm-vueg/issues/1)).
- Service and service test templates in `template/`.
- An unknown command fails with exit code `1` and lists the commands ([#3](https://github.com/AsheTM/npm-vueg/issues/3)).

### Changed
- Rewritten in TypeScript: sources in `src/`, compiled by `tsc` to `dist/` (only `dist/` is published); tests with Vitest ([#3](https://github.com/AsheTM/npm-vueg/issues/3)).

[Unreleased]: https://github.com/AsheTM/npm-vueg/compare/main...develop
