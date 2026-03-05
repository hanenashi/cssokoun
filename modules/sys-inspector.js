const log = (level, ...args) => cssokoun.log(level, 'sys-inspector', ...args);
log('INFO', 'Loading Visual Inspector module...');

let inspectorActive = false;
let currentTarget = null;

function initInspector() {
    const inspectBtn = document.getElementById('cssokoun-inspect');
    const panel = document.getElementById('cssokoun-ui-panel'); // from sys-ui responsive update
    if (!inspectBtn || !panel) return false;

    // Build the Mobile Tweak Menu (Hidden initially)
    const tweakMenu = document.createElement('div');
    tweakMenu.id = 'cssokoun-tweak-menu';
    tweakMenu.style.cssText = `
        position: fixed; bottom: -100%; left: 0; width: 100%; padding: 20px;
        background: #1a1a1a; color: #fff; border-top: 2px solid #0ff; z-index: 999999; 
        font-family: sans-serif; box-sizing: border-box; transition: bottom 0.2s ease-out;
        border-radius: 15px 15px 0 0; box-shadow: 0 -5px 20px rgba(0,0,0,0.9);
    `;
    
tweakMenu.innerHTML = `
        <h4 id="tweak-target" style="margin: 0 0 15px 0; color: #0ff; font-family: monospace; word-break: break-all;">Target</h4>
        <button id="tweak-hide" style="width: 100%; background: #500; color: #fff; border: 1px solid #f00; padding: 12px; margin-bottom: 15px; border-radius: 6px; font-weight: bold; cursor: pointer;">🚫 Hide Element</button>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <div style="flex: 1;"><label style="font-size: 12px;">Text Color</label><input type="color" id="tweak-color" style="width: 100%; height: 40px; cursor: pointer;"></div>
            <div style="flex: 1;"><label style="font-size: 12px;">BG Color</label><input type="color" id="tweak-bg" style="width: 100%; height: 40px; cursor: pointer;"></div>
        </div>
        <label style="font-size: 12px;">Font Size (px)</label>
        <input type="number" id="tweak-size" style="width: 100%; padding: 10px; margin-bottom: 15px; background: #333; color: #fff; border: 1px solid #555; border-radius: 6px; box-sizing: border-box;">
        <div style="display: flex; gap: 10px;">
            <button id="tweak-apply" style="flex: 2; background: #050; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">Apply & Save</button>
            <button id="tweak-cancel" style="flex: 1; background: #444; color: #fff; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">Cancel</button>
        </div>
    `;
    document.body.appendChild(tweakMenu);

    // Smart Selector logic based on Okoun structure
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
            if(path.length >= 2) break; // keep it short
        }
        return path.join(' > ');
    }

    // Activate Inspector
    inspectBtn.addEventListener('click', () => {
        inspectorActive = true;
        panel.classList.remove('active'); // Hide main panel
        log('INFO', 'Inspector Mode Active. Tap an element.');
        // Add a temporary overlay border to body to show it's active
        document.body.style.border = '3px solid #0ff';
    });

    // Handle Tap on Okoun
    document.addEventListener('click', (e) => {
        if (!inspectorActive) return;
        if (e.target.closest('#cssokoun-tweak-menu') || e.target.closest('#cssokoun-ui-panel')) return;

        e.preventDefault();
        e.stopPropagation();

        currentTarget = e.target;
        const selector = getCSSSelector(currentTarget);
        document.getElementById('tweak-target').innerText = selector;
        
        // Grab current computed styles
        const computed = window.getComputedStyle(currentTarget);
        document.getElementById('tweak-size').value = parseInt(computed.fontSize);

        // Show bottom menu
        tweakMenu.style.bottom = '0';
        inspectorActive = false;
        document.body.style.border = '';
    }, { capture: true });

    // Handle Hide
    document.getElementById('tweak-hide').addEventListener('click', () => {
        applyTweak(`display: none !important; visibility: hidden !important;`);
    });

    // Handle Apply
    document.getElementById('tweak-apply').addEventListener('click', () => {
        let cssBody = '';
        const color = document.getElementById('tweak-color').value;
        const bg = document.getElementById('tweak-bg').value;
        const size = document.getElementById('tweak-size').value;

        if (color !== '#000000') cssBody += `color: ${color} !important; `;
        if (bg !== '#000000') cssBody += `background-color: ${bg} !important; `;
        if (size) cssBody += `font-size: ${size}px !important; `;
        
        applyTweak(cssBody);
    });

    // Handle Cancel
    document.getElementById('tweak-cancel').addEventListener('click', () => {
        tweakMenu.style.bottom = '-100%';
    });

    function applyTweak(cssRules) {
        if (!cssRules) return;
        const selector = document.getElementById('tweak-target').innerText;
        const block = `\n/* Visual Tweak */\n${selector} { ${cssRules} }\n`;
        
        let customCSS = GM.get('cssokoun_custom_css', '');
        customCSS += block;
        GM.set('cssokoun_custom_css', customCSS);
        GM.addStyle(block);
        
        // Update editor text area if it exists
        const editorArea = document.getElementById('cssokoun-edit-css');
        if (editorArea) editorArea.value = customCSS;

        tweakMenu.style.bottom = '-100%';
        log('INFO', 'Tweak applied and saved:', selector);
    }

    return true;
}

const inspInterval = setInterval(() => {
    if (initInspector()) clearInterval(inspInterval);
}, 100);
