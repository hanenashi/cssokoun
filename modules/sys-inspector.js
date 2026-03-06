const log = (level, ...args) => window.cssokoun.log(level, 'sys-inspector', ...args);
log('INFO', 'Loading Professional Visual Inspector...');

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
    highlightBox.style.cssText = 'position: fixed; pointer-events: none; border: 2px dashed var(--cso-accent, #007acc); background: rgba(0, 122, 204, 0.15); z-index: 999998; display: none; transition: top 0.05s, left 0.05s, width 0.05s, height 0.05s;';
    document.body.appendChild(highlightBox);

    const tweakMenu = document.createElement('div');
    tweakMenu.id = 'cssokoun-tweak-menu';
    tweakMenu.style.cssText = `
        position: fixed; top: 20px; left: 20px; width: 320px;
        background: var(--cso-bg-base, #1e1e1e); color: var(--cso-text-main, #ccc); border: 1px solid var(--cso-border, #454545); border-top: 3px solid var(--cso-accent, #007acc);
        z-index: 999999; display: none; font-family: var(--cso-font-sans, sans-serif);
        box-shadow: var(--cso-shadow, 0 10px 30px rgba(0,0,0,0.8)); border-radius: var(--cso-radius, 6px); overflow: hidden;
    `;
    
    tweakMenu.innerHTML = `
        <div id="tweak-header" style="display: flex; justify-content: space-between; align-items: center; background: var(--cso-bg-panel, #252526); padding: 12px 16px; cursor: grab; border-bottom: 1px solid var(--cso-border, #454545);">
            <h4 style="margin: 0; font-size: 13px; color: var(--cso-text-bright, #fff); font-weight: 600; text-transform: uppercase; pointer-events: none;">Inspector</h4>
            <span id="tweak-close" style="cursor: pointer; font-weight: bold; color: var(--cso-text-muted, #888);">&times;</span>
        </div>
        <div style="padding: 16px;">
            <div id="tweak-target" style="font-family: var(--cso-font-mono, monospace); font-size: 11px; color: #9cdcfe; background: var(--cso-bg-input, #3c3c3c); padding: 8px; margin-bottom: 15px; border: 1px solid var(--cso-border, #454545); border-radius: 4px; word-break: break-all;"></div>
            
            <button id="tweak-hide" style="width: 100%; background: transparent; color: var(--cso-danger, #d16969); border: 1px solid var(--cso-danger, #d16969); padding: 8px; margin-bottom: 15px; cursor: pointer; border-radius: 4px; font-size: 12px; font-weight: 600; transition: background 0.2s;">🚫 Hide Element (display: none)</button>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div><label style="font-size: 11px; color: var(--cso-text-muted); font-weight: bold; margin-bottom:4px; display:block;">Text Color</label><input type="color" id="tweak-color" style="width: 100%; height: 28px; cursor: pointer; background: var(--cso-bg-input); border: 1px solid var(--cso-border); border-radius: 3px;"></div>
                <div><label style="font-size: 11px; color: var(--cso-text-muted); font-weight: bold; margin-bottom:4px; display:block;">Background</label><input type="color" id="tweak-bg" style="width: 100%; height: 28px; cursor: pointer; background: var(--cso-bg-input); border: 1px solid var(--cso-border); border-radius: 3px;"></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div><label style="font-size: 11px; color: var(--cso-text-muted); font-weight: bold; margin-bottom:4px; display:block;">Font Size (px)</label><input type="number" id="tweak-size" style="width: 100%; padding: 6px; background: var(--cso-bg-input); color: var(--cso-text-bright); border: 1px solid var(--cso-border); border-radius: 3px; font-size: 12px; outline: none;"></div>
                <div><label style="font-size: 11px; color: var(--cso-text-muted); font-weight: bold; margin-bottom:4px; display:block;">Opacity (0-1)</label><input type="number" id="tweak-opacity" step="0.1" min="0" max="1" style="width: 100%; padding: 6px; background: var(--cso-bg-input); color: var(--cso-text-bright); border: 1px solid var(--cso-border); border-radius: 3px; font-size: 12px; outline: none;"></div>
            </div>
            
            <button id="tweak-apply" style="width: 100%; background: var(--cso-accent, #007acc); color: #fff; border: none; padding: 10px; cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 13px; margin-bottom: 12px; transition: background 0.2s;">► Inject Tweak</button>
            
            <div style="display: flex; gap: 10px; border-top: 1px solid var(--cso-border, #454545); padding-top: 12px;">
                <button id="tweak-undo" style="flex: 1; background: var(--cso-bg-input); color: var(--cso-text-main); border: 1px solid var(--cso-border); padding: 6px; cursor: pointer; border-radius: 4px; font-size: 11px; transition: background 0.2s;">↩️ Undo</button>
                <button id="tweak-compare" style="flex: 1; background: var(--cso-bg-input); color: var(--cso-text-main); border: 1px solid var(--cso-border); padding: 6px; cursor: pointer; border-radius: 4px; font-size: 11px; transition: background 0.2s;">👁️ Compare</button>
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
            tweakMenu.style.top = Math.min(e.clientY + 20, window.innerHeight - 340) + 'px';
            tweakMenu.style.left = Math.min(e.clientX + 20, window.innerWidth - 340) + 'px';
        }
    }, { capture: true });

    document.getElementById('tweak-close').addEventListener('click', () => tweakMenu.style.display = 'none');
    
    document.getElementById('tweak-hide').addEventListener('mouseover', function() { this.style.background = 'rgba(209, 105, 105, 0.1)'; });
    document.getElementById('tweak-hide').addEventListener('mouseout', function() { this.style.background = 'transparent'; });
    document.getElementById('tweak-hide').addEventListener('click', () => applyTweak(`display: none !important; visibility: hidden !important;`));

    document.getElementById('tweak-apply').addEventListener('mouseover', function() { this.style.background = 'var(--cso-accent-hover)'; });
    document.getElementById('tweak-apply').addEventListener('mouseout', function() { this.style.background = 'var(--cso-accent)'; });
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

    document.getElementById('tweak-undo').addEventListener('mouseover', function() { this.style.background = '#4a4a4a'; });
    document.getElementById('tweak-undo').addEventListener('mouseout', function() { this.style.background = 'var(--cso-bg-input)'; });
    document.getElementById('tweak-undo').addEventListener('click', () => {
        if (tweakHistory.length <= 1) return log('WARN', 'Nothing left to undo.');
        tweakHistory.pop(); 
        const previousCSS = tweakHistory[tweakHistory.length - 1] || '';
        GM.set('cssokoun_custom_css', previousCSS); liveStyleNode.textContent = previousCSS; syncEditor(previousCSS);
    });

    const compareBtn = document.getElementById('tweak-compare');
    compareBtn.addEventListener('mouseover', function() { if(!this.disabled) this.style.background = '#4a4a4a'; });
    compareBtn.addEventListener('mouseout', function() { if(!this.disabled) this.style.background = 'var(--cso-bg-input)'; });
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

    function syncEditor(css) {
        if (window.cssokoun.editorWindow && !window.cssokoun.editorWindow.closed) {
            const area = window.cssokoun.editorWindow.document.getElementById('css-area');
            if (area) area.value = css;
        }
    }

    return true;
}

const inspInterval = setInterval(() => { if (initInspector()) clearInterval(inspInterval); }, 100);