window.cssokoun = window.cssokoun || {};
window.cssokoun.state = {
    modules: GM.get('cssokoun_modules', {}),
    debug: GM.get('cssokoun_debug', true)
};

// --- DUMB BOOTSTRAP LOGGER (Will be replaced by sys-logger) ---
window.cssokoun._logBuffer = [];
window.cssokoun.log = function(level, moduleName, ...args) {
    // Just save it for later
    window.cssokoun._logBuffer.push({ level, moduleName, args });
};

const coreLog = (level, ...args) => window.cssokoun.log(level, 'core', ...args);

coreLog('INFO', 'Core initialized. Dumb logger active.');
coreLog('SNIFF', 'Boot parameters:', { REPO: REPO, STATE: window.cssokoun.state });

// --- THE MANIFEST FETCHER ---
const MANIFEST_URL = REPO + 'modules.json?v=' + Date.now();

coreLog('SNIFF', `Fetching manifest from: ${MANIFEST_URL}`);

GM.fetch({
    method: "GET",
    url: MANIFEST_URL,
    onload: function(res) {
        if (res.status !== 200) return coreLog('ERROR', 'Manifest fetch failed. Status:', res.status);
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

// --- THE ROUTER ---
function loadModules(manifest) {
    const cacheBuster = `?v=${Date.now()}`;

    const injectCSS = (url, id) => {
        coreLog('SNIFF', `Injecting CSS: ${id}`);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = REPO + url + cacheBuster;
        document.head.appendChild(link);
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

    // Load System (sys-logger will be first)
    manifest.system.forEach(mod => {
        if (mod.required || window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id);
    });

    // Load Themes & Tweaks
    if (manifest.themes) manifest.themes.forEach(mod => { if (window.cssokoun.state.modules[mod.id]) injectCSS(mod.file, mod.id); });
    if (manifest.tweaks) manifest.tweaks.forEach(mod => { if (window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id); });

    // Inject Custom Overrides Last
    const customCSS = GM.get('cssokoun_custom_css', '');
    if (customCSS.trim().length > 0) GM.addStyle(customCSS);
}
