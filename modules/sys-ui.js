// modules/sys-ui.js
const log = (level, ...args) => window.cssokoun.log(level, 'sys-ui', ...args);

log('INFO', 'Building Mobile-Optimized UI Panel...');

function injectUI() {
    // 1. Attach the Hub Button to Okoun's top menu
    const menu = document.querySelector('.head .menu');
    if (!menu) return log('ERROR', 'Could not find .head .menu');

    const hubBtn = document.createElement('a');
    hubBtn.href = '#';
    hubBtn.innerHTML = '🎨 <b>cssokoun</b>';
    hubBtn.style.cssText = 'margin-left: 10px; color: #0ff; text-decoration: none;';
    menu.appendChild(hubBtn);

    // 2. Build the Mobile "Bottom Sheet" Panel
    const panel = document.createElement('div');
    panel.id = 'cssokoun-mobile-panel';
    
    // Inject mobile-friendly CSS for the UI
    const uiStyle = document.createElement('style');
    uiStyle.textContent = `
        #cssokoun-mobile-panel {
            position: fixed; bottom: -100%; left: 0; width: 100%; height: 75vh;
            background: #111; color: #eee; z-index: 999999;
            transition: bottom 0.3s ease-in-out; border-top: 2px solid #0ff;
            border-radius: 15px 15px 0 0; box-shadow: 0 -5px 20px rgba(0,0,0,0.8);
            font-family: sans-serif; display: flex; flex-direction: column;
        }
        .cssokoun-header {
            padding: 15px; border-bottom: 1px solid #333; display: flex;
            justify-content: space-between; align-items: center;
        }
        .cssokoun-header h3 { margin: 0; font-size: 18px; color: #0ff; }
        .cssokoun-close-btn { background: none; border: none; color: #fff; font-size: 24px; }
        .cssokoun-content { padding: 15px; overflow-y: auto; flex-grow: 1; }
        
        /* Thumb-friendly toggles */
        .cssokoun-toggle-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 0; border-bottom: 1px solid #222; font-size: 16px;
        }
        .cssokoun-toggle-row input[type="checkbox"] { transform: scale(1.5); margin-right: 10px; }
        
        .cssokoun-btn {
            width: 100%; padding: 15px; background: #0078D7; color: #fff;
            border: none; border-radius: 8px; font-size: 16px; font-weight: bold;
            margin-top: 15px;
        }
    `;
    document.head.appendChild(uiStyle);

    // Build the HTML structure
    let html = `
        <div class="cssokoun-header">
            <h3>🎨 cssokoun Hub</h3>
            <button class="cssokoun-close-btn" id="cssokoun-close">×</button>
        </div>
        <div class="cssokoun-content">
            <h4 style="margin-top:0; color:#aaa;">Modules</h4>
            <div id="cssokoun-module-list"></div>
            
            <button id="cssokoun-save" class="cssokoun-btn" style="background: #050;">Save & Reload</button>
            <button id="cssokoun-inspect" class="cssokoun-btn">🔍 Visual Inspector (Tap Mode)</button>
        </div>
    `;
    panel.innerHTML = html;
    document.body.appendChild(panel);

    // 3. Populate Modules from Manifest dynamically
    const modList = document.getElementById('cssokoun-module-list');
    const state = window.cssokoun.state.modules;
    const manifest = window.cssokoun.manifest;

    const renderToggle = (mod, type) => {
        const checked = state[mod.id] ? 'checked' : '';
        return `
            <div class="cssokoun-toggle-row">
                <label for="chk-${mod.id}" style="flex-grow: 1;">${mod.name || mod.id} <small style="color:#666;">(${type})</small></label>
                <input type="checkbox" id="chk-${mod.id}" class="cssokoun-sys-toggle" data-id="${mod.id}" ${checked}>
            </div>
        `;
    };

    if (manifest.themes) manifest.themes.forEach(mod => modList.innerHTML += renderToggle(mod, 'CSS'));
    if (manifest.tweaks) manifest.tweaks.forEach(mod => modList.innerHTML += renderToggle(mod, 'JS'));

    // 4. Event Listeners
    hubBtn.addEventListener('click', (e) => {
        e.preventDefault();
        panel.style.bottom = '0'; // Slide up
    });

    document.getElementById('cssokoun-close').addEventListener('click', () => {
        panel.style.bottom = '-100%'; // Slide down
    });

    document.getElementById('cssokoun-save').addEventListener('click', () => {
        const newStates = {};
        document.querySelectorAll('.cssokoun-sys-toggle').forEach(chk => {
            newStates[chk.dataset.id] = chk.checked;
        });
        
        // Use the GM API we passed through the core
        GM.set('cssokoun_modules', newStates);
        log('INFO', 'Preferences saved. Reloading...');
        window.location.reload();
    });

    log('SNIFF', 'Mobile UI fully injected.');
}

// Ensure the page is ready before injecting
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
} else {
    injectUI();
}
