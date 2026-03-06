window.cssokoun = window.cssokoun || {};
window.cssokoun.state = {
    modules: GM.get('cssokoun_modules', {}),
    debug: GM.get('cssokoun_debug', true)
};

// --- DUMB BOOTSTRAP LOGGER ---
window.cssokoun._logBuffer = [];
window.cssokoun.log = function(level, moduleName, ...args) {
    window.cssokoun._logBuffer.push({ level, moduleName, args });
};
const coreLog = (level, ...args) => window.cssokoun.log(level, 'core', ...args);

coreLog('INFO', 'Core initialized. Dumb logger active.');

// --- URL ROUTER (Replaces @-moz-document) ---
(function injectRoutingClasses() {
    const path = window.location.pathname.split('/').filter(Boolean);
    if (path.length === 0) document.body.classList.add('route-home');
    path.forEach((p, i) => document.body.classList.add('route-' + path.slice(0, i + 1).join('-').replace(/[^a-z0-9-]/gi, '')));
    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        for (const [key, val] of params) document.body.classList.add(`query-${key}-${val}`.replace(/[^a-z0-9-]/gi, ''));
    }
    coreLog('SNIFF', 'Injected routing classes to body:', document.body.className);
})();

// --- MANIFEST FETCHER ---
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

// --- MODULE ROUTER ---
function loadModules(manifest) {
    const cacheBuster = `?v=${Date.now()}`;

    // Upgraded CSS Injector using Tampermonkey's maximum authority
    const injectCSS = (url, id) => {
        coreLog('SNIFF', `Fetching CSS: ${id}`);
        GM.fetch({
            method: "GET",
            url: REPO + url + cacheBuster,
            onload: (res) => {
                if (res.status === 200) {
                    try {
                        GM.addStyle(res.responseText);
                        coreLog('INFO', `Injected CSS theme: ${id}`);
                    } catch (e) {
                        coreLog('ERROR', `Failed to inject CSS: ${id}`, e);
                    }
                } else {
                    coreLog('ERROR', `Failed to fetch CSS: ${id}`);
                }
            }
        });
    };

    const injectJS = (url, id) => {
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
                } else {
                    coreLog('ERROR', `Failed to load JS: ${id}`);
                }
            }
        });
    };

    manifest.system.forEach(mod => {
        if (mod.required || window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id);
    });

    if (manifest.themes) manifest.themes.forEach(mod => { if (window.cssokoun.state.modules[mod.id]) injectCSS(mod.file, mod.id); });
    if (manifest.tweaks) manifest.tweaks.forEach(mod => { if (window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id); });

    const customCSS = GM.get('cssokoun_custom_css', '');
    if (customCSS.trim().length > 0) GM.addStyle(customCSS);
}