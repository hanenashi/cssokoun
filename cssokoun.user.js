// ==UserScript==
// @name         cssokoun Seed
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Modular CSS/JS loader for okoun.cz
// @author       kokochan
// @match        *://www.okoun.cz/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    
    const REPO_URL = 'https://raw.githubusercontent.com/hanenashi/cssokoun/main/';
    const CORE_URL = REPO_URL + 'modules/core.js?v=' + Date.now();

    // Wrapped in arrow functions to preserve the Tampermonkey sandbox context
    const GM_API = {
        fetch: (opts) => GM_xmlhttpRequest(opts),
        get: (key, def) => GM_getValue(key, def),
        set: (key, val) => GM_setValue(key, val),
        addStyle: (css) => GM_addStyle(css)
    };

    GM_xmlhttpRequest({
        method: "GET",
        url: CORE_URL,
        onload: function(res) {
            if (res.status === 200) {
                const initCore = new Function('GM', 'REPO', res.responseText);
                initCore(GM_API, REPO_URL);
            } else {
                console.error("[cssokoun::seed] FATAL: Could not fetch core.js", res.status);
            }
        }
    });
})();