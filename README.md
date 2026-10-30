# @containerbase/oxlint-plugin

[oxlint](https://oxc.rs/docs/guide/usage/linter) JS plugin with the containerbase lint rules.

## Usage

```json
{
  "jsPlugins": ["@containerbase/oxlint-plugin"],
  "rules": {
    "containerbase/enforce-ts-extension": "error",
    "containerbase/enum-member-pascal-case": "error",
    "containerbase/no-undeclared-dependencies": "error",
    "containerbase/sort-imports": "error",
    "containerbase/test-root-describe": "error"
  }
}
```

## Rules

- `enforce-ts-extension`: in TypeScript files, local imports and exports (relative or `~` aliased) use `.ts` instead of `.js`, and local paths in `vi.mock` and friends have a file extension. Fixable.
- `enum-member-pascal-case`: enum members are written in PascalCase, like the `PascalCase` format of `@typescript-eslint/naming-convention`.
- `no-undeclared-dependencies`: imported packages are declared in the nearest `package.json`. `devDependencies` are only allowed with the `allowDevDependencies` option, for example in tests. Type-only imports are skipped.
- `organize-imports`: **deprecated**, use the `sortImports` option of oxfmt to order the import statements and `sort-imports` to sort the named imports. Imports are grouped by builtin, external, parent, sibling and index modules, then other paths like tsconfig aliases, and sorted alphabetically within each group. Side-effect imports stay in place. Fixable.
- `sort-imports`: the named imports inside `{ … }` of an import declaration are sorted by their local name, in the same order as the `sortImports` option of oxfmt, which only orders the import statements. It takes the same `order` (`asc` or `desc`, default `asc`) and `ignoreCase` (default `true`) options, so both can be configured alike. Default and namespace imports and exports are not touched. Fixable, unless a comment sits inside the braces.
- `test-root-describe`: the root `describe` of a spec file is named after its path, without `src/`, `lib/` or `test/` and the `.spec.ts` suffix. Fixable.

## Development

Node.js, pnpm, jactionlint, shellcheck and zizmor are pinned in [`mise.toml`](./mise.toml), so [`mise`](https://mise.jdx.dev) installs them with `mise install`, then `pnpm install --frozen-lockfile` installs the dependencies.
Without mise, install Node.js and pnpm yourself and run only `pnpm install --frozen-lockfile`.

```bash
mise install
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
jactionlint
zizmor .github/
```

- `pnpm lint-fix` fixes the formatting and the fixable lint findings.
- `pnpm build` compiles the plugin to `dist/`, which is what the package ships.
- `jactionlint` checks the GitHub workflows and `zizmor .github/` audits them. CI runs both through mise in the `lint` job.
