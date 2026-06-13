# Ten-Language Localization Expansion Design

## Scope

Expand the calculator from 21 to 31 supported languages by adding Dutch (`nl`), Polish (`pl`), Swedish (`sv`), Danish (`da`), Norwegian Bokmål (`nb`), Finnish (`fi`), Czech (`cs`), Greek (`el`), Hebrew (`he`), and Hungarian (`hu`). Preserve the current static single-file application architecture and all existing behavior except the requested localization expansion.

## Version And Selector

- Increment `APP_VERSION` from `2.2.0` to `2.3.0`.
- Append the ten languages to the existing language selector without removing or reordering existing options.
- Use these native display names:
  - `Nederlands`
  - `Polski`
  - `Svenska`
  - `Dansk`
  - `Norsk bokmål`
  - `Suomi`
  - `Čeština`
  - `Ελληνικά`
  - `עברית`
  - `Magyar`

## Translation Architecture

Add ten explicit, complete dictionaries to the existing localization data in `index.html`. Each dictionary must have exactly the same keys as `I18N_EN`, including GUI labels, tooltips, unit-system strings, presets, warnings, dynamic result templates, report strings, footer strings, and `buyMeCoffee`.

Translations must express the English source meaning rather than use generated filler. English may remain only for allowed technical units, formula symbols, model names, the GNU license name, and user-entered content.

## Direction And Units

- Add Hebrew to the RTL language set alongside Arabic, Urdu, and Persian.
- Hebrew app and report layouts use `dir="rtl"`.
- Formula, populated-equation, conversion, numeric, and technical-expression regions remain LTR.
- All other new languages use LTR.
- English continues to default to I-P units.
- Every non-English language, including all ten new languages, defaults to SI unless a manual unit choice is stored.
- Existing localStorage and share-URL unit behavior remains unchanged.

## Reports

Generated reports use the selected language's complete dictionary and existing unit-selection behavior. Hebrew reports use RTL document direction while formula sections remain LTR. The report structure, calculations, controls, caution content, and export limits do not change.

## Tests

### Vitest

- Confirm the selector exposes all 31 codes and native display names.
- Confirm all ten dictionaries exist and exactly match the English key set.
- Reject empty, null, undefined, copied-English action text, and generic placeholder translations.
- Extend placeholder detection with Dutch, Polish, Swedish, Danish, Norwegian Bokmål, Finnish, Czech, Greek, Hebrew, and Hungarian variants, including diacritic forms.
- For every new language, verify localized header, scenario, results, fleet, saved-scenario, action, unit, tooltip, placeholder, footer, and dynamic-result surfaces.
- Verify SI default and kW-primary headline behavior.
- Verify Hebrew RTL app/report behavior and LTR formula regions.
- Verify localized reports at minimum for Dutch, Polish, Greek, Hebrew, and Hungarian.
- Preserve all existing localization, calculations, hardening, units, presets, saved scenarios, sharing, and report tests.

### Playwright

- Confirm all 31 selector options.
- Smoke-test all ten new languages for meaningful visible localization, SI defaults, kW-primary results, and absence of placeholder text.
- Verify Hebrew RTL mirroring, usable selectors, and LTR formula/equation blocks.
- Generate reports for Dutch, Polish, Hebrew, and Greek and verify localized report labels and direction.

## README

Update the supported-language list and count to 31 where present. Add a `2.3.0` version-history entry naming the ten new languages. Leave unrelated README content unchanged.

## Preservation

Do not change calculation logic, hardening limits, computed-pill styling, caution design, report structure, preset behavior, saved scenarios, share URLs, existing language behavior, unit persistence, or the Buy Me a Coffee destination and security attributes.
