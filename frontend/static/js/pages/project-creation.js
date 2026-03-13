/**
 * Project Creation page — port of ProjectCreation.jsx
 */
import { el, icon } from '../utils.js';
import api from '../api.js';
import { navigate } from '../app.js';

export function renderProjectCreation(container) {
    let name = '';
    let targetUrl = '';
    let errorMsg = '';
    let loading = false;

    function render() {
        container.innerHTML = '';

        const errorDiv = errorMsg
            ? el('div', { style: { color: 'var(--accent-danger)', marginBottom: '1rem' } }, errorMsg)
            : null;

        const form = el('form', {},
            el('div', { className: 'form-group' },
                el('label', { className: 'form-label' }, 'Project Name *'),
                el('input', {
                    className: 'form-input',
                    type: 'text',
                    placeholder: 'e.g. Internal Portal Q3 Audit',
                    value: name,
                    required: true,
                    onInput: (e) => { name = e.target.value; },
                })
            ),
            el('div', { className: 'form-group' },
                el('label', { className: 'form-label' }, 'Target URL'),
                el('input', {
                    className: 'form-input',
                    type: 'url',
                    placeholder: 'https://example.com',
                    value: targetUrl,
                    onInput: (e) => { targetUrl = e.target.value; },
                })
            ),
            el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' } },
                el('button', {
                    type: 'button',
                    className: 'btn btn-secondary',
                    onClick: () => navigate('/dashboard'),
                }, 'Cancel'),
                el('button', {
                    type: 'submit',
                    className: 'btn btn-primary',
                    disabled: loading,
                }, loading ? 'Creating...' : 'Create Project')
            )
        );

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            loading = true;
            errorMsg = '';
            render();

            try {
                const res = await api.post('projects/', {
                    name,
                    target_url: targetUrl,
                });
                navigate(`/projects/${res.data.id}`);
            } catch (err) {
                console.error(err);
                errorMsg = 'Failed to create project. Please verify inputs.';
            } finally {
                loading = false;
                render();
            }
        });

        const card = el('div', { className: 'card glass animate-enter', style: { maxWidth: '500px', width: '100%', position: 'relative' } },
            el('button', {
                style: { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' },
                onClick: () => navigate('/dashboard'),
            }, icon('x', 20)),

            el('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' } },
                icon('target', 28, 'var(--accent-primary)'),
                el('h2', { style: { margin: '0' } }, 'New Engagement')
            ),

            el('p', {}, 'Create a new OWASP WSTG workspace to track tests and findings.'),
            errorDiv,
            form
        );

        container.appendChild(
            el('div', { className: 'app-container', style: { alignItems: 'center', justifyContent: 'center' } }, card)
        );
    }

    render();
}
