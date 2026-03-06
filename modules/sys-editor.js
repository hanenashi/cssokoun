const log = (level, ...args) => cssokoun.log(level, 'sys-editor', ...args);
log('INFO', 'Loading Bulletproof Native Editor module...');

window.cssokoun.editorWindow = null;

window.cssokoun.launchEditor = function() {
    if (window.cssokoun.editorWindow && !window.cssokoun.editorWindow.closed) {
        window.cssokoun.editorWindow.focus();
        return;
    }

    const customCSS = GM.get('cssokoun_custom_css', '');
    const customJS = GM.get('cssokoun_custom_js', '');

    let themeSource = '';
    if (window.cssokoun.activeThemeCache) {
        for (const [themeId, cssText] of Object.entries(window.cssokoun.activeThemeCache)) {
            themeSource += `/* === THEME: ${themeId} === */\n`;
            themeSource += cssText + '\n\n';
        }
    }
    if (!themeSource) themeSource = '/* No Base Theme Loaded (Vanilla) */';

    const win = window.open('', '_blank', 'width=700,height=850,menubar=no,toolbar=no,location=no,status=no');
    window.cssokoun.editorWindow = win;

    win.document.open(); // Flush document stream
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>cssokoun Code Editor</title>
            <style>
                :root {
                    --cso-bg-base: #1e1e1e; --cso-bg-input: #1e1e1e; --cso-border: #454545;
                    --cso-text-main: #cccccc; --cso-text-bright: #ffffff;
                    --cso-accent: #007acc; --cso-accent-hover: #0098ff; --cso-danger: #d16969; --cso-success: #6A9955;
                    --cso-font-sans: 'Segoe UI', system-ui, sans-serif; --cso-font-mono: Consolas, 'Courier New', monospace;
                }
                body { background: var(--cso-bg-base); color: var(--cso-text-main); font-family: var(--cso-font-sans); margin: 0; padding: 20px; box-sizing: border-box; }
                ::-webkit-scrollbar { width: 10px; height: 10px; } ::-webkit-scrollbar-track { background: var(--cso-bg-base); } ::-webkit-scrollbar-thumb { background: var(--cso-border); border-radius: 5px; border: 2px solid var(--cso-bg-base); }
                
                h4 { margin: 0 0 15px 0; color: var(--cso-text-bright); font-size: 16px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid var(--cso-border); padding-bottom: 10px; }
                label { font-size: 12px; color: #9cdcfe; margin-bottom: 5px; display: block; font-family: var(--cso-font-mono); }
                textarea { width: 100%; background: var(--cso-bg-input); font-family: var(--cso-font-mono); font-size: 13px; border: 1px solid var(--cso-border); padding: 12px; margin-bottom: 15px; box-sizing: border-box; border-radius: 4px; resize: vertical; line-height: 1.5; outline: none; transition: border-color 0.2s; }
                textarea:focus { border-color: var(--cso-accent); }
                
                #theme-area { height: 180px; color: #6a9955; background: #1a1a1a; }
                #css-area { height: 280px; color: #d4d4d4; }
                #js-area { height: 120px; color: #ce9178; }
                
                .btn-row { display: flex; gap: 10px; margin-bottom: 10px; }
                button { border: none; padding: 10px 14px; cursor: pointer; border-radius: 4px; font-weight: 600; font-size: 13px; color: #fff; transition: background 0.2s; font-family: var(--cso-font-sans); }
                #btn-save { flex: 2; background: var(--cso-success); } #btn-save:hover { background: #5a8247; }
                #btn-import { flex: 1; background: #c586c0; color: #fff; } #btn-import:hover { background: #a864a3; }
                #btn-export { flex: 1; background: var(--cso-accent); } #btn-export:hover { background: var(--cso-accent-hover); }
                #btn-clear { width: 100%; background: transparent; border: 1px solid var(--cso-danger); color: var(--cso-danger); }
                #btn-clear:hover { background: rgba(209, 105, 105, 0.1); }
            </style>
        </head>
        <body>
            <h4>⚙️ Code Editor</h4>
            <label>/* Loaded_Theme.css (Read Only) */</label>
            <textarea id="theme-area" readonly spellcheck="false">${themeSource.replace(/</g, '&lt;')}</textarea>
            <label>/* Live_Overrides.css */</label>
            <textarea id="css-area" spellcheck="false">${customCSS.replace(/</g, '&lt;')}</textarea>
            <label>// Live_Overrides.js</label>
            <textarea id="js-area" spellcheck="false">${customJS.replace(/</g, '&lt;')}</textarea>
            
            <div class="btn-row">
                <button id="btn-save">► Deploy Live</button>
                <button id="btn-import">⇡ Import</button>
                <button id="btn-export">⇣ Export</button>
            </div>
            <button id="btn-clear">⊘ Wipe Overrides</button>
            <input type="file" id="file-import" accept=".css" style="display: none;">
        </body>
        </html>
    `);
    win.document.close();

    const doc = win.document;

    doc.getElementById('btn-import').addEventListener('click', () => doc.getElementById('file-import').click());
    doc.getElementById('file-import').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const cssArea = doc.getElementById('css-area');
            let currentContent = cssArea.value.trim();
            if (currentContent) currentContent += '\n\n';
            cssArea.value = currentContent + `/* --- Imported: ${file.name} --- */\n` + event.target.result;
            e.target.value = '';
            doc.getElementById('btn-save').click();
        };
        reader.readAsText(file);
    });

    doc.getElementById('btn-save').addEventListener('click', () => {
        const newCSS = doc.getElementById('css-area').value;
        GM.set('cssokoun_custom_css', newCSS);
        GM.set('cssokoun_custom_js', doc.getElementById('js-area').value);
        
        let liveStyleNode = document.getElementById('cssokoun-live-styles');
        if (!liveStyleNode) {
            liveStyleNode = document.createElement('style');
            liveStyleNode.id = 'cssokoun-live-styles';
            document.head.appendChild(liveStyleNode);
        }
        liveStyleNode.textContent = newCSS;
        
        const btn = doc.getElementById('btn-save');
        btn.innerHTML = "✓ Deployed"; setTimeout(() => btn.innerHTML = "► Deploy Live", 1500);
    });

    doc.getElementById('btn-export').addEventListener('click', () => {
        const cssContent = doc.getElementById('css-area').value;
        if (!cssContent.trim()) return;
        const url = URL.createObjectURL(new Blob([cssContent], { type: 'text/css' }));
        const a = document.createElement('a'); a.href = url;
        a.download = `cssokoun_custom_${new Date().toISOString().slice(0,10).replace(/-/g,"")}.css`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    });

    doc.getElementById('btn-clear').addEventListener('click', () => {
        if(win.confirm("Wipe all custom overrides?")) {
            doc.getElementById('css-area').value = ''; doc.getElementById('js-area').value = '';
            doc.getElementById('btn-save').click();
        }
    });

    doc.querySelectorAll('textarea').forEach(el => {
        el.addEventListener('keydown', function(e) {
            if (e.key == 'Tab') {
                e.preventDefault();
                var start = this.selectionStart, end = this.selectionEnd;
                this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
    });
};