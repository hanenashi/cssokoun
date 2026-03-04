const log = (level, ...args) => window.cssokoun.log(level, 'sys-ui', ...args);

log('INFO', 'Building Responsive UI Panel...');

function injectUI() {
    // 1. Attach the Hub Button to Okoun's top menu
    const menu = document.querySelector('.head .menu');
    if (!menu) return log('ERROR', 'Could not find .head .menu');

    const hubBtn = document.createElement('a');
    hubBtn.href = '#';
    hubBtn.innerHTML = '🎨 <b>cssokoun</b>';
    hubBtn.style.cssText = 'margin-left: 10px; color: #0ff; text-decoration: none;';
    menu.appendChild(hubBtn);

    // 2. Build the Responsive Panel
    const panel = document.createElement('div');
    panel.id = 'cssokoun-ui-panel'; // FIXED ID!
    
    // Inject responsive CSS
    const uiStyle = document.createElement('style');
    uiStyle.textContent = `
        #cssokoun-ui-panel {
            position: fixed; background: #111; color: #eee; z-index: 999999;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
            font-family: sans-serif; display: flex; flex-direction: column;
            box-shadow: 0 5px 20px rgba(0,0,0,0.8);
        }
        .cssokoun-header { padding: 15px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
        .cssokoun-header h3 { margin: 0; font-size: 18px; color: #0ff; }
        .cssokoun-close-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
        .cssokoun-content { padding: 15px; overflow-y: auto; flex-grow: 1; }
        .cssokoun-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #222; font-size: 16px; }
        .cssokoun-toggle-row input[type="checkbox"] { transform: scale(1.5); margin-right: 10px; cursor: pointer; }
        .cssokoun-btn { width: 100%; padding: 15px; background: #0078D7; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin-top: 15px; cursor: pointer; }

        /* MOBILE VIEW: Bottom Sheet */
        @media (max-width: 768px) {
            #cssokoun-ui-panel {
                bottom: -100%; left: 0; width: 100%; height: 75vh;
                border-top: 2px solid #0ff; border-radius: 15px 15px 0 0;
            }
            #cssokoun-ui-panel.active { bottom: 0; }
        }

        /* DESKTOP VIEW: Floating Sidebar */
        @media (min-width: 769px) {
            #cssokoun-ui-panel {
                top: 50px; right: -500px; width: 400px; max-height: 80vh;
                border: 1px solid #333; border-top: 2px solid #0ff; border-radius: 8px;
            }
            #cssokoun-ui-panel.active { right: 20px; }
            .cssokoun-toggle-row:hover { background: rgba(255,255,255,0.05); } 
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
                <label for="chk-${mod.id}" style="flex-grow: 1; cursor: pointer;">${mod.name || mod.id} <small style="color:#666;">(${type})</small></label>
                <input type="checkbox" id="chk-${mod.id}" class="cssokoun-sys-toggle" data-id="${mod.id}" ${checked}>
            </div>
        `;
    };

    if (manifest.themes) manifest.themes.forEach(mod => modList.innerHTML += renderToggle(mod, 'CSS'));
    if (manifest.tweaks) manifest.tweaks.forEach(mod => modList.innerHTML += renderToggle(mod, 'JS'));

    // 4. Event Listeners
    hubBtn.addEventListener('click', (e) => {
        e.preventDefault();
        panel.classList.toggle('active');
    });

    document.getElementById('cssokoun-close').addEventListener('click', () => {
        panel.classList.remove('active');
    });

    document.getElementById('cssokoun-save').addEventListener('click', () => {
        const newStates = {};
        document.querySelectorAll('.cssokoun-sys-toggle').forEach(chk => {
            newStates[chk.dataset.id] = chk.checked;
        });
        
        GM.set('cssokoun_modules', newStates);
        log('INFO', 'Preferences saved. Reloading...');
        window.location.reload();
    });

    log('SNIFF', 'Responsive UI fully injected.');
}

// Ensure the page is ready before injecting
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
} else {
    injectUI();
}
