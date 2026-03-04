// ==UserScript==
// @name         cssokoun Seed
// @namespace    http://tampermonkey.net/
// @version      0.1
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

    // Package the GM APIs so the external scripts can use them securely
    const GM_API = {
        fetch: GM_xmlhttpRequest,
        get: GM_getValue,
        set: GM_setValue,
        addStyle: GM_addStyle
    };

    GM_xmlhttpRequest({
        method: "GET",
        url: CORE_URL,
        onload: function(res) {
            if (res.status === 200) {
                // Execute the Core and pass it the API and the Repo URL
                const initCore = new Function('GM', 'REPO', res.responseText);
                initCore(GM_API, REPO_URL);
            } else {
                console.error("[cssokoun::seed] FATAL: Could not fetch core.js", res.status);
            }
        }
    });
})();
