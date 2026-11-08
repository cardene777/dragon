# Contributing to dragon

[日本語](CONTRIBUTING.ja.md)

Thanks for considering a contribution.
Ideas, bug reports, and pull requests are all welcome, and you can write in English or Japanese.
Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

Notes for the maintainer, such as how open work is counted and how dependency exceptions are recorded, are in [`docs/maintaining.md`](docs/maintaining.md) (in Japanese).
You do not need them to send a change.

## Quick start

```bash
git clone https://github.com/cardene777/dragon.git
cd dragon
pnpm install
pnpm build:packages  # build the renderer package that the tests read
pnpm test            # run every test with vitest
pnpm dev             # start the catalog site at http://localhost:4323
```

Make sure every test passes before you change anything.

## Repository layout

| Path | What it holds |
| --- | --- |
| `packages/dragon/` | The source JSON, the line-by-line notation, the renderer, and the export command (`@cardenelabs/dragon`) |
| `apps/playground-spa/` | The catalog site published on GitHub Pages (Vite and React 19). Its editor plays the notation you type |
| `test-support/` | Setup for vitest. It checks that no package's `dist` is older than its `src` |

The renderer draws everything inside `packages/dragon` and does not depend on another drawing package.

## Sending a change

1. Open an issue that describes the problem or the idea.
2. Fork the repository and create a branch for the change.
3. Write a test first. Code without a test that shows it works is not merged.
4. Run the full check.

   ```bash
   pnpm verify
   ```

5. Open a pull request.

`pnpm verify` runs the type check, the build, lint, and every test, shortest first.
Run all of it, not only the tests near your change.
A test can read the file you changed without being next to it.
For example, editing one example in `packages/dragon/examples/` affects the tests that convert it, draw it, and export it.
The build runs second because the tests read the built package (see the next section).

## Tests

`pnpm verify` is the check to pass before you send a change.
Use the other commands to find where a failure comes from.

```bash
pnpm verify      # type check, build, lint, and tests, in that order
pnpm test        # every vitest test (unit and integration)
pnpm test:watch  # vitest in watch mode
pnpm lint        # eslint
pnpm typecheck   # tsc -b for every workspace
pnpm build       # the renderer package and the site
```

A pull request that adds a feature must add tests, in `packages/dragon/test/` or `apps/playground-spa/src/lib/`.

The tests read `@cardenelabs/dragon` as a package, which means they read its `dist`.
`pnpm test` does not build, so run `pnpm build:packages` after you change `src`.
If an old `dist` is left, the tests stop before they start with the message `dist が src より古い package がある` (`test-support/global-setup.ts`).

`packages/dragon/test/export.test.ts` exports MP4, GIF, HTML, and PNG with a headless Chromium.
On a machine without Chromium, install it once.

```bash
pnpm exec playwright install chromium
```

## Changing dependencies

When you add or upgrade a dependency, check the lockfile for known vulnerabilities.

```bash
bash scripts/check-dependency-vulnerabilities.sh
```

The script reads `pnpm-lock.yaml` with `osv-scanner`.
It exits with 0 when nothing is found, 1 when something is found, 2 when it cannot run (for example, `osv-scanner` is not installed), and 3 when nothing is found but `osv-scanner.toml` keeps a record that no longer matches any dependency.
Expect 0.
If something is found, reinstall with `pnpm install` first, which clears most findings.
If a finding remains, say so in the pull request, and the maintainer decides how to handle it.

After an upgrade, start `pnpm dev` as well as running the build and the tests.
The build and the development server bundle the code separately, so the server can fail even when the build passes.

## Pull requests

- Keep one concern per pull request. Do not mix a feature, a fix, and a refactor.
- Start the title with the type: `feat`, `fix`, `docs`, `refactor`, `test`, or `chore`.
- In the description, write why you made the change, what it affects, and how you tested it. The pull request template has the same headings.

## Commit messages

Start with an emoji and the type, then a short summary in English or Japanese.

| Emoji | Use |
| --- | --- |
| `✨` | New feature |
| `🐛` | Bug fix |
| `📝` | Docs |
| `♻️` | Refactor |
| `✅` | Test |
| `🎨` | Style or format |
| `⚡` | Performance |
| `🔧` | Tooling or config |

Example: `✨ feat(dragon): add a sequence preset`

## Code style

- TypeScript runs in strict mode everywhere, and `any` is not allowed.
- Run `pnpm lint` (eslint). It reports problems and does not fix them.
- Format only the `.ts` and `.tsx` files you touched, with `npx prettier --write <path>`. The settings are in `.prettierrc`. The repository is not formatted as a whole.
- Do not run prettier on Markdown. It aligns table columns by character count, so tables with Japanese text end up misaligned.
- Order imports as the standard library, external packages, this package, then relative paths.
- Keep one responsibility per file, and split a file before it grows very large.

## License

dragon is released under the [MIT License](LICENSE).
By contributing, you agree that your contribution is released under the same license.
