window.cssokoun = window.cssokoun || {};
window.cssokoun.state = {
    modules: GM.get('cssokoun_modules', {}),
    debug: GM.get('cssokoun_debug', true)
};

window.cssokoun._logBuffer = [];
window.cssokoun.log = function(level, moduleName, ...args) {
    window.cssokoun._logBuffer.push({ level, moduleName, args });
};
const coreLog = (level, ...args) => window.cssokoun.log(level, 'core', ...args);

coreLog('INFO', 'Core initialized. Smart Caching & Anti-FOUC active.');

// --- FIXED: Use documentElement (<html>) instead of <body> to prevent document-start crashes ---
(function injectRoutingClasses() {
    const root = document.documentElement; 
    const path = window.location.pathname.split('/').filter(Boolean);
    if (path.length === 0) root.classList.add('route-home');
    path.forEach((p, i) => root.classList.add('route-' + path.slice(0, i + 1).join('-').replace(/[^a-z0-9-]/gi, '')));
    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        for (const [key, val] of params) root.classList.add(`query-${key}-${val}`.replace(/[^a-z0-9-]/gi, ''));
    }
})();

const MANIFEST_URL = REPO + 'modules.json?v=' + Date.now();

GM.fetch({
    method: "GET",
    url: MANIFEST_URL,
    onload: function(res) {
        if (res.status === 200) {
            try {
                const manifest = JSON.parse(res.responseText);
                window.cssokoun.manifest = manifest;
                loadModules(manifest);
            } catch (e) { coreLog('ERROR', 'Manifest is invalid JSON.', e); }
        }
    }
});

function loadModules(manifest) {
    const cacheBuster = `?v=${Date.now()}`;
    let pendingThemes = 0;

    function uncloakPage() {
        setTimeout(() => {
            const cloak = document.getElementById('cssokoun-cloak');
            if (cloak) {
                cloak.textContent += `\nbody { opacity: 1 !important; filter: blur(0) !important; pointer-events: auto !important; }`;
                coreLog('INFO', 'Theme applied. Uncloaking page smoothly.');
                setTimeout(() => cloak.remove(), 300);
            }
        }, 30);
    }

    const injectCSS = (url, id) => {
        const cacheKey = `cso_cache_${id}`;
        const cachedCSS = GM.get(cacheKey, null);
        window.cssokoun.activeThemeCache = window.cssokoun.activeThemeCache || {};

        if (cachedCSS) {
            coreLog('INFO', `Injected CSS from local cache instantly: ${id}`);
            GM.addStyle(cachedCSS);
            window.cssokoun.activeThemeCache[id] = cachedCSS;
        } else {
            pendingThemes++;
        }

        GM.fetch({
            method: "GET",
            url: REPO + url + cacheBuster,
            onload: (res) => {
                if (res.status === 200) {
                    const freshCSS = res.responseText;
                    if (!cachedCSS) {
                        coreLog('INFO', `Injected fresh CSS from network: ${id}`);
                        GM.addStyle(freshCSS);
                        window.cssokoun.activeThemeCache[id] = freshCSS;
                        pendingThemes--;
                        if (pendingThemes === 0) uncloakPage();
                    }
                    if (freshCSS !== cachedCSS) {
                        GM.set(cacheKey, freshCSS);
                        coreLog('INFO', `Updated local cache for: ${id}`);
                        window.cssokoun.activeThemeCache[id] = freshCSS;
                    }
                } else {
                    if (!cachedCSS) { pendingThemes--; if (pendingThemes === 0) uncloakPage(); }
                }
            },
            onerror: () => {
                if (!cachedCSS) { pendingThemes--; if (pendingThemes === 0) uncloakPage(); }
            }
        });
    };

    const injectJS = (url, id) => {
        GM.fetch({
            method: "GET",
            url: REPO + url + cacheBuster,
            onload: (res) => {
                if (res.status === 200) {
                    try {
                        const modWrapper = new Function('GM', 'cssokoun', 'REPO', res.responseText);
                        modWrapper(GM, window.cssokoun, REPO);
                    } catch (e) { coreLog('ERROR', `Execution failed in: ${id}`, e); }
                }
            }
        });
    };

    manifest.system.forEach(mod => { if (mod.required || window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id); });
    if (manifest.tweaks) manifest.tweaks.forEach(mod => { if (window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id); });
    if (manifest.themes) manifest.themes.forEach(mod => { if (window.cssokoun.state.modules[mod.id]) injectCSS(mod.file, mod.id); });

    const customCSS = GM.get('cssokoun_custom_css', '');
    if (customCSS.trim().length > 0) {
        let liveStyleNode = document.createElement('style');
        liveStyleNode.id = 'cssokoun-live-styles';
        liveStyleNode.textContent = customCSS;
        // Safe injection at document-start
        (document.head || document.documentElement).appendChild(liveStyleNode);
    }

    if (pendingThemes === 0) uncloakPage();
}
