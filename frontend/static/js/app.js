/**
 * App shell — path-based router + auth state management
 */
import api from './api.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProjectCreation } from './pages/project-creation.js';
import { renderProjectWorkspace } from './pages/project-workspace.js';

// ─── Auth State ───
const auth = {
    user: null,
    loading: true,
};

export function getAuth() {
    return auth;
}

export async function checkAuth() {
    try {
        const res = await api.get('auth/user/');
        auth.user = { ...res.data, isAuthenticated: true };
    } catch (e) {
        auth.user = null;
    } finally {
        auth.loading = false;
    }
}

export async function login(username, password) {
    try {
        await api.get('auth/csrf/');
        await api.post('auth/login/', { username, password });
        const userRes = await api.get('auth/user/');
        auth.user = { ...userRes.data, isAuthenticated: true };
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function logout() {
    try {
        await api.post('auth/logout/');
        auth.user = null;
    } catch (e) {
        console.error(e);
    }
}

// ─── Router ───

const routes = [
    { path: '/login', render: renderLogin, requiresAuth: false },
    { path: '/register', render: renderRegister, requiresAuth: false },
    { path: '/dashboard', render: renderDashboard, requiresAuth: true },
    { path: '/projects/new', render: renderProjectCreation, requiresAuth: true },
    { path: '/projects/:id', render: renderProjectWorkspace, requiresAuth: true },
];

function matchRoute(pathname) {
    for (const route of routes) {
        // Check for exact match
        if (route.path === pathname) {
            return { route, params: {} };
        }

        // Check for parameterized routes like /projects/:id
        const routeParts = route.path.split('/');
        const pathParts = pathname.split('/');

        if (routeParts.length !== pathParts.length) continue;

        const params = {};
        let match = true;
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                params[routeParts[i].slice(1)] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
                match = false;
                break;
            }
        }

        if (match) return { route, params };
    }
    return null;
}

/**
 * Navigate to a new path. This is the primary navigation function.
 * @param {string} path 
 */
export function navigate(path) {
    window.history.pushState({}, '', path);
    handleRoute();
}

let currentCleanup = null;

async function handleRoute() {
    const root = document.getElementById('root');
    const pathname = window.location.pathname;

    // Run cleanup for previous page
    if (typeof currentCleanup === 'function') {
        currentCleanup();
        currentCleanup = null;
    }

    // Wait for auth check on first load
    if (auth.loading) {
        root.innerHTML = '<div class="loading-container">Loading session...</div>';
        await checkAuth();
    }

    const matched = matchRoute(pathname);

    if (!matched) {
        // Default redirect
        navigate('/dashboard');
        return;
    }

    const { route, params } = matched;

    // Auth guard
    if (route.requiresAuth && !auth.user) {
        navigate('/login');
        return;
    }

    // If authenticated and trying to go to login/register, redirect to dashboard
    if (!route.requiresAuth && auth.user && (pathname === '/login' || pathname === '/register')) {
        navigate('/dashboard');
        return;
    }

    // Clear and render
    root.innerHTML = '';
    const result = route.render(root, params);
    
    // Store cleanup function if returned
    if (typeof result === 'function') {
        currentCleanup = result;
    } else if (result && typeof result.then === 'function') {
        // If render returns a promise, await it to get potential cleanup
        const cleanup = await result;
        if (typeof cleanup === 'function') {
            currentCleanup = cleanup;
        }
    }
}

// ─── Initialize ───
window.addEventListener('popstate', handleRoute);

document.addEventListener('DOMContentLoaded', () => {
    // Intercept all link clicks for SPA navigation
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[data-link]');
        if (anchor) {
            e.preventDefault();
            navigate(anchor.getAttribute('href'));
        }
    });

    handleRoute();
});
