# MASTER v2 home implementation

Working branch: `implementation/master-v2-home`

The home screen is implemented as real React components.

Current decisions:
- Hero decorative imagery and CTA decorative assets use exact Figma-exported assets.
- Text is live HTML, with Czech diacritics restored.
- Card rows are functional HTML buttons and can be sorted.
- The main CTA opens the first-side capture step.
- The approved master screenshot remains only a visual-regression reference.

Temporary implementation detail:
The exact Figma asset URLs used for the first preview are short-lived. Before production merge they must be downloaded into the repository and referenced locally.
