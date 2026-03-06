const log = (level, ...args) => cssokoun.log(level, 'sys-editor', ...args);
log('INFO', 'Loading Live Editor module...');

function injectEditor() {
    const saveBtn = document.getElementById('cssokoun-save');
    if (!saveBtn) return false; 

    log('SNIFF', 'UI found, injecting editor fields.');
    const customCSS = GM.get('cssokoun_custom_css', '');
    const customJS = GM.get('cssokoun_custom_js', '');

    const editorHTML = `
        <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
            <h4 style="margin-top:0; color:#aaa;">Custom Overrides</h4>
            <label style="font-size: 12px; color: #888;">CSS:</label>
            <textarea id="cssokoun-edit-css" style="width: 100%; height: 100px; background: #222; color: #0f0; font-family: monospace; border: 1px solid #444; padding: 8px; margin-bottom: 10px; box-sizing: border-box; border-radius: 4px;">${customCSS}</textarea>
            <label style="font-size: 12px; color: #888;">JS:</label>
            <textarea id="cssokoun-edit-js" style="width: 100%; height: 60px; background: #222; color: #ff0; font-family: monospace; border: 1px solid #444; padding: 8px; box-sizing: border-box; border-radius: 4px;">${customJS}</textarea>
        </div>
    `;

    saveBtn.insertAdjacentHTML('beforebegin', editorHTML);

    saveBtn.addEventListener('click', () => {
        GM.set('cssokoun_custom_css', document.getElementById('cssokoun-edit-css').value);
        GM.set('cssokoun_custom_js', document.getElementById('cssokoun-edit-js').value);
    });

    return true;
}

const checkInterval = setInterval(() => { if (injectEditor()) clearInterval(checkInterval); }, 100);