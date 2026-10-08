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
    "containerbase/organize-imports": "error",
    "containerbase/test-root-describe": "error"
  }
}
```

## Rules

- `enforce-ts-extension`: in TypeScript files, local imports and exports (relative or `~` aliased) use `.ts` instead of `.js`, and local paths in `vi.mock` and friends have a file extension. Fixable.
- `enum-member-pascal-case`: enum members are written in PascalCase, like the `PascalCase` format of `@typescript-eslint/naming-convention`.
- `no-undeclared-dependencies`: imported packages are declared in the nearest `package.json`. `devDependencies` are only allowed with the `allowDevDependencies` option, for example in tests. Type-only imports are skipped.
- `organize-imports`: imports are grouped by builtin, external, parent, sibling and index modules, then other paths like tsconfig aliases, and sorted alphabetically within each group. Side-effect imports stay in place. Fixable.
- `test-root-describe`: the root `describe` of a spec file is named after its path, without `src/`, `lib/` or `test/` and the `.spec.ts` suffix. Fixable.
