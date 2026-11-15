// boot.js - the small start-up jobs that used to sit inline in index.html. They live in a file so the
// site's Content-Security-Policy (netlify.toml) can refuse every inline script.

// The header logo is loaded from another site: hide it if it cannot be fetched (offline first visit).
(() => {
    const logo = document.getElementById('brand-logo');
    if (!logo) return;
    const hide = () => { logo.style.display = 'none'; };
    logo.addEventListener('error', hide);
    if (logo.complete && logo.naturalWidth === 0) hide();
})();

try {
    if ('serviceWorker' in navigator) {
        const hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.register('sw.js');
        // A new version activated while this page was open: ask for a reload rather than
        // reloading automatically, so an in-progress triage is never lost.
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!hadController) return;
            const el = document.createElement('div');
            el.className = 'toast toast-persistent';
            el.innerHTML = 'A new version is ready. <button type="button" class="btn-tiny">Reload when convenient</button>';
            el.querySelector('button').onclick = () => location.reload();
            document.getElementById('toast-container').appendChild(el);
        });
    }
} catch (err) {
    console.warn('Service worker unavailable - offline support disabled this session.', err);
}
