/**
 * Register page — port of Register.jsx
 */
import { el } from '../utils.js';
import api from '../api.js';
import { navigate } from '../app.js';

export function renderRegister(container) {
    const formData = {
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
    };
    let errorMsg = '';
    let loading = false;

    function render() {
        container.innerHTML = '';

        const errorDiv = errorMsg
            ? el('div', { className: 'error-banner' }, errorMsg)
            : null;

        const form = el('form', { className: 'login-form' },
            el('div', { className: 'form-group' },
                el('label', { htmlFor: 'username' }, 'Username'),
                el('input', {
                    type: 'text', id: 'username', name: 'username',
                    value: formData.username, required: true,
                    placeholder: 'Choose a username',
                    onInput: (e) => { formData.username = e.target.value; },
                })
            ),
            el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' } },
                el('div', { className: 'form-group' },
                    el('label', { htmlFor: 'first_name' }, 'First Name'),
                    el('input', {
                        type: 'text', id: 'first_name', name: 'first_name',
                        value: formData.first_name, required: true,
                        placeholder: 'First Name',
                        onInput: (e) => { formData.first_name = e.target.value; },
                    })
                ),
                el('div', { className: 'form-group' },
                    el('label', { htmlFor: 'last_name' }, 'Last Name'),
                    el('input', {
                        type: 'text', id: 'last_name', name: 'last_name',
                        value: formData.last_name, required: true,
                        placeholder: 'Last Name',
                        onInput: (e) => { formData.last_name = e.target.value; },
                    })
                )
            ),
            el('div', { className: 'form-group' },
                el('label', { htmlFor: 'email' }, 'Email (Optional)'),
                el('input', {
                    type: 'email', id: 'email', name: 'email',
                    value: formData.email,
                    placeholder: 'your@email.com',
                    onInput: (e) => { formData.email = e.target.value; },
                })
            ),
            el('div', { className: 'form-group' },
                el('label', { htmlFor: 'password' }, 'Password'),
                el('input', {
                    type: 'password', id: 'password', name: 'password',
                    value: formData.password, required: true,
                    placeholder: 'Create a password',
                    onInput: (e) => { formData.password = e.target.value; },
                })
            ),
            el('div', { className: 'form-group' },
                el('label', { htmlFor: 'confirm_password' }, 'Confirm Password'),
                el('input', {
                    type: 'password', id: 'confirm_password', name: 'confirm_password',
                    value: formData.confirm_password, required: true,
                    placeholder: 'Repeat password',
                    onInput: (e) => { formData.confirm_password = e.target.value; },
                })
            ),
            el('button', {
                type: 'submit',
                className: 'btn btn-primary btn-block',
                disabled: loading,
            }, loading ? 'Creating Account...' : 'Register')
        );

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg = '';

            if (formData.password !== formData.confirm_password) {
                errorMsg = 'Passwords do not match';
                render();
                return;
            }

            loading = true;
            render();

            try {
                await api.get('auth/csrf/');
                const res = await api.post('auth/register/', {
                    username: formData.username,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    password: formData.password,
                });

                if (res.status === 201) {
                    window.location.href = '/';
                }
            } catch (err) {
                console.error('Registration error:', err);
                const detail = err.response?.data?.detail || 'Registration failed. Please try again.';
                errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail);
            } finally {
                loading = false;
                render();
            }
        });

        const card = el('div', { className: 'login-card glass' },
            el('div', { className: 'login-header' },
                el('h1', {}, 'Create Account'),
                el('p', {}, 'Join the WSTG Guided Walkthrough Platform')
            ),
            errorDiv,
            form,
            el('div', { className: 'login-footer' },
                el('p', {},
                    'Already have an account? ',
                    el('a', { href: '/login', 'data-link': true }, 'Login here')
                )
            )
        );

        const page = el('div', { className: 'login-container' }, card);
        container.appendChild(page);
    }

    render();
}
