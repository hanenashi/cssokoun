const log = (level, ...args) => window.cssokoun.log(level, 'sys-ui', ...args);
log('INFO', 'Building Draggable Responsive UI Panel...');

function injectUI() {
    const menu = document.querySelector('.head .menu');
    if (!menu) return log('ERROR', 'Could not find .head .menu');

    const hubBtn = document.createElement('a');
    hubBtn.href = '#';
    hubBtn.innerHTML = '🎨 <b>cssokoun</b>';
    hubBtn.style.cssText = 'margin-left: 10px; color: #0ff; text-decoration: none;';
    menu.appendChild(hubBtn);

    const panel = document.createElement('div');
    panel.id = 'cssokoun-ui-panel'; 
    
    const uiStyle = document.createElement('style');
    uiStyle.textContent = `
        #cssokoun-ui-panel {
            position: fixed; background: #111; color: #eee; z-index: 999999;
            font-family: sans-serif; display: flex; flex-direction: column;
            box-shadow: 0 5px 20px rgba(0,0,0,0.8);
        }
        .cssokoun-header { padding: 15px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background: #1a1a1a; cursor: grab; }
        .cssokoun-header h3 { margin: 0; font-size: 18px; color: #0ff; pointer-events: none; }
        .cssokoun-close-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
        .cssokoun-content { padding: 15px; overflow-y: auto; flex-grow: 1; }
        .cssokoun-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #222; font-size: 16px; }
        .cssokoun-toggle-row input[type="checkbox"] { transform: scale(1.5); margin-right: 10px; cursor: pointer; }
        .cssokoun-btn { width: 100%; padding: 12px; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; margin-bottom: 10px; cursor: pointer; }

        @media (max-width: 768px) {
            #cssokoun-ui-panel { bottom: -100%; left: 0; width: 100%; height: 75vh; border-top: 2px solid #0ff; border-radius: 15px 15px 0 0; transition: bottom 0.3s ease; }
            #cssokoun-ui-panel.active { bottom: 0; }
            .cssokoun-header { cursor: default; } /* No dragging on mobile */
        }
        @media (min-width: 769px) {
            #cssokoun-ui-panel { top: 50px; right: 20px; width: 350px; max-height: 80vh; border: 1px solid #333; border-top: 2px solid #0ff; border-radius: 8px; display: none; }
            #cssokoun-ui-panel.active { display: flex; }
            .cssokoun-toggle-row:hover { background: rgba(255,255,255,0.05); } 
        }
    `;
    document.head.appendChild(uiStyle);

    let html = `
        <div class="cssokoun-header" id="cssokoun-ui-header">
            <h3>🎨 cssokoun Hub</h3>
            <button class="cssokoun-close-btn" id="cssokoun-close">×</button>
        </div>
        <div class="cssokoun-content">
            <h4 style="margin-top:0; color:#aaa; border-bottom: 1px solid #333; padding-bottom: 5px;">Modules</h4>
            <div id="cssokoun-module-list" style="margin-bottom: 15px;"></div>
            
            <button id="cssokoun-save" class="cssokoun-btn" style="background: #050;">💾 Save Toggles & Reload</button>
            <div id="cssokoun-editor-hook"></div> <button id="cssokoun-inspect" class="cssokoun-btn" style="background: #0078D7;">🔍 Visual Inspector</button>
        </div>
    `;
    panel.innerHTML = html;
    document.body.appendChild(panel);

    // Populate Modules
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

    // --- DRAG LOGIC FOR HUB ---
    const header = document.getElementById('cssokoun-ui-header');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
        if (window.innerWidth <= 768) return; // Prevent drag on mobile bottom sheet
        isDragging = true; startX = e.clientX; startY = e.clientY;
        initialX = panel.offsetLeft; initialY = panel.offsetTop;
        
        // Lock positioning to Left/Top so dragging doesn't jump
        panel.style.right = 'auto';
        panel.style.left = initialX + 'px';
        panel.style.top = initialY + 'px';
        
        header.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panel.style.left = (initialX + e.clientX - startX) + 'px';
        panel.style.top = (initialY + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => { 
        if (isDragging) { isDragging = false; header.style.cursor = 'grab'; } 
    });

    // Toggle Handlers
    hubBtn.addEventListener('click', (e) => { e.preventDefault(); panel.classList.toggle('active'); });
    document.getElementById('cssokoun-close').addEventListener('click', () => panel.classList.remove('active'));

    document.getElementById('cssokoun-save').addEventListener('click', () => {
        const newStates = {};
        document.querySelectorAll('.cssokoun-sys-toggle').forEach(chk => { newStates[chk.dataset.id] = chk.checked; });
        GM.set('cssokoun_modules', newStates);
        log('INFO', 'Preferences saved. Reloading...');
        window.location.reload();
    });
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', injectUI); } else { injectUI(); }