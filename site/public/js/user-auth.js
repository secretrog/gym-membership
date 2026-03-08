// Member-specific authentication logic
const API_URL = '/api';
const AUTH_KEY = 'memberAuthToken';
const USER_KEY = 'memberUser';

// Initialize auth check for members
export function initMemberAuthGuard() {
    const token = sessionStorage.getItem(AUTH_KEY);
    if (!token) {
        window.location.href = 'user-login.html';
    }
}

// Handle member login
export async function handleMemberLogin(event, email, password, errorMessageEl) {
    if (event) event.preventDefault();

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Check if user is actually a member
            if (data.user.role !== 'member') {
                if (errorMessageEl) {
                    errorMessageEl.textContent = 'Access denied: Members only';
                    errorMessageEl.classList.remove('hidden');
                }
                return;
            }

            sessionStorage.setItem(AUTH_KEY, data.token);
            sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
            window.location.href = 'user-portal.html';
        } else {
            if (errorMessageEl) {
                errorMessageEl.textContent = data.message || 'Login failed';
                errorMessageEl.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Login error:', err);
        if (errorMessageEl) {
            errorMessageEl.textContent = 'Server connection error';
            errorMessageEl.classList.remove('hidden');
        }
    }
}

// Handle member logout
export function handleMemberLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(USER_KEY);
    window.location.href = 'user-login.html';
}

// Helper for member headers
export function getMemberAuthHeaders() {
    const token = sessionStorage.getItem(AUTH_KEY);
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}
