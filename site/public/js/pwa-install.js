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
});

async function triggerInstall() {
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
        if (!isStandalone() && deferredPrompt) {
            e.preventDefault();
            triggerInstall();
        } else {
            // Already standalone or no prompt available, let it link or handle redirect
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
        } else if (state === 'install-ready' || deferredPrompt) {
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

window.addEventListener('appinstalled', (evt) => {
    console.log('Iron Pulse was installed.');
    updateSmartCTA('installed');
});
