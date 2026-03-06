# cssokoun

**TL;DR:** A modular CSS/JS hub and theme manager for okoun.cz. 

It uses a microkernel architecture. You install the Tampermonkey seed once, and it fetches the core, manifest, and all modules directly from this GitHub repo. Zero Tampermonkey updates required when tweaking themes.

## 📦 Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Click this link to install the seed script:
   👉 **[Install cssokoun.user.js](https://raw.githubusercontent.com/hanenashi/cssokoun/main/cssokoun.user.js)**

## 🗺️ Roadmap Skeleton

**Phase 1: Architecture**
- [x] Create Tampermonkey Seed script.
- [x] Build remote `core.js` and `modules.json` manifest fetcher.
- [x] Implement `sys-logger` for buffered, color-coded console debugging.

**Phase 2: The Hub UI & Live Editor**
- [x] Build `sys-ui` module to launch the central Control Hub (Native Window).
- [x] Wire up toggles and dropdowns for themes/modules via `localStorage`.
- [x] Build standalone Live Code Editor with Import/Export and active theme scraping (Native Window).

**Phase 3: Visual Inspector**
- [x] Build `sys-inspector` module with sticky Selection Mode (Native Window).
- [x] Implement point-and-click DevTools-style element highlighting.
- [x] Auto-generate CSS selectors and inject live style changes with Undo/Compare history.

**Phase 4: Themes & Tweaks (Ongoing)**
- [x] Port legacy Stylus themes (Mobile, MAGEO, Kostej3, Darksilver, Silverlight) into pure CSS modules.
- [x] Add system behavioral tweaks (e.g., Mobile Viewport forcing).
- [ ] Add community behavioral tweaks (e.g., troll hiding scripts).

**Phase 5: Ecosystem Bridging (Current)**
- [ ] Create compatibility CSS layers (Custom Class Wrapper) so cssokoun blends perfectly with OPUc, GoToT, and the Fotki lightbox.
