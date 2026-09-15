# AxoCard

Source of truth:
- Design master: Figma frame `AxoCard_MASTER_v2_APROVED` (node 8:2)
- Code master: this repository
- Deployment: Vercel after visual gate passes

Rules:
1. Do not change approved design during implementation.
2. Fix OCR/transcription errors in generated code (Czech diacritics) to match approved copy.
3. Keep the Figma master screenshot only as a visual regression reference, not as the production UI.
4. Production UI must be implemented as functional components.
5. No production deploy until visual comparison and functional QA pass.

Locked flow:
Home → První strana (required) → Druhá strana (optional) → Kontrola karty → Hotovo.
