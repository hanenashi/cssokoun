# cssokoun

**TL;DR:** A tiny Tampermonkey CSS style switcher for okoun.cz.

Install the seed script once and it fetches the current loader, manifest, and CSS themes directly from this GitHub repo. The UI adds a small `cssokoun` link to Okoun's header menu; click it, choose a style, and press Apply.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Click this link to install the seed script:
   [Install cssokoun.user.js](https://raw.githubusercontent.com/hanenashi/cssokoun/main/cssokoun.user.js)

## What It Does

- Loads one selected CSS theme from `modules.json`.
- Stores the selected theme in Tampermonkey storage.
- Lets you switch back to vanilla Okoun.
- Avoids custom code injection, visual inspection tools, and popup editor windows.

## Files

- `cssokoun.user.js` - Tampermonkey seed script.
- `modules/core.js` - remote loader and manifest reader.
- `modules/sys-ui.js` - small in-page CSS style picker.
- `modules.json` - list of available CSS styles.
- `themes/*.css` - selectable Okoun styles.
