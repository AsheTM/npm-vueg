# vueg

CLI to generate files in a Vue project: components, views, services…

> Work in progress. Component generation will rely on [vuegc](https://github.com/AsheTM/npm-vuegc).

## Versions

| vueg | Vue |
|---|---|
| 1.x | Vue 2 |
| 2.x | Vue 3 |

## Development

Written in TypeScript (`src/`), compiled to `dist/` with `tsc`. Needs Node 22.12+ or 24.

``` sh
npm install
npm run build       # src/*.ts -> dist/*.js
npm test            # builds, then runs the tests (Vitest)
npm run test:watch  # re-run on every change
```

`npm pack` and `npm publish` build automatically (`prepack`); only `dist/` is published.

## License

[MIT](LICENSE)
