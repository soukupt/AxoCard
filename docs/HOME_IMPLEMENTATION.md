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


Provider recognition v1:
- Brand/provider is populated only from a real signal.
- Current browser-only pass uses filename metadata when it clearly matches a known provider.
- No provider name is fabricated when recognition fails.
- Next upgrade path: OCR/logo classification from the image itself, preferably via a dedicated OCR/model service or native iOS Vision.
