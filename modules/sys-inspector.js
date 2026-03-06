const log = (level, ...args) => window.cssokoun.log(level, 'sys-inspector', ...args);
log('INFO', 'Loading Bulletproof Native Inspector...');

window.cssokoun.inspectorWindow = null;
let inspectorActive = false;
let currentTarget = null;
let tweakHistory = [];

const initialCSS = GM.get('cssokoun_custom_css', '');
if (initialCSS.trim() !== '') tweakHistory.push(initialCSS);

let liveStyleNode = document.getElementById('cssokoun-live-styles');
if (!liveStyleNode) {
    liveStyleNode = document.createElement('style');
    liveStyleNode.id = 'cssokoun-live-styles';
    document.head.appendChild(liveStyleNode);
}

const highlightBox = document.createElement('div');
highlightBox.style.cssText = 'position: fixed; pointer-events: none; border: 2px dashed #007acc; background: rgba(0, 122, 204, 0.15); z-index: 999998; display: none; transition: top 0.05s, left 0.05s, width 0.05s, height 0.05s;';
document.body.appendChild(highlightBox);

function getCSSSelector(el) {
    if (el.id) return `#${el.id}`;
    let path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE && el.tagName.toLowerCase() !== 'body') {
        let selector = el.tagName.toLowerCase();
        if (el.className && typeof el.className === 'string') {
            const classes = el.className.trim().split(/\s+/).filter(c => !c.includes('cssokoun'));
            if(classes.length > 0) selector += `.${classes[0]}`;
        }
        path.unshift(selector);
        el = el.parentNode;
        if(path.length >= 3) break; 
    }
    return path.join(' > ');
}

document.addEventListener('mousemove', (e) => {
    if (!inspectorActive) return;
    const rect = e.target.getBoundingClientRect();
    highlightBox.style.display = 'block';
    highlightBox.style.top = rect.top + 'px';
    highlightBox.style.left = rect.left + 'px';
    highlightBox.style.width = rect.width + 'px';
    highlightBox.style.height = rect.height + 'px';
});

document.addEventListener('click', (e) => {
    if (!inspectorActive) return;
    e.preventDefault(); e.stopPropagation();
    
    currentTarget = e.target;
    
    if (window.cssokoun.inspectorWindow && !window.cssokoun.inspectorWindow.closed) {
        const doc = window.cssokoun.inspectorWindow.document;
        doc.getElementById('tweak-target').innerText = getCSSSelector(currentTarget);
        const computed = window.getComputedStyle(currentTarget);
        doc.getElementById('tweak-size').value = parseInt(computed.fontSize);
        doc.getElementById('tweak-opacity').value = computed.opacity;
        
        const targetBox = doc.getElementById('tweak-target');
        targetBox.style.borderColor = '#007acc';
        targetBox.style.color = '#fff';
        setTimeout(() => { targetBox.style.borderColor = '#454545'; targetBox.style.color = '#9cdcfe'; }, 300);
    }
}, { capture: true });

