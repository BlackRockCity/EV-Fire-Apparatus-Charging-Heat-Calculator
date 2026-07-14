# Development Guide

This guide is for developers and maintainers who run tests, modify the calculator, host a deployment, or contribute changes.

## Application Structure

- Single-file app built around `index.html`.
- Can be opened locally or hosted as a static site.
- No server required for normal use.

Normal users only need the hosted page or `index.html`. Developers run npm commands from the repository root.

## Development and Testing

Install dependencies:

```bash
npm install
```

Run the unit/jsdom regression suite:

```bash
npm test
```

Run browser tests:

```bash
npm run test:e2e
```

If Playwright browsers are not installed yet:

```bash
npx playwright install
```

Test coverage includes hardening, regression calculations, localization completeness, placeholder translation checks, I-P/SI unit switching, report generation, saved scenarios, share URLs, and browser smoke tests.

## Project Files

- [`../index.html`](../index.html): static end-user app
- [`../package.json`](../package.json): npm metadata and test scripts
- [`../package-lock.json`](../package-lock.json): locked dependency tree
- [`../dev/configs/vitest.config.js`](../dev/configs/vitest.config.js): Vitest configuration
- [`../dev/configs/playwright.config.js`](../dev/configs/playwright.config.js): Playwright configuration
- [`../dev/tests/calculator.hardening.test.js`](../dev/tests/calculator.hardening.test.js): jsdom hardening and regression tests
- [`../dev/tests/e2e/calculator.browser.spec.js`](../dev/tests/e2e/calculator.browser.spec.js): real-browser Playwright tests

## Repository Hygiene

Commit:

- Source files
- README and documentation
- `package.json` and `package-lock.json`
- Test files
- Configuration files

Do not commit:

- `node_modules/`
- `coverage/`
- `playwright-report/`
- `test-results/`
- `.DS_Store`

## Contributing

Issues and PRs are welcome for bug fixes, new presets, UX improvements, additional languages, documentation updates, or additional outputs such as energy per session or site DC power caps.

Changes affecting calculations, units, presets, reports, saved scenarios, share URLs, or localization should include appropriate regression coverage.

## License

GPL v3.0 — see LICENSE for details.
