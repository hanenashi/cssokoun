// ==UserScript==
// @name         cssokoun Seed
// @namespace    https://github.com/hanenashi/cssokoun
// @version      0.6
// @description  Modular CSS/JS loader for okoun.cz
// @author       kokochan / hanenashi
// @match        *://www.okoun.cz/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM.setValue
// @grant        GM_listValues
// @grant        GM.listValues
// @grant        GM_addStyle
// @grant        GM.addStyle
// @connect      raw.githubusercontent.com
// @connect      *
// ==/UserScript==

(async function() {
    'use strict';

    // --- 1. THE ANTI-FOUC CLOAK ---
    // Inject a heavy blur and 0 opacity instantly before the page paints.
    const cloak = document.createElement('style');
    cloak.id = 'cssokoun-cloak';
    cloak.textContent = `
        html { background: #1e1e1e !important; }
        body { opacity: 0 !important; filter: blur(10px) !important; transition: opacity 0.25s ease-out, filter 0.25s ease-out !important; pointer-events: none !important; }
    `;
    document.documentElement.appendChild(cloak);

    // Fail-safe: If the network hangs, uncloak after 1.5 seconds anyway
    setTimeout(() => {
        const c = document.getElementById('cssokoun-cloak');
        if (c) {
            c.textContent += `\nbody { opacity: 1 !important; filter: blur(0) !important; pointer-events: auto !important; }`;
            setTimeout(() => c.remove(), 300);
        }
    }, 1500);

    // --- 2. THE PIPELINE ---
    const REPO_URL = 'https://raw.githubusercontent.com/hanenashi/cssokoun/main/';
    const CORE_URL = REPO_URL + 'modules/core.js?v=' + Date.now();

    const fetcher = (typeof GM_xmlhttpRequest !== 'undefined') ? GM_xmlhttpRequest : (typeof GM !== 'undefined' && GM.xmlHttpRequest) ? GM.xmlHttpRequest : null;
    const getter = (typeof GM_getValue !== 'undefined') ? GM_getValue : (typeof GM !== 'undefined' && GM.getValue) ? GM.getValue : null;
    const setter = (typeof GM_setValue !== 'undefined') ? GM_setValue : (typeof GM !== 'undefined' && GM.setValue) ? GM.setValue : null;
    const lister = (typeof GM_listValues !== 'undefined') ? GM_listValues : (typeof GM !== 'undefined' && GM.listValues) ? GM.listValues : null;
    const styler = (typeof GM_addStyle !== 'undefined') ? GM_addStyle : null;

    if (!fetcher) return console.error("[cssokoun::seed] FATAL: Cross-origin not supported.");

    let memCache = {};
    if (getter) {
        try {
            memCache['cssokoun_modules'] = await Promise.resolve(getter('cssokoun_modules', {}));
            memCache['cssokoun_debug'] = await Promise.resolve(getter('cssokoun_debug', true));
            memCache['cssokoun_custom_css'] = await Promise.resolve(getter('cssokoun_custom_css', ''));
            memCache['cssokoun_custom_js'] = await Promise.resolve(getter('cssokoun_custom_js', ''));
            
            if (lister) {
                const keys = await Promise.resolve(lister());
                for (const key of keys) {
                    if (key.startsWith('cso_cache_')) {
                        memCache[key] = await Promise.resolve(getter(key, null));
                    }
                }
            }
        } catch(e) { console.error("[cssokoun::seed] Failed to read storage:", e); }
    }

    const GM_API = {
        fetch: (opts) => fetcher(opts),
        get: (key, def) => memCache[key] !== undefined ? memCache[key] : def,
        set: async (key, val) => {
            memCache[key] = val; 
            if (setter) await Promise.resolve(setter(key, val));
        },
        addStyle: (css) => {
            if (styler) return styler(css);
            let s = document.createElement('style');
            s.textContent = css;
            document.head.appendChild(s);
        }
    };

    fetcher({
        method: "GET",
        url: CORE_URL,
        onload: function(res) {
            if (res.status === 200) {
                const initCore = new Function('GM', 'REPO', res.responseText);
                initCore(GM_API, REPO_URL);
            }
        }
    });
})();