window.cssokoun.launchInspector = function() {
    if (window.cssokoun.inspectorWindow && !window.cssokoun.inspectorWindow.closed) {
        window.cssokoun.inspectorWindow.focus();
        return;
    }

    inspectorActive = false;
    highlightBox.style.display = 'none';

    const win = window.open('', '_blank', 'width=380,height=550,menubar=no,toolbar=no,location=no,status=no');
    window.cssokoun.inspectorWindow = win;
    
    win.document.open(); // Flush document stream
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>cssokoun Inspector</title>
            <style>
                :root {
                    --cso-bg-base: #1e1e1e; --cso-bg-input: #3c3c3c; --cso-border: #454545;
                    --cso-text-main: #cccccc; --cso-text-bright: #ffffff; --cso-text-muted: #888888;
                    --cso-accent: #007acc; --cso-accent-hover: #0098ff; --cso-danger: #d16969; --cso-success: #6A9955;
                    --cso-font-sans: 'Segoe UI', system-ui, sans-serif; --cso-font-mono: Consolas, monospace;
                }
                body { background: var(--cso-bg-base); color: var(--cso-text-main); font-family: var(--cso-font-sans); margin: 0; padding: 20px; box-sizing: border-box; }
                h4 { margin: 0 0 15px 0; color: var(--cso-text-bright); font-size: 16px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid var(--cso-border); padding-bottom: 10px; }
                
                #tweak-toggle { width: 100%; border: 2px solid var(--cso-border); background: transparent; color: var(--cso-text-muted); padding: 12px; cursor: pointer; border-radius: 6px; font-weight: bold; font-size: 14px; margin-bottom: 20px; transition: all 0.2s; }
                #tweak-toggle.active { border-color: var(--cso-accent); background: var(--cso-accent); color: #fff; box-shadow: 0 0 15px rgba(0, 122, 204, 0.4); }

                #tweak-target { font-family: var(--cso-font-mono); font-size: 12px; color: #9cdcfe; background: var(--cso-bg-input); padding: 10px; margin-bottom: 15px; border: 1px solid var(--cso-border); border-radius: 4px; word-break: break-all; transition: border-color 0.2s, color 0.2s; min-height: 18px; }
                
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
                label { font-size: 11px; color: var(--cso-text-muted); font-weight: bold; margin-bottom:6px; display:block; }
                input { width: 100%; height: 32px; padding: 6px; background: var(--cso-bg-input); color: var(--cso-text-bright); border: 1px solid var(--cso-border); border-radius: 4px; font-size: 13px; outline: none; box-sizing: border-box; }
                input[type="color"] { padding: 2px; cursor: pointer; }
                
                button { border: none; padding: 12px; cursor: pointer; border-radius: 4px; font-weight: 600; font-size: 13px; color: #fff; transition: background 0.2s; font-family: var(--cso-font-sans); }
                #tweak-hide { width: 100%; background: transparent; color: var(--cso-danger); border: 1px solid var(--cso-danger); margin-bottom: 15px; } #tweak-hide:hover { background: rgba(209, 105, 105, 0.1); }
                #tweak-apply { width: 100%; background: var(--cso-accent); font-size: 14px; margin-bottom: 15px; } #tweak-apply:hover { background: var(--cso-accent-hover); }
                
                .btn-row { display: flex; gap: 10px; border-top: 1px solid var(--cso-border); padding-top: 15px; }
                .btn-row button { flex: 1; background: var(--cso-bg-input); color: var(--cso-text-main); border: 1px solid var(--cso-border); }
                .btn-row button:hover { background: #4a4a4a; }
            </style>
        </head>
        <body>
            <h4>🔍 Visual Inspector</h4>
            
            <button id="tweak-toggle">🖱️ Selection Mode: OFF</button>

            <div id="tweak-target">No element selected...</div>
            
            <button id="tweak-hide">🚫 Hide Element (display: none)</button>
            
            <div class="grid">
                <div><label>Text Color</label><input type="color" id="tweak-color"></div>
                <div><label>Background</label><input type="color" id="tweak-bg"></div>
            </div>
            <div class="grid">
                <div><label>Font Size (px)</label><input type="number" id="tweak-size"></div>
                <div><label>Opacity (0-1)</label><input type="number" id="tweak-opacity" step="0.1" min="0" max="1"></div>
            </div>
            
            <button id="tweak-apply">► Inject Tweak</button>
            
            <div class="btn-row">
                <button id="tweak-undo">↩️ Undo</button>
                <button id="tweak-compare">👁️ Hold to Compare</button>
            </div>
        </body>
        </html>
    `);
    win.document.close();

    const doc = win.document;

    const toggleBtn = doc.getElementById('tweak-toggle');
    toggleBtn.addEventListener('click', () => {
        inspectorActive = !inspectorActive;
        if (inspectorActive) {
            toggleBtn.className = 'active';
            toggleBtn.innerText = '🎯 Selection Mode: ON';
        } else {
            toggleBtn.className = '';
            toggleBtn.innerText = '🖱️ Selection Mode: OFF';
            highlightBox.style.display = 'none';
        }
    });

    doc.getElementById('tweak-hide').addEventListener('click', () => applyTweak(`display: none !important; visibility: hidden !important;`));

    doc.getElementById('tweak-apply').addEventListener('click', () => {
        let cssBody = '';
        const color = doc.getElementById('tweak-color').value; const bg = doc.getElementById('tweak-bg').value; const size = doc.getElementById('tweak-size').value; const opacity = doc.getElementById('tweak-opacity').value;
        if (color !== '#000000') cssBody += `color: ${color} !important; `;
        if (bg !== '#000000') cssBody += `background-color: ${bg} !important; `;
        if (size) cssBody += `font-size: ${size}px !important; `;
        if (opacity && opacity !== '1') cssBody += `opacity: ${opacity} !important; `;
        applyTweak(cssBody);
    });

    function applyTweak(cssRules) {
        if (!cssRules) return;
        const targetEl = doc.getElementById('tweak-target');
        if (targetEl.innerText === 'No element selected...') return;
        
        const block = `\n/* Tweak: ${targetEl.innerText} */\n${targetEl.innerText} { ${cssRules} }\n`;
        let currentCSS = GM.get('cssokoun_custom_css', '');
        let newCSS = currentCSS + block;
        
        tweakHistory.push(newCSS); GM.set('cssokoun_custom_css', newCSS);
        liveStyleNode.textContent = newCSS; 
        
        if (window.cssokoun.editorWindow && !window.cssokoun.editorWindow.closed) {
            const area = window.cssokoun.editorWindow.document.getElementById('css-area');
            if (area) area.value = newCSS;
        }
    }

    doc.getElementById('tweak-undo').addEventListener('click', () => {
        if (tweakHistory.length <= 1) return;
        tweakHistory.pop(); 
        const previousCSS = tweakHistory[tweakHistory.length - 1] || '';
        GM.set('cssokoun_custom_css', previousCSS); liveStyleNode.textContent = previousCSS;
        if (window.cssokoun.editorWindow && !window.cssokoun.editorWindow.closed) {
            const area = window.cssokoun.editorWindow.document.getElementById('css-area');
            if (area) area.value = previousCSS;
        }
    });

    const compareBtn = doc.getElementById('tweak-compare');
    compareBtn.addEventListener('mousedown', () => {
        document.querySelectorAll('link[href*="cssokoun"], style').forEach(el => {
            if (el.innerHTML.includes('/* Tweak') || el.href?.includes('cssokoun') || el.innerHTML.includes('/* Visual Tweak')) {
                el.dataset.compareDisabled = "true"; el.disabled = true;
            }
        });
        compareBtn.style.background = 'var(--cso-accent)'; compareBtn.style.color = '#fff'; compareBtn.style.borderColor = 'var(--cso-accent)';
    });

    const restoreStyles = () => {
        document.querySelectorAll('[data-compare-disabled="true"]').forEach(el => { el.disabled = false; delete el.dataset.compareDisabled; });
        compareBtn.style.background = 'var(--cso-bg-input)'; compareBtn.style.color = 'var(--cso-text-main)'; compareBtn.style.borderColor = 'var(--cso-border)';
    };
    compareBtn.addEventListener('mouseup', restoreStyles); compareBtn.addEventListener('mouseleave', restoreStyles); 
};