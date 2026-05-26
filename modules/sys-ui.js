const log = (level, ...args) => window.cssokoun.log(level, 'sys-ui', ...args);
log('INFO', 'Building CSS theme switcher.');

function getSelectedThemeId(themes, state) {
    const selected = themes.find(theme => state[theme.id]);
    return selected ? selected.id : '';
}

function reloadHostPage() {
    if (window.location.pathname.endsWith('.do')) {
        window.location.replace(document.referrer || '/');
        return;
    }

    window.location.href = window.location.pathname + window.location.search;
}

function injectUI() {
    const menu = document.querySelector('.head .menu');
    if (!menu) return log('ERROR', 'Could not find .head .menu');
    if (document.getElementById('cssokoun-switcher')) return;

    const manifest = window.cssokoun.manifest || {};
    const themes = manifest.themes || [];
    const selectedThemeId = getSelectedThemeId(themes, window.cssokoun.state.modules);

    GM.addStyle(`
        #cssokoun-switcher {
            position: relative;
            display: inline-block;
            margin-left: 10px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 99999;
        }
        #cssokoun-toggle {
            color: #007acc;
            cursor: pointer;
            font-weight: bold;
            text-decoration: none;
        }
        #cssokoun-toggle:hover {
            text-decoration: underline;
        }
        #cssokoun-panel {
            position: absolute;
            top: 1.6em;
            right: 0;
            width: 260px;
            box-sizing: border-box;
            padding: 10px;
            background: #fff;
            color: #222;
            border: 1px solid #777;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
            text-align: left;
        }
        #cssokoun-panel[hidden] {
            display: none;
        }
        #cssokoun-panel h4 {
            margin: 0 0 8px;
            padding: 0 0 6px;
            border-bottom: 1px solid #ddd;
            color: #222;
            font-size: 13px;
        }
        .cssokoun-theme-option {
            display: flex;
            gap: 7px;
            align-items: flex-start;
            padding: 5px 0;
            color: #222;
            line-height: 1.25;
            cursor: pointer;
        }
        .cssokoun-theme-option input {
            margin-top: 1px;
        }
        #cssokoun-apply {
            width: 100%;
            margin-top: 8px;
            padding: 6px 8px;
            border: 1px solid #0069ad;
            background: #007acc;
            color: #fff;
            cursor: pointer;
            font-weight: bold;
        }
        #cssokoun-apply:hover {
            background: #0069ad;
        }
    `);

    const switcher = document.createElement('span');
    switcher.id = 'cssokoun-switcher';

    const toggle = document.createElement('a');
    toggle.id = 'cssokoun-toggle';
    toggle.href = '#';
    toggle.textContent = 'cssokoun';

    const panel = document.createElement('form');
    panel.id = 'cssokoun-panel';
    panel.hidden = true;

    const title = document.createElement('h4');
    title.textContent = 'CSS style';
    panel.appendChild(title);

    panel.appendChild(createThemeOption('', 'Vanilla Okoun', selectedThemeId === ''));

    themes.forEach(theme => {
        panel.appendChild(createThemeOption(theme.id, theme.name, selectedThemeId === theme.id));
    });

    const apply = document.createElement('button');
    apply.id = 'cssokoun-apply';
    apply.type = 'submit';
    apply.textContent = 'Apply';
    panel.appendChild(apply);

    switcher.appendChild(toggle);
    switcher.appendChild(panel);
    menu.appendChild(switcher);

    toggle.addEventListener('click', event => {
        event.preventDefault();
        panel.hidden = !panel.hidden;
    });

    panel.addEventListener('submit', async event => {
        event.preventDefault();

        const selected = new FormData(panel).get('cssokoun-theme') || '';
        const newStates = {};
        themes.forEach(theme => {
            newStates[theme.id] = theme.id === selected;
        });

        await Promise.resolve(GM.set('cssokoun_modules', newStates));
        log('INFO', 'Theme saved. Reloading host page.');
        reloadHostPage();
    });

    document.addEventListener('click', event => {
        if (!switcher.contains(event.target)) panel.hidden = true;
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') panel.hidden = true;
    });
}

function createThemeOption(value, text, checked) {
    const label = document.createElement('label');
    label.className = 'cssokoun-theme-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'cssokoun-theme';
    input.value = value;
    input.checked = checked;

    const name = document.createElement('span');
    name.textContent = text;

    label.appendChild(input);
    label.appendChild(name);
    return label;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
} else {
    injectUI();
}
