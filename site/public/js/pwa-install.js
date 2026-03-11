/**
 * PWA Install & Smart CTA Helper
 * Handles device-aware behavior for the "One Link" experience.
 */

let deferredPrompt;

// Check if the current device is mobile
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

// Check if app is in standalone mode (already installed & opened as app)
const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

// Check if device is iOS
const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show the install button if it exists
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
    }

    // Update the Smart CTA if it exists
    updateSmartCTA('install-ready');
});

document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) {
        installBtn.addEventListener('click', triggerInstall);
    }

    const smartCTA = document.getElementById('smartCTA');
    if (smartCTA) {
        smartCTA.addEventListener('click', handleSmartAction);
        // Initial set based on environment
        updateSmartCTA('initial');
    }

    // Show iOS install invite if on iOS and not installed
    if (isIOS() && !isStandalone()) {
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) installBtn.classList.remove('hidden');
    }
});

async function triggerInstall() {
    if (isIOS()) {
        const modal = document.getElementById('iosInstallModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;

    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) installBtn.classList.add('hidden');
}

function handleSmartAction(e) {
    if (isMobile()) {
        if (!isStandalone()) {
            if (deferredPrompt || isIOS()) {
                e.preventDefault();
                triggerInstall();
            } else {
                // No prompt but not standalone, go to portal
                window.location.href = 'user-portal.html';
            }
        } else {
            // Already standalone
            window.location.href = 'user-portal.html';
        }
    } else {
        // Desktop - just go to portal
        window.location.href = 'user-portal.html';
    }
}

function updateSmartCTA(state) {
    const smartCTA = document.getElementById('smartCTA');
    if (!smartCTA) return;

    const label = smartCTA.querySelector('.cta-label');
    const icon = smartCTA.querySelector('.material-symbols-outlined');

    if (isMobile()) {
        if (isStandalone()) {
            if (label) label.textContent = 'Open Portal';
            if (icon) icon.textContent = 'dashboard_customize';
        } else if (state === 'install-ready' || deferredPrompt || isIOS()) {
            if (label) label.textContent = 'Get the App';
            if (icon) icon.textContent = 'download_for_offline';
            smartCTA.classList.add('smart-cta-pulsing');
        } else {
            if (label) label.textContent = 'Launch App';
            if (icon) icon.textContent = 'rocket_launch';
        }
    } else {
        // Desktop
        if (label) label.textContent = 'Launch Portal';
        if (icon) icon.textContent = 'login';
        smartCTA.classList.remove('smart-cta-pulsing');
    }
}

// --- PWA Update Logic ---
let newWorker;

function showUpdateBanner() {
    const banner = document.getElementById('pwaUpdateBanner');
    if (banner) {
        banner.classList.remove('hidden');
        banner.classList.add('flex');
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBanner();
                    }
                });
            });
        });

        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const updateBtn = document.getElementById('pwaUpdateBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            if (newWorker) {
                newWorker.postMessage('SKIP_WAITING');
            }
        });
    }
});
// -------------------------

window.addEventListener('appinstalled', (evt) => {
    console.log('Iron Pulse was installed.');
    updateSmartCTA('installed');
});
