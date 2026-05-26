window.cssokoun = window.cssokoun || {};
window.cssokoun.state = {
    modules: GM.get('cssokoun_modules', {})
};

window.cssokoun.log = function(level, moduleName, ...args) {
    const method = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
    method(`[cssokoun::${moduleName}]`, ...args);
};
const coreLog = (level, ...args) => window.cssokoun.log(level, 'core', ...args);

coreLog('INFO', 'Core initialized.');

window.cssokoun.themeStyleNodes = [];

function addThemeStyle(css, id) {
    const oldNode = document.getElementById(`cssokoun-theme-${id}`);
    if (oldNode) oldNode.remove();

    const styleNode = document.createElement('style');
    styleNode.id = `cssokoun-theme-${id}`;
    styleNode.dataset.cssokounTheme = id;
    styleNode.textContent = css;
    (document.head || document.documentElement).appendChild(styleNode);
    window.cssokoun.themeStyleNodes = [styleNode];
    return styleNode;
}

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
        if (res.status !== 200) {
            coreLog('ERROR', 'Manifest fetch failed.', res.status);
            uncloakPage();
            return;
        }

        try {
            const manifest = JSON.parse(res.responseText);
            window.cssokoun.manifest = manifest;
            loadModules(manifest);
        } catch (e) {
            coreLog('ERROR', 'Manifest is invalid JSON.', e);
            uncloakPage();
        }
    },
    onerror: uncloakPage
});

function uncloakPage() {
    setTimeout(() => {
        const cloak = document.getElementById('cssokoun-cloak');
        if (cloak) {
            cloak.textContent += `\nbody { opacity: 1 !important; filter: blur(0) !important; pointer-events: auto !important; }`;
            setTimeout(() => cloak.remove(), 300);
        }
    }, 30);
}

function loadModules(manifest) {
    const cacheBuster = `?v=${Date.now()}`;
    let pendingThemes = 0;

    const injectCSS = (url, id) => {
        const cacheKey = `cso_cache_${id}`;
        const cachedCSS = GM.get(cacheKey, null);

        if (cachedCSS) {
            coreLog('INFO', `Injected CSS from local cache: ${id}`);
            addThemeStyle(cachedCSS, id);
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
                        addThemeStyle(freshCSS, id);
                        pendingThemes--;
                        if (pendingThemes === 0) uncloakPage();
                    }
                    if (freshCSS !== cachedCSS) {
                        GM.set(cacheKey, freshCSS);
                    }
                    coreLog('INFO', `Loaded CSS theme: ${id}`);
                } else if (!cachedCSS) {
                    pendingThemes--;
                    if (pendingThemes === 0) uncloakPage();
                }
            },
            onerror: () => {
                if (!cachedCSS) {
                    pendingThemes--;
                    if (pendingThemes === 0) uncloakPage();
                }
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
                    } catch (e) {
                        coreLog('ERROR', `Execution failed in: ${id}`, e);
                    }
                }
            }
        });
    };

    manifest.system.forEach(mod => {
        if (mod.required || window.cssokoun.state.modules[mod.id]) injectJS(mod.file, mod.id);
    });

    if (manifest.themes) {
        manifest.themes.forEach(mod => {
            if (window.cssokoun.state.modules[mod.id]) injectCSS(mod.file, mod.id);
        });
    }

    if (pendingThemes === 0) uncloakPage();
}
