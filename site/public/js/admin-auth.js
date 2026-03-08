// Updated to use real backend API
const API_URL = '/api';
const AUTH_KEY = 'adminAuthToken';
const USER_KEY = 'adminUser';

// Initialize auth check for protected pages
export function initAuthGuard() {
    const token = sessionStorage.getItem(AUTH_KEY);
    if (!token) {
        window.location.href = 'admin-login.html';
    }
}

// Handle login logic
export async function handleLogin(event, email, password, errorMessageEl) {
    if (event) event.preventDefault();

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Role check: Only allow 'owner' or 'staff'
            const adminRoles = ['owner', 'staff'];
            if (!adminRoles.includes(data.user.role)) {
                if (errorMessageEl) {
                    errorMessageEl.textContent = 'Access denied: Admin only';
                    errorMessageEl.classList.remove('hidden');
                }
                return;
            }

            sessionStorage.setItem(AUTH_KEY, data.token);
            sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
            window.location.href = 'admin-dashboard.html';
        } else {
            // Show error message from server
            if (errorMessageEl) {
                errorMessageEl.textContent = data.message || 'Login failed';
                errorMessageEl.classList.remove('hidden');
                errorMessageEl.parentElement.classList.add('animate-pulse');
                setTimeout(() => {
                    errorMessageEl.parentElement.classList.remove('animate-pulse');
                }, 500);
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

// Handle logout logic
export function handleLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(USER_KEY);
    window.location.href = 'admin-login.html';
}

// Helper to get auth headers
export function getAuthHeaders() {
    const token = sessionStorage.getItem(AUTH_KEY);
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}
