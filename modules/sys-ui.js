const log = (level, ...args) => window.cssokoun.log(level, 'sys-ui', ...args);
log('INFO', 'Building Professional Draggable UI Panel...');

function injectUI() {
    const menu = document.querySelector('.head .menu');
    if (!menu) return log('ERROR', 'Could not find .head .menu');

    const hubBtn = document.createElement('a');
    hubBtn.href = '#';
    hubBtn.innerHTML = '⚙️ <b>cssokoun</b>';
    hubBtn.style.cssText = 'margin-left: 10px; color: var(--cso-accent, #007acc); text-decoration: none; transition: color 0.2s;';
    menu.appendChild(hubBtn);

    const panel = document.createElement('div');
    panel.id = 'cssokoun-ui-panel'; 
    
    const uiStyle = document.createElement('style');
    uiStyle.textContent = `
        :root {
            --cso-bg-base: #1e1e1e;
            --cso-bg-panel: #252526;
            --cso-bg-input: #3c3c3c;
            --cso-border: #454545;
            --cso-text-main: #cccccc;
            --cso-text-bright: #ffffff;
            --cso-text-muted: #888888;
            --cso-accent: #007acc;
            --cso-accent-hover: #0098ff;
            --cso-danger: #d16969;
            --cso-success: #6A9955;
            --cso-warning: #d7ba7d;
            --cso-radius: 6px;
            --cso-shadow: 0 12px 32px rgba(0,0,0,0.6);
            --cso-font-sans: 'Segoe UI', system-ui, -apple-system, sans-serif;
            --cso-font-mono: Consolas, 'Courier New', monospace;
        }

        #cssokoun-ui-panel {
            position: fixed; background: var(--cso-bg-base); color: var(--cso-text-main); z-index: 999999;
            font-family: var(--cso-font-sans); display: flex; flex-direction: column;
            box-shadow: var(--cso-shadow);
        }
        
        #cssokoun-ui-panel * { box-sizing: border-box; }
        
        /* Custom Scrollbars */
        #cssokoun-ui-panel ::-webkit-scrollbar { width: 8px; }
        #cssokoun-ui-panel ::-webkit-scrollbar-track { background: var(--cso-bg-base); }
        #cssokoun-ui-panel ::-webkit-scrollbar-thumb { background: var(--cso-border); border-radius: 4px; }
        #cssokoun-ui-panel ::-webkit-scrollbar-thumb:hover { background: var(--cso-text-muted); }

        .cssokoun-header { padding: 12px 16px; border-bottom: 1px solid var(--cso-border); display: flex; justify-content: space-between; align-items: center; background: var(--cso-bg-panel); cursor: grab; }
        .cssokoun-header h3 { margin: 0; font-size: 15px; color: var(--cso-text-bright); font-weight: 600; pointer-events: none; }
        .cssokoun-close-btn { background: none; border: none; color: var(--cso-text-muted); font-size: 20px; cursor: pointer; transition: color 0.2s; padding: 0; line-height: 1; }
        .cssokoun-close-btn:hover { color: var(--cso-danger); }
        
        .cssokoun-content { padding: 16px; overflow-y: auto; flex-grow: 1; }
        .cssokoun-section-title { margin: 0 0 10px 0; color: var(--cso-text-bright); border-bottom: 1px solid var(--cso-border); padding-bottom: 6px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .cssokoun-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; border-radius: 4px; transition: background 0.2s; }
        .cssokoun-toggle-row input[type="checkbox"] { transform: scale(1.3); margin-right: 5px; cursor: pointer; accent-color: var(--cso-accent); }
        
        .cssokoun-select { width: 100%; padding: 8px 10px; background: var(--cso-bg-input); color: var(--cso-text-bright); border: 1px solid var(--cso-border); border-radius: var(--cso-radius); font-size: 14px; margin-bottom: 20px; outline: none; cursor: pointer; font-family: var(--cso-font-sans); }
        .cssokoun-select:focus { border-color: var(--cso-accent); }
        
        .cssokoun-btn { width: 100%; padding: 10px; color: var(--cso-text-bright); border: 1px solid transparent; border-radius: var(--cso-radius); font-size: 13px; font-weight: 600; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; font-family: var(--cso-font-sans); display: flex; justify-content: center; align-items: center; gap: 8px; }
        .cssokoun-btn-primary { background: var(--cso-accent); }
        .cssokoun-btn-primary:hover { background: var(--cso-accent-hover); }
        .cssokoun-btn-success { background: var(--cso-success); }
        .cssokoun-btn-success:hover { background: #5a8247; }
        .cssokoun-btn-secondary { background: var(--cso-bg-input); border-color: var(--cso-border); }
        .cssokoun-btn-secondary:hover { background: #4a4a4a; }

        @media (max-width: 768px) {
            #cssokoun-ui-panel { bottom: -100%; left: 0; width: 100%; height: 75vh; border-top: 2px solid var(--cso-accent); border-radius: 15px 15px 0 0; transition: bottom 0.3s ease; }
            #cssokoun-ui-panel.active { bottom: 0; }
            .cssokoun-header { cursor: default; border-radius: 15px 15px 0 0; } 
        }
        @media (min-width: 769px) {
            #cssokoun-ui-panel { top: 50px; right: 20px; width: 340px; max-height: 80vh; border: 1px solid var(--cso-border); border-top: 3px solid var(--cso-accent); border-radius: var(--cso-radius); display: none; }
            #cssokoun-ui-panel.active { display: flex; }
            .cssokoun-toggle-row:hover { background: rgba(255,255,255,0.05); } 
        }
    `;
    document.head.appendChild(uiStyle);

    let html = `
        <div class="cssokoun-header" id="cssokoun-ui-header">
            <h3>⚙️ cssokoun Hub</h3>
            <button class="cssokoun-close-btn" id="cssokoun-close">×</button>
        </div>
        <div class="cssokoun-content">
            <h4 class="cssokoun-section-title">Base Theme</h4>
            <select id="cssokoun-theme-dropdown" class="cssokoun-select">
                <option value="">-- Vanilla Okoun --</option>
            </select>

            <h4 class="cssokoun-section-title" style="margin-top: 10px;">Behavioral Tweaks</h4>
            <div id="cssokoun-module-list" style="margin-bottom: 20px;"></div>
            
            <button id="cssokoun-save" class="cssokoun-btn cssokoun-btn-success">💾 Save Configuration</button>
            <div id="cssokoun-editor-hook"></div>
            <button id="cssokoun-inspect" class="cssokoun-btn cssokoun-btn-secondary">🔍 Visual Inspector</button>
        </div>
    `;
    panel.innerHTML = html;
    document.body.appendChild(panel);

    const state = window.cssokoun.state.modules;
    const manifest = window.cssokoun.manifest;

    const themeSelect = document.getElementById('cssokoun-theme-dropdown');
    if (manifest.themes) {
        manifest.themes.forEach(mod => {
            const option = document.createElement('option');
            option.value = mod.id;
            option.textContent = mod.name;
            if (state[mod.id]) option.selected = true;
            themeSelect.appendChild(option);
        });
    }

    const modList = document.getElementById('cssokoun-module-list');
    if (manifest.tweaks) {
        manifest.tweaks.forEach(mod => {
            const checked = state[mod.id] ? 'checked' : '';
            modList.innerHTML += `
                <div class="cssokoun-toggle-row">
                    <label for="chk-${mod.id}" style="flex-grow: 1; cursor: pointer;">${mod.name}</label>
                    <input type="checkbox" id="chk-${mod.id}" class="cssokoun-sys-toggle" data-id="${mod.id}" ${checked}>
                </div>
            `;
        });
    }

    const header = document.getElementById('cssokoun-ui-header');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
        if (window.innerWidth <= 768) return; 
        isDragging = true; startX = e.clientX; startY = e.clientY;
        initialX = panel.offsetLeft; initialY = panel.offsetTop;
        panel.style.right = 'auto'; panel.style.left = initialX + 'px'; panel.style.top = initialY + 'px';
        header.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panel.style.left = (initialX + e.clientX - startX) + 'px';
        panel.style.top = (initialY + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; header.style.cursor = 'grab'; } });

    hubBtn.addEventListener('click', (e) => { e.preventDefault(); panel.classList.toggle('active'); });
    document.getElementById('cssokoun-close').addEventListener('click', () => panel.classList.remove('active'));

    document.getElementById('cssokoun-save').addEventListener('click', () => {
        const newStates = {};
        document.querySelectorAll('.cssokoun-sys-toggle').forEach(chk => { newStates[chk.dataset.id] = chk.checked; });
        manifest.themes.forEach(mod => newStates[mod.id] = false);
        const selectedTheme = document.getElementById('cssokoun-theme-dropdown').value;
        if (selectedTheme) newStates[selectedTheme] = true;

        GM.set('cssokoun_modules', newStates);
        log('INFO', 'Preferences saved. Reloading...');
        window.location.reload();
    });
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', injectUI); } else { injectUI(); }