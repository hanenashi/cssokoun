const log = (level, ...args) => cssokoun.log(level, 'sys-editor', ...args);
log('INFO', 'Loading Standalone Live Editor module...');

function injectEditor() {
    const hook = document.getElementById('cssokoun-editor-hook');
    if (!hook) return false; 

    log('SNIFF', 'UI Hook found, building Live Editor window.');
    
    // 1. Add Trigger Button to Main Hub
    const openBtn = document.createElement('button');
    openBtn.className = 'cssokoun-btn';
    openBtn.style.cssText = 'background: #800080; margin-bottom: 10px; width: 100%;';
    openBtn.innerHTML = '📝 Open Live Editor';
    hook.appendChild(openBtn);

    // 2. Build the Floating Editor Panel
    const customCSS = GM.get('cssokoun_custom_css', '');
    const customJS = GM.get('cssokoun_custom_js', '');

    const editorPanel = document.createElement('div');
    editorPanel.id = 'cssokoun-editor-panel';
    editorPanel.style.cssText = `
        position: fixed; top: 100px; left: 300px; width: 500px;
        background: #1e1e1e; color: #eee; border: 1px solid #444; border-top: 3px solid #800080;
        z-index: 999999; display: none; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 10px 40px rgba(0,0,0,0.9); border-radius: 4px; overflow: hidden;
    `;

    editorPanel.innerHTML = `
        <div id="editor-header" style="display: flex; justify-content: space-between; align-items: center; background: #222; padding: 10px 15px; cursor: grab; border-bottom: 1px solid #333;">
            <h4 style="margin: 0; font-size: 14px; color: #d8b4e2; pointer-events: none;">📝 Live CSS/JS Editor</h4>
            <span id="editor-close" style="cursor: pointer; font-weight: bold; color: #888; font-size: 18px;">&times;</span>
        </div>
        <div style="padding: 15px;">
            <label style="font-size: 12px; color: #aaa; margin-bottom: 5px; display: block;">CSS Overrides:</label>
            <textarea id="cssokoun-edit-css" spellcheck="false" style="width: 100%; height: 300px; background: #111; color: #0f0; font-family: Consolas, monospace; font-size: 13px; border: 1px solid #444; padding: 10px; margin-bottom: 15px; box-sizing: border-box; border-radius: 4px; resize: vertical; line-height: 1.4;"></textarea>
            
            <label style="font-size: 12px; color: #aaa; margin-bottom: 5px; display: block;">JS Overrides (Requires Reload):</label>
            <textarea id="cssokoun-edit-js" spellcheck="false" style="width: 100%; height: 100px; background: #111; color: #ff0; font-family: Consolas, monospace; font-size: 13px; border: 1px solid #444; padding: 10px; margin-bottom: 15px; box-sizing: border-box; border-radius: 4px; resize: vertical; line-height: 1.4;"></textarea>
            
            <div style="display: flex; gap: 10px;">
                <button id="editor-save" style="flex: 2; background: #050; color: #fff; border: none; padding: 10px; cursor: pointer; border-radius: 3px; font-weight: bold; font-size: 14px;">💾 Save & Apply Live</button>
                <button id="editor-clear" style="flex: 1; background: #500; color: #fff; border: none; padding: 10px; cursor: pointer; border-radius: 3px; font-size: 14px;">🗑️ Clear All</button>
            </div>
        </div>
    `;
    document.body.appendChild(editorPanel);

    // Pre-fill text areas
    document.getElementById('cssokoun-edit-css').value = customCSS;
    document.getElementById('cssokoun-edit-js').value = customJS;

    // 3. Drag Logic for Editor
    const header = document.getElementById('editor-header');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true; startX = e.clientX; startY = e.clientY;
        initialX = editorPanel.offsetLeft; initialY = editorPanel.offsetTop;
        header.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        editorPanel.style.left = (initialX + e.clientX - startX) + 'px';
        editorPanel.style.top = (initialY + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => { 
        if(isDragging) { isDragging = false; header.style.cursor = 'grab'; }
    });

    // 4. Button Handlers
    openBtn.addEventListener('click', () => {
        editorPanel.style.display = 'block';
        // Sync current values just in case the inspector modified them while this was closed
        document.getElementById('cssokoun-edit-css').value = GM.get('cssokoun_custom_css', '');
    });

    document.getElementById('editor-close').addEventListener('click', () => editorPanel.style.display = 'none');

    document.getElementById('editor-clear').addEventListener('click', () => {
        if(confirm("Wipe all custom overrides? This cannot be undone.")) {
            document.getElementById('cssokoun-edit-css').value = '';
            document.getElementById('cssokoun-edit-js').value = '';
            document.getElementById('editor-save').click();
        }
    });

    document.getElementById('editor-save').addEventListener('click', () => {
        const newCSS = document.getElementById('cssokoun-edit-css').value;
        const newJS = document.getElementById('cssokoun-edit-js').value;
        
        GM.set('cssokoun_custom_css', newCSS);
        GM.set('cssokoun_custom_js', newJS);
        
        // Push CSS to the page immediately without reloading
        let liveStyleNode = document.getElementById('cssokoun-live-styles');
        if (!liveStyleNode) {
            liveStyleNode = document.createElement('style');
            liveStyleNode.id = 'cssokoun-live-styles';
            document.head.appendChild(liveStyleNode);
        }
        liveStyleNode.textContent = newCSS;
        
        log('INFO', 'Custom CSS/JS Saved and Live Injected.');
    });

    // 5. Allow hitting [Tab] inside the textareas to format code
    document.querySelectorAll('#cssokoun-edit-css, #cssokoun-edit-js').forEach(el => {
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

    return true;
}

const checkInterval = setInterval(() => { if (injectEditor()) clearInterval(checkInterval); }, 100);