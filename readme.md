# cssokoun

**TL;DR:** A modular CSS/JS hub and theme manager for okoun.cz. 

It uses a microkernel architecture. You install the Tampermonkey seed once, and it fetches the core, manifest, and all modules directly from this GitHub repo. Zero Tampermonkey updates required when tweaking themes.

## 📦 Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Click this link to install the seed script:
   👉 **[Install cssokoun.user.js](https://raw.githubusercontent.com/hanenashi/cssokoun/main/cssokoun.user.js)**

## 🗺️ Roadmap Skeleton

**Phase 1: Architecture (Current)**
- [x] Create Tampermonkey Seed script.
- [x] Build remote `core.js` and `modules.json` manifest fetcher.
- [ ] Implement `sys-logger` for buffered, color-coded console debugging.

**Phase 2: The Hub UI**
- [ ] Build `sys-ui` module to inject the floating control panel.
- [ ] Wire up toggles for enabling/disabling modules via `localStorage`.
- [ ] Add live-editor textareas for quick local CSS/JS overrides.

**Phase 3: Visual Inspector**
- [ ] Build `sys-inspector` module.
- [ ] Implement point-and-click element highlighting.
- [ ] Auto-generate CSS selectors and apply live style changes.

**Phase 4: Themes & Tweaks**
- [ ] Port existing Stylus "Mobile Theme" into a clean CSS module.
- [ ] Add behavioral tweaks (e.g., troll hiding scripts).

**Phase 5: Ecosystem Bridging**
- [ ] Create compatibility CSS layers so cssokoun blends perfectly with OPUc, GoToT, and the Fotki lightbox.
