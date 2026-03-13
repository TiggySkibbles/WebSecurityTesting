/**
 * Login page — port of Login.jsx
 */
import { el, icon } from '../utils.js';
import { login, navigate } from '../app.js';

export function renderLogin(container) {
    let username = '';
    let password = '';
    let errorMsg = '';

    function render() {
        container.innerHTML = '';

        const errorDiv = errorMsg
            ? el('div', { style: { color: 'var(--accent-danger)', marginBottom: '1rem', textAlign: 'center' } }, errorMsg)
            : null;

        const form = el('form', {},
            el('div', { className: 'form-group' },
                el('label', { className: 'form-label' }, 'Username'),
                el('input', {
                    className: 'form-input',
                    type: 'text',
                    value: username,
                    required: true,
                    onInput: (e) => { username = e.target.value; },
                })
            ),
            el('div', { className: 'form-group' },
                el('label', { className: 'form-label' }, 'Password'),
                el('input', {
                    className: 'form-input',
                    type: 'password',
                    value: password,
                    required: true,
                    onInput: (e) => { password = e.target.value; },
                })
            ),
            el('button', {
                type: 'submit',
                className: 'btn btn-primary',
                style: { width: '100%', marginTop: '1rem' },
            }, 'Sign In')
        );

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg = '';
            const success = await login(username, password);
            if (success) {
                navigate('/dashboard');
            } else {
                errorMsg = 'Invalid credentials';
                render();
            }
        });

        const card = el('div', { className: 'card glass animate-enter', style: { maxWidth: '400px', width: '100%', padding: '2rem' } },
            el('div', { style: { textAlign: 'center', marginBottom: '2rem' } },
                icon('shield-check', 48, 'var(--accent-primary)'),
                el('h2', {}, 'WSTG Walkthrough'),
                el('p', {}, 'AppSec Engagement Platform')
            ),
            errorDiv,
            form,
            el('div', { className: 'login-footer' },
                el('p', {},
                    "Don't have an account? ",
                    el('a', { href: '/register', 'data-link': true }, 'Register here')
                )
            )
        );

        const page = el('div', { className: 'app-container', style: { alignItems: 'center', justifyContent: 'center' } }, card);
        container.appendChild(page);
    }

    render();
}
