const log = (level, ...args) => window.cssokoun.log(level, 'sys-inspector', ...args);
log('INFO', 'Loading Upgraded Desktop Visual Inspector...');

let inspectorActive = false;
let currentTarget = null;
let tweakHistory = [];

function initInspector() {
    const inspectBtn = document.getElementById('cssokoun-inspect');
    const panel = document.getElementById('cssokoun-ui-panel');
    if (!inspectBtn || !panel) return false;

    const isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    const isMobileUA = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isTouchDevice || isMobileUA) {
        inspectBtn.style.display = 'none';
        log('INFO', 'Mobile environment detected. Inspector UI disabled.');
        return true; 
    }

    const initialCSS = GM.get('cssokoun_custom_css', '');
    if (initialCSS.trim() !== '') tweakHistory.push(initialCSS);

    let liveStyleNode = document.getElementById('cssokoun-live-styles');
    if (!liveStyleNode) {
        liveStyleNode = document.createElement('style');
        liveStyleNode.id = 'cssokoun-live-styles';
        document.head.appendChild(liveStyleNode);
    }

    const highlightBox = document.createElement('div');
    highlightBox.style.cssText = 'position: fixed; pointer-events: none; border: 2px dashed #0ff; background: rgba(0, 255, 255, 0.15); z-index: 999998; display: none; transition: top 0.05s, left 0.05s, width 0.05s, height 0.05s;';
    document.body.appendChild(highlightBox);

    const tweakMenu = document.createElement('div');
    tweakMenu.id = 'cssokoun-tweak-menu';
    tweakMenu.style.cssText = `
        position: fixed; top: 20px; left: 20px; width: 320px;
        background: #1e1e1e; color: #eee; border: 1px solid #444; border-top: 3px solid #0ff;
        z-index: 999999; display: none; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8); border-radius: 4px; overflow: hidden;
    `;
    
    tweakMenu.innerHTML = `
        <div id="tweak-header" style="display: flex; justify-content: space-between; align-items: center; background: #222; padding: 10px 15px; cursor: grab; border-bottom: 1px solid #333;">
            <h4 style="margin: 0; font-size: 14px; color: #0ff; pointer-events: none;">Visual Palette</h4>
            <span id="tweak-close" style="cursor: pointer; font-weight: bold; color: #888;">&times;</span>
        </div>
        <div style="padding: 15px;">
            <div id="tweak-target" style="font-family: Consolas, monospace; font-size: 11px; color: #aaa; background: #111; padding: 6px; margin-bottom: 12px; border: 1px solid #333; word-break: break-all;"></div>
            <button id="tweak-hide" style="width: 100%; background: #5a1a1a; color: #ffaaaa; border: 1px solid #800; padding: 8px; margin-bottom: 12px; cursor: pointer; border-radius: 3px; font-size: 12px;">🚫 Hide Element (display: none)</button>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div><label style="font-size: 11px; color: #888;">Text Color</label><input type="color" id="tweak-color" style="width: 100%; height: 28px; cursor: pointer; background: #222; border: 1px solid #444;"></div>
                <div><label style="font-size: 11px; color: #888;">Background</label><input type="color" id="tweak-bg" style="width: 100%; height: 28px; cursor: pointer; background: #222; border: 1px solid #444;"></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div><label style="font-size: 11px; color: #888;">Font Size (px)</label><input type="number" id="tweak-size" style="width: 100%; padding: 5px; background: #222; color: #fff; border: 1px solid #444; box-sizing: border-box; font-size: 12px;"></div>
                <div><label style="font-size: 11px; color: #888;">Opacity (0-1)</label><input type="number" id="tweak-opacity" step="0.1" min="0" max="1" style="width: 100%; padding: 5px; background: #222; color: #fff; border: 1px solid #444; box-sizing: border-box; font-size: 12px;"></div>
            </div>
            <button id="tweak-apply" style="width: 100%; background: #0078D7; color: #fff; border: none; padding: 10px; cursor: pointer; border-radius: 3px; font-weight: bold; font-size: 13px; margin-bottom: 10px;">Inject Tweak</button>
            <div style="display: flex; gap: 10px; border-top: 1px solid #333; padding-top: 10px;">
                <button id="tweak-undo" style="flex: 1; background: #333; color: #fff; border: 1px solid #555; padding: 6px; cursor: pointer; border-radius: 3px; font-size: 11px;">↩️ Undo Last</button>
                <button id="tweak-compare" style="flex: 1; background: #333; color: #fff; border: 1px solid #555; padding: 6px; cursor: pointer; border-radius: 3px; font-size: 11px;">👁️ Hold to Compare</button>
            </div>
        </div>
    `;
    document.body.appendChild(tweakMenu);

    const header = document.getElementById('tweak-header');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true; startX = e.clientX; startY = e.clientY;
        initialX = tweakMenu.offsetLeft; initialY = tweakMenu.offsetTop;
        header.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        tweakMenu.style.left = (initialX + e.clientX - startX) + 'px';
        tweakMenu.style.top = (initialY + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => { isDragging = false; header.style.cursor = 'grab'; });

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

    inspectBtn.addEventListener('click', () => {
        inspectorActive = true; panel.classList.remove('active'); 
        log('INFO', 'Inspector Mode Active.');
        document.body.style.cursor = 'crosshair';
    });

    document.addEventListener('mousemove', (e) => {
        if (!inspectorActive) return;
        if (e.target.closest('#cssokoun-ui-panel') || e.target.closest('#cssokoun-tweak-menu')) return;
        const rect = e.target.getBoundingClientRect();
        highlightBox.style.display = 'block'; highlightBox.style.top = rect.top + 'px'; highlightBox.style.left = rect.left + 'px'; highlightBox.style.width = rect.width + 'px'; highlightBox.style.height = rect.height + 'px';
    });

    document.addEventListener('click', (e) => {
        if (!inspectorActive) return;
        if (e.target.closest('#cssokoun-ui-panel') || e.target.closest('#cssokoun-tweak-menu')) return;
        e.preventDefault(); e.stopPropagation();

        currentTarget = e.target;
        document.getElementById('tweak-target').innerText = getCSSSelector(currentTarget);
        const computed = window.getComputedStyle(currentTarget);
        document.getElementById('tweak-size').value = parseInt(computed.fontSize);
        document.getElementById('tweak-opacity').value = computed.opacity;

        highlightBox.style.display = 'none'; inspectorActive = false; document.body.style.cursor = 'default';
        tweakMenu.style.display = 'block';

        if (!tweakMenu.style.left) {
            tweakMenu.style.top = Math.min(e.clientY + 20, window.innerHeight - 320) + 'px';
            tweakMenu.style.left = Math.min(e.clientX + 20, window.innerWidth - 340) + 'px';
        }
    }, { capture: true });

    document.getElementById('tweak-close').addEventListener('click', () => tweakMenu.style.display = 'none');
    document.getElementById('tweak-hide').addEventListener('click', () => applyTweak(`display: none !important; visibility: hidden !important;`));

    document.getElementById('tweak-apply').addEventListener('click', () => {
        let cssBody = '';
        const color = document.getElementById('tweak-color').value; const bg = document.getElementById('tweak-bg').value; const size = document.getElementById('tweak-size').value; const opacity = document.getElementById('tweak-opacity').value;
        if (color !== '#000000') cssBody += `color: ${color} !important; `;
        if (bg !== '#000000') cssBody += `background-color: ${bg} !important; `;
        if (size) cssBody += `font-size: ${size}px !important; `;
        if (opacity && opacity !== '1') cssBody += `opacity: ${opacity} !important; `;
        applyTweak(cssBody);
    });

    function applyTweak(cssRules) {
        if (!cssRules) return;
        const selector = document.getElementById('tweak-target').innerText;
        const block = `\n/* Tweak: ${selector} */\n${selector} { ${cssRules} }\n`;
        let currentCSS = GM.get('cssokoun_custom_css', '');
        let newCSS = currentCSS + block;
        
        tweakHistory.push(newCSS); GM.set('cssokoun_custom_css', newCSS);
        liveStyleNode.textContent = newCSS; syncEditor(newCSS);
        log('INFO', 'Applied & saved:', selector);
    }

    document.getElementById('tweak-undo').addEventListener('click', () => {
        if (tweakHistory.length <= 1) return log('WARN', 'Nothing left to undo.');
        tweakHistory.pop(); 
        const previousCSS = tweakHistory[tweakHistory.length - 1] || '';
        GM.set('cssokoun_custom_css', previousCSS); liveStyleNode.textContent = previousCSS; syncEditor(previousCSS);
    });

    const compareBtn = document.getElementById('tweak-compare');
    compareBtn.addEventListener('mousedown', () => {
        document.querySelectorAll('link[href*="cssokoun"], style').forEach(el => {
            if (el.innerHTML.includes('/* Tweak') || el.href?.includes('cssokoun') || el.innerHTML.includes('/* Visual Tweak')) {
                el.dataset.compareDisabled = "true"; el.disabled = true;
            }
        });
        compareBtn.style.background = '#0078D7'; compareBtn.innerText = '👁️ Vanilla View Active';
    });

    const restoreStyles = () => {
        document.querySelectorAll('[data-compare-disabled="true"]').forEach(el => { el.disabled = false; delete el.dataset.compareDisabled; });
        compareBtn.style.background = '#333'; compareBtn.innerText = '👁️ Hold to Compare';
    };
    compareBtn.addEventListener('mouseup', restoreStyles); compareBtn.addEventListener('mouseleave', restoreStyles); 

    function syncEditor(css) { const editorArea = document.getElementById('cssokoun-edit-css'); if (editorArea) editorArea.value = css; }

    return true;
}

const inspInterval = setInterval(() => { if (initInspector()) clearInterval(inspInterval); }, 100);