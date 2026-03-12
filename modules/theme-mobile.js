const log = (level, ...args) => window.cssokoun.log(level, 'theme-mobile-js', ...args);
log('INFO', 'Injecting Mobile Viewport Meta Tag...');

// 1. Force the mobile viewport so the CSS actually triggers on phones
let meta = document.querySelector('meta[name="viewport"]');
if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
}
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';

log('SNIFF', 'Viewport forced to mobile scale.');
