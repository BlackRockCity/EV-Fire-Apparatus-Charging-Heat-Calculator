# User Guide

This guide is for people using the EV Fire Apparatus Charging Heat Calculator to build a scenario, review results, save or share a scenario, and create reports. For equations and engineering limits, see the [Technical Reference](TECHNICAL_REFERENCE.md).

## Quick Start

Use the hosted app:

[https://blackrockcity.github.io/EV-Fire-Apparatus-Charging-Heat-Calculator](https://blackrockcity.github.io/EV-Fire-Apparatus-Charging-Heat-Calculator)

Or open [`../index.html`](../index.html) directly in a modern browser.

1. Pick a language.
2. Pick units: `Imperial / I-P` or `Metric / SI`.
3. Add trucks to the fleet inventory.
4. Select which trucks are charging now.
5. Adjust bay area, charge power, efficiencies, BTMS, diversity, and safety factor.
6. Review the results and populated equation.
7. Open the HTML report or copy the share URL.

No `npm` install is required for normal calculator use.

## Presets and Saved Scenarios

Built-in presets replace the current scenario, and all preset values can be edited afterward.

### Built-in Vehicle Presets

The calculator includes built-in presets for several electric fire apparatus examples. These presets are intended as starting points for planning and comparison. After loading a preset, you can edit the truck name, battery size, requested charging power, and charging status to match your actual fleet or project assumptions.

- **Rosenbauer RTX:** 132 kWh battery, about 150 kW maximum charging power
- **Pierce Volterra:** 246 kWh battery, about 150 kW maximum charging power
- **E-ONE Vector:** 327 kWh battery, about 200 kW maximum charging power
- **Custom:** user-defined battery size, charging power, and description

### Saved Scenarios

Saved scenarios are stored locally in the user's browser using `localStorage`. They are not uploaded anywhere. Clearing browser storage can delete saved scenarios.

Saved scenario names are sanitized, and saved scenario data is normalized through the same validation path as loaded/shared data. Saved scenarios store canonical engineering values plus unit metadata so they can render safely under either I-P or SI display.

## Share URLs

The app writes scenario state to the URL query string so scenarios can be shared. Current URLs include `units=ip` or `units=si`. Older URLs without a `units` parameter still load and default according to the current language/unit rules.

## Reports

`Open Report` opens a polished HTML report in a new tab or window. The report uses the current language and unit system.

Reports include:

- Scenario summary
- Headline results
- Input assumptions
- Fleet inventory
- Heat breakdown
- Calculation method
- Populated equation
- Load context
- Caution text and links

`Print / Save as PDF` uses the browser print dialog. `Download Excel` saves an Excel `.xlsx` report spreadsheet. `Close report` closes the report window.

## Example Use

Fresh defaults and an example truck setup:

- Fresh I-P bay-area default: `3,300 ft²`
- Fresh SI bay-area default: `300 m²`
- Truck: one Rosenbauer RTX charging
- Requested charge power: `150 kW`
- Charger cabinet: in bay
- Ventilation delta T: `10°F` / about `5.6°C`

In I-P mode, the headline emphasizes BTU/h and the secondary cards show W/ft² and CFM. In SI mode, the headline emphasizes kW and the secondary cards show W/m² and m³/h, with BTU/h and refrigeration tons retained as references.

## Languages

Supported languages:

<table>
<tr>
<td>

- English
- Simplified Chinese
- Spanish
- French
- German
- Japanese
- Korean
- Portuguese
- Arabic
- Hindi
- Bengali

</td>
<td>

- Indonesian
- Urdu
- Russian
- Italian
- Vietnamese
- Turkish
- Thai
- Persian / Farsi
- Swahili
- Traditional Chinese
- Dutch
- Polish
- Swedish

</td>
<td>

- Danish
- Norwegian Bokmål
- Finnish
- Czech
- Greek
- Hebrew
- Hungarian

</td>
</tr>
</table>

The language selector controls UI and report text. The units selector controls engineering units. They are separate because bilingual users may work in different engineering systems.

Arabic, Urdu, and Persian/Farsi intentionally use RTL layout mirroring. Formula, calculation method, unit-conversion, and populated equation blocks remain LTR for engineering readability.

## Units

Language controls UI and report text. Units controls engineering units. English defaults to I-P; non-English languages default to SI unless manually overridden. Manual unit overrides persist in `localStorage`.

Fresh defaults:

- I-P bay area: `3,300 ft²`
- SI bay area: `300 m²`

### Imperial / I-P

- Bay area input: `ft²`
- Ventilation delta T input: `°F`
- Airflow output: `CFM`
- Load intensity: `W/ft²`
- Headline result is BTU/h-first
- `kW` and refrigeration tons remain visible

### Metric / SI

- Bay area input: `m²`
- Ventilation delta T input: `°C`
- Airflow output: `m³/h`
- Optional `L/s` equivalent is shown where applicable
- Load intensity: `W/m²`
- Headline result is kW-first
- `BTU/h` and refrigeration tons remain visible as references

## Important Limitations

- This tool estimates **sensible loads only** and is intended for preliminary HVAC sizing.
- Confirm assumptions with OEMs, qualified HVAC designers, and the authority having jurisdiction.
- Set _BTMS exhaust to room = 0 %_ if the truck’s cooling air is fully ducted outdoors.
