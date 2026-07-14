# Technical Reference

This document collects the equations, assumptions, limits, conversions, and apparatus preset specifications used by the EV Fire Apparatus Charging Heat Calculator.

> ⚠️ **Caution:** Created in November 2025. This calculator has not undergone real-world testing or professional certification. Confirm assumptions with OEMs, qualified HVAC designers, and the authority having jurisdiction.

## How it Calculates

**Per-vehicle heat to bay (kW)**

$$
Q_{\text{veh}} =
P \Big[
(1-\eta_{\text{charger}})_{\text{(if cabinet in bay)}} +
(1-\eta_{\text{vehicle}})\, f_{\text{BTMS→room}}
\Big]
$$

**Total heat (kW)**

$$
Q_{\text{total}} =
Q_{\text{veh}} \times N_{\text{simultaneous}}
\times f_{\text{diversity}}
\times (1 + \text{safety\%})
$$

**Conversions**

$$
1\,\text{kW} = 3412\,\text{BTU/h}
$$

$$
\text{Tons} = \frac{\text{BTU/h}}{12000}
$$

$$
W/\text{ft}^2 = \frac{1000 \times \text{kW}}{\text{bay ft}^2}
$$

$$
\text{CFM} \approx \frac{\text{BTU/h}}{1.08 \times \Delta T_{^{\circ}\mathrm{F}}}
$$

For SI display, the app converts bay area, airflow, load intensity, and ΔT to metric units while preserving the same underlying heat calculation.

> **Tip:** Set _BTMS exhaust to room = 0 %_ if the truck’s cooling air is fully ducted outdoors.

## Assumptions and Notes

- Heat scales roughly linearly with charge power and number of simultaneous vehicles.
- If the charger cabinet is indoors, add its losses; if outdoors, exclude them.
- η_vehicle varies with SOC and C-rate. Using 92% is a conservative midpoint for fast charging.
- This tool estimates **sensible loads only** and is intended for preliminary HVAC sizing. Always confirm with OEMs and your AHJ.

## Input Limits and Hardening

- Maximum trucks: `100`
- Maximum bay area: `200,000 ft²` or about `18,600 m²`
- Maximum Level 3 requested charge power: `2,000 kW`
- Level 2 charge cap: `19.2 kW`
- Maximum vehicle acceptance rate: `2,000 kW`
- Charger and vehicle efficiency range: `80–99.9%`
- BTMS to room: `0–100%`
- Diversity: `0–1`
- Safety factor: `0–100%`
- URL inventory parsing is bounded.
- Malformed shared URL data is ignored safely.
- Truck names and report content are escaped or sanitized.
- Oversized inventories are capped.

## Built-in Vehicle Presets

The calculator includes built-in presets for several electric fire apparatus examples. These presets are intended as starting points for planning and comparison. After loading a preset, you can edit the truck name, battery size, requested charging power, and charging status to match your actual fleet or project assumptions.

- **Rosenbauer RTX:** 132 kWh battery, about 150 kW maximum charging power
- **Pierce Volterra:** 246 kWh battery, about 150 kW maximum charging power
- **E-ONE Vector:** 327 kWh battery, about 200 kW maximum charging power
- **Custom:** user-defined battery size, charging power, and description

## Unit Conversions

- `1 ft² = 0.09290304 m²`
- `1 m² = 10.7639104167 ft²`
- `ΔT°F = ΔT°C × 1.8`
- `ΔT°C = ΔT°F / 1.8`
- `1 CFM = 1.69901082 m³/h`
- `1 CFM = 0.47194745 L/s`
- `1 W/ft² = 10.7639104167 W/m²`
- `1 kW = 3,412 BTU/h`
- `1 refrigeration ton = 12,000 BTU/h ≈ 3.517 kW`

Delta T conversion is a temperature-difference conversion, not an absolute temperature conversion. Do not add or subtract 32 when converting `ΔT`.

Internal calculations use canonical I-P values while display values are converted for I-P or SI. User-edited values, presets, saved scenarios, and share URLs convert directly and may display non-round equivalents.

## Display Behavior by Unit System

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
