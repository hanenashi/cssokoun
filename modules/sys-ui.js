const log = (level, ...args) => window.cssokoun.log(level, 'sys-ui', ...args);
log('INFO', 'Building Native Window Hub...');

window.cssokoun.hubWindow = null;

function injectUI() {
    const menu = document.querySelector('.head .menu');
    if (!menu) return log('ERROR', 'Could not find .head .menu');

    const hubBtn = document.createElement('a');
    hubBtn.href = '#';
    hubBtn.innerHTML = '⚙️ <b>cssokoun</b>';
    hubBtn.style.cssText = 'margin-left: 10px; color: var(--cso-accent, #007acc); text-decoration: none; font-weight: bold; transition: color 0.2s;';
    menu.appendChild(hubBtn);

    hubBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (window.cssokoun.hubWindow && !window.cssokoun.hubWindow.closed) {
            window.cssokoun.hubWindow.focus();
            return;
        }

        const win = window.open('', 'cssokounHub', 'width=360,height=650,menubar=no,toolbar=no,location=no,status=no');
        window.cssokoun.hubWindow = win;

        const state = window.cssokoun.state.modules;
        const manifest = window.cssokoun.manifest;

        let themeOptions = '<option value="">-- Vanilla Okoun --</option>';
        if (manifest.themes) {
            manifest.themes.forEach(mod => {
                const selected = state[mod.id] ? 'selected' : '';
                themeOptions += `<option value="${mod.id}" ${selected}>${mod.name}</option>`;
            });
        }

        let tweakRows = '';
        if (manifest.tweaks) {
            manifest.tweaks.forEach(mod => {
                const checked = state[mod.id] ? 'checked' : '';
                tweakRows += `
                    <div class="cssokoun-toggle-row">
                        <label for="chk-${mod.id}" style="cursor: pointer; flex-grow: 1;">${mod.name}</label>
                        <input type="checkbox" id="chk-${mod.id}" class="cssokoun-sys-toggle" data-id="${mod.id}" ${checked}>
                    </div>
                `;
            });
        }

        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>cssokoun Hub</title>
                <style>
                    :root {
                        --cso-bg-base: #1e1e1e; --cso-bg-panel: #252526; --cso-bg-input: #3c3c3c;
                        --cso-border: #454545; --cso-text-main: #cccccc; --cso-text-bright: #ffffff;
                        --cso-accent: #007acc; --cso-accent-hover: #0098ff; --cso-success: #6A9955;
                        --cso-font-sans: 'Segoe UI', system-ui, sans-serif;
                    }
                    body { background: var(--cso-bg-base); color: var(--cso-text-main); font-family: var(--cso-font-sans); margin: 0; padding: 20px; box-sizing: border-box; }
                    ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: var(--cso-bg-base); } ::-webkit-scrollbar-thumb { background: var(--cso-border); border-radius: 4px; }
                    
                    h3 { margin: 0 0 20px 0; color: var(--cso-text-bright); font-size: 20px; font-weight: 600; border-bottom: 1px solid var(--cso-border); padding-bottom: 15px; text-align: center; }
                    .section-title { margin: 0 0 10px 0; color: var(--cso-text-bright); border-bottom: 1px solid var(--cso-border); padding-bottom: 6px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    select { width: 100%; padding: 10px; background: var(--cso-bg-input); color: var(--cso-text-bright); border: 1px solid var(--cso-border); border-radius: 4px; font-size: 14px; margin-bottom: 25px; outline: none; cursor: pointer; }
                    select:focus { border-color: var(--cso-accent); }
                    
                    .cssokoun-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; border-radius: 4px; transition: background 0.2s; }
                    .cssokoun-toggle-row:hover { background: rgba(255,255,255,0.05); }
                    input[type="checkbox"] { transform: scale(1.3); cursor: pointer; accent-color: var(--cso-accent); }
                    
                    .launch-pad { margin-top: 30px; display: flex; flex-direction: column; gap: 10px; }
                    button { width: 100%; border: none; padding: 12px; cursor: pointer; border-radius: 4px; font-weight: 600; font-size: 14px; color: #fff; transition: background 0.2s; font-family: var(--cso-font-sans); }
                    #btn-save { background: var(--cso-success); margin-bottom: 15px; } #btn-save:hover { background: #5a8247; }
                    #btn-editor { background: #c586c0; } #btn-editor:hover { background: #a864a3; }
                    #btn-inspector { background: var(--cso-accent); } #btn-inspector:hover { background: var(--cso-accent-hover); }
                </style>
            </head>
            <body>
                <h3>⚙️ cssokoun Control Hub</h3>
                
                <h4 class="section-title">Base Theme</h4>
                <select id="cssokoun-theme-dropdown">${themeOptions}</select>

                <h4 class="section-title">Behavioral Tweaks</h4>
                <div style="margin-bottom: 20px;">${tweakRows}</div>
                
                <button id="btn-save">💾 Save Configuration & Reload</button>
                
                <div class="launch-pad">
                    <h4 class="section-title">Developer Tools</h4>
                    <button id="btn-editor">🪟 Launch Code Editor</button>
                    <button id="btn-inspector">🔍 Launch Visual Inspector</button>
                </div>
            </body>
            </html>
        `);
        win.document.close();

        const doc = win.document;

        doc.getElementById('btn-save').addEventListener('click', () => {
            const newStates = {};
            doc.querySelectorAll('.cssokoun-sys-toggle').forEach(chk => { newStates[chk.dataset.id] = chk.checked; });
            manifest.themes.forEach(mod => newStates[mod.id] = false);
            const selectedTheme = doc.getElementById('cssokoun-theme-dropdown').value;
            if (selectedTheme) newStates[selectedTheme] = true;

            GM.set('cssokoun_modules', newStates);
            log('INFO', 'Preferences saved. Reloading host page...');
            window.location.reload();
        });

        doc.getElementById('btn-editor').addEventListener('click', () => {
            if (window.cssokoun.launchEditor) window.cssokoun.launchEditor();
        });

        doc.getElementById('btn-inspector').addEventListener('click', () => {
            if (window.cssokoun.launchInspector) window.cssokoun.launchInspector();
        });
    });
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', injectUI); } else { injectUI(); }