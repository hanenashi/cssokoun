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

coreLog('INFO', 'Core initialized. Smart Caching active.');

(function injectRoutingClasses() {
    const path = window.location.pathname.split('/').filter(Boolean);
    if (path.length === 0) document.body.classList.add('route-home');
    path.forEach((p, i) => document.body.classList.add('route-' + path.slice(0, i + 1).join('-').replace(/[^a-z0-9-]/gi, '')));
    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        for (const [key, val] of params) document.body.classList.add(`query-${key}-${val}`.replace(/[^a-z0-9-]/gi, ''));
    }
})();

// Fetch Manifest (Always fresh to ensure we know what modules to load)
const MANIFEST_URL = REPO + 'modules.json?v=' + Date.now();
coreLog('SNIFF', `Fetching manifest from: ${MANIFEST_URL}`);

GM.fetch({
    method: "GET",
    url: MANIFEST_URL,
    onload: function(res) {
        if (res.status !== 200) return coreLog('ERROR', 'Manifest fetch failed.', res.status);
        try {
            const manifest = JSON.parse(res.responseText);
            window.cssokoun.manifest = manifest;
            coreLog('INFO', 'Manifest parsed successfully.');
            loadModules(manifest);
        } catch (e) {
            coreLog('ERROR', 'Manifest is invalid JSON.', e);
        }
    }
});

function loadModules(manifest) {
    const cacheBuster = `?v=${Date.now()}`;

    const injectCSS = (url, id) => {
        const cacheKey = `cso_cache_${id}`;
        const cachedCSS = GM.get(cacheKey, null);
        
        window.cssokoun.activeThemeCache = window.cssokoun.activeThemeCache || {};

        // 1. INSTANT INJECTION: If we have it in storage, inject it immediately!
        if (cachedCSS) {
            coreLog('INFO', `Injected CSS from local cache instantly: ${id}`);
            GM.addStyle(cachedCSS);
            window.cssokoun.activeThemeCache[id] = cachedCSS;
        }

        // 2. BACKGROUND FETCH: Check GitHub silently to update the cache for next time
        coreLog('SNIFF', `Verifying CSS with GitHub: ${id}`);
        GM.fetch({
            method: "GET",
            url: REPO + url + cacheBuster,
            onload: (res) => {
                if (res.status === 200) {
                    const freshCSS = res.responseText;
                    
                    // If the cache was empty, we need to inject it now
                    if (!cachedCSS) {
                        coreLog('INFO', `Injected fresh CSS from network: ${id}`);
                        GM.addStyle(freshCSS);
                        window.cssokoun.activeThemeCache[id] = freshCSS;
                    }
                    
                    // Save the fresh CSS to storage if it changed
                    if (freshCSS !== cachedCSS) {
                        GM.set(cacheKey, freshCSS);
                        coreLog('INFO', `Updated local cache for: ${id}`);
                        // Update live editor memory bank if it's open
                        window.cssokoun.activeThemeCache[id] = freshCSS;
                    }
                }
            }
        });
    };

    const injectJS = (url, id) => {
        // JS is trickier to cache due to execution context, so we still fetch it fresh for safety
        coreLog('SNIFF', `Fetching JS: ${id}`);
        GM.fetch({
            method: "GET",
            url: REPO + url + cacheBuster,
            onload: (res) => {
                if (res.status === 200) {
                    try {
                        const modWrapper = new Function('GM', 'cssokoun', 'REPO', res.responseText);
                        modWrapper(GM, window.cssokoun, REPO);
                    } catch (e) {
                        coreLog('ERROR', `Execution failed in: ${id}`, e);
                    }
                }
            }
        });
    };

    // Load System and Tweaks
    manifest.system.forEach(mod => {
        if (mod.required || window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id);
    });

    if (manifest.tweaks) manifest.tweaks.forEach(mod => { if (window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id); });

    // Load Themes (Using our new Instant Cache logic)
    if (manifest.themes) manifest.themes.forEach(mod => { if (window.cssokoun.state.modules[mod.id]) injectCSS(mod.file, mod.id); });

    // Load Custom Overrides last
    const customCSS = GM.get('cssokoun_custom_css', '');
    if (customCSS.trim().length > 0) {
        let liveStyleNode = document.createElement('style');
        liveStyleNode.id = 'cssokoun-live-styles';
        liveStyleNode.textContent = customCSS;
        document.head.appendChild(liveStyleNode);
    }
}
