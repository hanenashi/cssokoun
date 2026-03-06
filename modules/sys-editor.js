const log = (level, ...args) => cssokoun.log(level, 'sys-editor', ...args);
log('INFO', 'Loading Native Window Live Editor module...');

// Store the window reference globally so other modules can find it
window.cssokoun.editorWindow = null;

function injectEditor() {
    const hook = document.getElementById('cssokoun-editor-hook');
    if (!hook) return false; 

    const openBtn = document.createElement('button');
    openBtn.className = 'cssokoun-btn';
    openBtn.style.cssText = 'background: #800080; margin-bottom: 10px; width: 100%;';
    openBtn.innerHTML = '🪟 Open Editor in New Window';
    hook.appendChild(openBtn);

    openBtn.addEventListener('click', () => {
        // If it's already open, just bring it to the front
        if (window.cssokoun.editorWindow && !window.cssokoun.editorWindow.closed) {
            window.cssokoun.editorWindow.focus();
            return;
        }

        const customCSS = GM.get('cssokoun_custom_css', '');
        const customJS = GM.get('cssokoun_custom_js', '');

        // Open a blank native popup window
        const win = window.open('', 'cssokounEditor', 'width=600,height=700,menubar=no,toolbar=no,location=no,status=no');
        window.cssokoun.editorWindow = win;

        // Build the HTML strictly inside the new window
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>cssokoun Live Editor</title>
                <style>
                    body { background: #1e1e1e; color: #eee; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; box-sizing: border-box; }
                    h4 { margin: 0 0 15px 0; color: #d8b4e2; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 10px; }
                    label { font-size: 12px; color: #aaa; margin-bottom: 5px; display: block; font-weight: bold; }
                    textarea { width: 100%; background: #111; font-family: Consolas, monospace; font-size: 13px; border: 1px solid #444; padding: 10px; margin-bottom: 20px; box-sizing: border-box; border-radius: 4px; resize: vertical; line-height: 1.4; outline: none; }
                    #css-area { height: 350px; color: #0f0; }
                    #js-area { height: 120px; color: #ff0; }
                    .btn-row { display: flex; gap: 10px; margin-bottom: 10px; }
                    button { border: none; padding: 12px; cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 14px; color: #fff; transition: opacity 0.2s; }
                    button:hover { opacity: 0.8; }
                    #btn-save { flex: 2; background: #050; }
                    #btn-export { flex: 1; background: #0078D7; }
                    #btn-clear { width: 100%; background: #500; font-size: 13px; padding: 10px; }
                </style>
            </head>
            <body>
                <h4>📝 Live CSS/JS Editor</h4>
                <label>CSS Overrides (Live):</label>
                <textarea id="css-area" spellcheck="false">${customCSS.replace(/</g, '&lt;')}</textarea>
                
                <label>JS Overrides (Requires Reload):</label>
                <textarea id="js-area" spellcheck="false">${customJS.replace(/</g, '&lt;')}</textarea>
                
                <div class="btn-row">
                    <button id="btn-save">💾 Save & Apply Live</button>
                    <button id="btn-export">⬇️ Export .css</button>
                </div>
                <button id="btn-clear">🗑️ Clear All Overrides</button>
            </body>
            </html>
        `);
        win.document.close();

        // --- Attach Event Listeners to the New Window ---
        const doc = win.document;

        doc.getElementById('btn-save').addEventListener('click', () => {
            const newCSS = doc.getElementById('css-area').value;
            const newJS = doc.getElementById('js-area').value;
            
            GM.set('cssokoun_custom_css', newCSS);
            GM.set('cssokoun_custom_js', newJS);
            
            // Push CSS to the PARENT page immediately
            let liveStyleNode = document.getElementById('cssokoun-live-styles');
            if (!liveStyleNode) {
                liveStyleNode = document.createElement('style');
                liveStyleNode.id = 'cssokoun-live-styles';
                document.head.appendChild(liveStyleNode);
            }
            liveStyleNode.textContent = newCSS;
            log('INFO', 'Custom CSS/JS Saved from Native Window.');
            
            // Give a little visual flash to show it saved
            const saveBtn = doc.getElementById('btn-save');
            saveBtn.innerText = "✅ Saved!";
            setTimeout(() => saveBtn.innerText = "💾 Save & Apply Live", 1500);
        });

        doc.getElementById('btn-export').addEventListener('click', () => {
            const cssContent = doc.getElementById('css-area').value;
            if (!cssContent.trim()) return win.alert('There is no CSS to export!');
            
            const blob = new Blob([cssContent], { type: 'text/css' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); // Created in parent doc to ensure download triggers
            a.href = url;
            const timestamp = new Date().toISOString().slice(0,10).replace(/-/g,"");
            a.download = `cssokoun_custom_${timestamp}.css`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        doc.getElementById('btn-clear').addEventListener('click', () => {
            if(win.confirm("Wipe all custom overrides? This cannot be undone.")) {
                doc.getElementById('css-area').value = '';
                doc.getElementById('js-area').value = '';
                doc.getElementById('btn-save').click();
            }
        });

        // Tab to indent
        doc.querySelectorAll('textarea').forEach(el => {
            el.addEventListener('keydown', function(e) {
                if (e.key == 'Tab') {
                    e.preventDefault();
                    var start = this.selectionStart;
                    var end = this.selectionEnd;
                    this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
                    this.selectionStart = this.selectionEnd = start + 4;
                }
            });
        });
    });

    return true;
}

const checkInterval = setInterval(() => { if (injectEditor()) clearInterval(checkInterval); }, 100);