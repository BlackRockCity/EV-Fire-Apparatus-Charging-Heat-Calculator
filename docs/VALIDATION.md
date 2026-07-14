# Validation and Verification

## Current Status

The EV Fire Apparatus Charging Heat Calculator was created in November 2025. It has not undergone real-world testing or professional certification.

The calculator is intended for preliminary HVAC sizing. Confirm assumptions with OEMs, qualified HVAC designers, and the authority having jurisdiction.

## Automated Testing

The project includes automated Vitest and Playwright regression tests.

Test coverage includes:

- Input hardening
- Regression calculations
- Localization completeness
- Placeholder translation checks
- I-P/SI unit switching
- Report generation
- Saved scenarios
- Share URLs
- Browser smoke tests

## Safety and Data-Handling Checks

- Hardened input validation with safe limits
- Bounded URL and inventory parsing to avoid malformed or oversized shared scenarios
- Escaped report content and sanitized scenario data
- Malformed shared URL data is ignored safely
- Oversized inventories are capped

## Engineering Verification Still Required

Automated software tests do not establish that the engineering assumptions match every apparatus, charger, building, climate, or operating condition. Project-specific review should include:

- OEM confirmation of charger efficiency and cabinet losses
- OEM confirmation of vehicle charging efficiency
- Confirmation of where BTMS heat is rejected
- Confirmation of actual coincident charging demand
- Review of the selected diversity and safety factors
- Review of ventilation assumptions and allowable temperature rise
- Confirmation that sensible-only modeling is appropriate
- Review by a qualified HVAC designer and the authority having jurisdiction

## Related Documentation

- [Technical Reference](TECHNICAL_REFERENCE.md)
- [Development Guide](DEVELOPMENT.md)
