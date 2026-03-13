/**
 * Component: Project Modals (Edit + Delete) — port of ProjectModals.jsx
 */
import { el, icon } from '../utils.js';
import api from '../api.js';

/**
 * Show the Edit Project modal
 */
export function showEditProjectModal(project, onClose, onProjectUpdated) {
    let name = project.name;
    let targetUrl = project.target_url || '';
    let saving = false;
    let errorMsg = null;

    function render() {
        modal.querySelector('.modal-body').innerHTML = '';
        modal.querySelector('.modal-body').appendChild(buildBody());
    }

    function buildBody() {
        const errorDiv = errorMsg
            ? el('div', {
                style: { padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'rgba(255, 123, 114, 0.1)', color: '#ff7b72', borderRadius: '6px', border: '1px solid rgba(255, 123, 114, 0.2)' }
            }, errorMsg)
            : null;

        const form = el('form', {},
            el('div', { className: 'form-group' },
                el('label', { className: 'form-label' }, 'Project Name'),
                el('input', {
                    type: 'text', className: 'form-input',
                    value: name, required: true,
                    onInput: (e) => { name = e.target.value; },
                })
            ),
            el('div', { className: 'form-group', style: { marginTop: '1rem' } },
                el('label', { className: 'form-label' }, 'Target URL'),
                el('input', {
                    type: 'url', className: 'form-input',
                    value: targetUrl,
                    placeholder: 'https://example.com',
                    onInput: (e) => { targetUrl = e.target.value; },
                })
            ),
            el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' } },
                el('button', { type: 'button', className: 'btn btn-secondary', disabled: saving, onClick: onClose }, 'Cancel'),
                el('button', { type: 'submit', className: 'btn btn-primary', disabled: saving },
                    saving ? 'Saving...' : 'Save Changes'
                )
            )
        );

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            saving = true;
            errorMsg = null;
            render();

            try {
                const res = await api.patch(`projects/${project.id}/`, {
                    name,
                    target_url: targetUrl,
                });
                onProjectUpdated(res.data);
                onClose();
            } catch (err) {
                console.error('Failed to update project', err);
                errorMsg = err.response?.data?.detail || 'An error occurred while updating the project.';
            } finally {
                saving = false;
                render();
            }
        });

        return el('div', {}, errorDiv, form);
    }

    const modal = el('div', { className: 'modal-overlay animate-enter' },
        el('div', { className: 'card glass', style: { width: '100%', maxWidth: '500px', padding: '2rem' } },
            el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' } },
                el('h3', { style: { margin: '0' } }, 'Edit Assessment'),
                el('button', {
                    style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' },
                    onClick: onClose,
                }, icon('x', 20))
            ),
            el('div', { className: 'modal-body' }, buildBody())
        )
    );

    modal.addEventListener('click', (e) => {
        if (e.target === modal) onClose();
    });

    document.body.appendChild(modal);
    return () => { if (modal.parentNode) modal.parentNode.removeChild(modal); };
}

/**
 * Show the Delete Project modal
 */
export function showDeleteProjectModal(project, onClose, onProjectDeleted) {
    let deleting = false;
    let errorMsg = null;

    function render() {
        body.innerHTML = '';
        body.appendChild(buildBody());
    }

    function buildBody() {
        const errorDiv = errorMsg
            ? el('div', {
                style: { padding: '0.75rem', marginBottom: '1.5rem', backgroundColor: 'rgba(255, 123, 114, 0.1)', color: '#ff7b72', borderRadius: '6px', border: '1px solid rgba(255, 123, 114, 0.2)' }
            }, errorMsg)
            : null;

        return el('div', {},
            el('p', { style: { color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' } },
                'Are you absolutely sure you want to delete ',
                el('strong', {}, project.name),
                '? This action cannot be undone. All test executions, notes, and uploaded evidence files will be permanently deleted.'
            ),
            errorDiv,
            el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '1rem' } },
                el('button', { className: 'btn btn-secondary', disabled: deleting, onClick: onClose }, 'Cancel'),
                el('button', {
                    className: 'btn',
                    style: { backgroundColor: '#da3633', color: 'white' },
                    disabled: deleting,
                    onClick: async () => {
                        deleting = true;
                        errorMsg = null;
                        render();
                        try {
                            await api.delete(`projects/${project.id}/`);
                            onProjectDeleted(project.id);
                            onClose();
                        } catch (err) {
                            console.error('Failed to delete project', err);
                            errorMsg = err.response?.data?.detail || 'An error occurred while deleting the project.';
                            deleting = false;
                            render();
                        }
                    },
                }, deleting ? 'Deleting...' : 'Yes, Delete Project')
            )
        );
    }

    const body = el('div', { className: 'modal-body' }, buildBody());

    const modal = el('div', { className: 'modal-overlay animate-enter' },
        el('div', { className: 'card glass', style: { width: '100%', maxWidth: '450px', padding: '2rem', border: '1px solid rgba(255, 123, 114, 0.3)' } },
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem', color: '#ff7b72', marginBottom: '1.5rem' } },
                icon('alert-triangle', 28),
                el('h3', { style: { margin: '0' } }, 'Delete Assessment')
            ),
            body
        )
    );

    modal.addEventListener('click', (e) => {
        if (e.target === modal) onClose();
    });

    document.body.appendChild(modal);
    return () => { if (modal.parentNode) modal.parentNode.removeChild(modal); };
}
