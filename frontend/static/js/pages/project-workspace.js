/**
 * Project Workspace page — port of ProjectWorkspace.jsx
 * The most complex page: sidebar categories, test execution cards, evidence upload, export
 */
import { el, icon, getSafeUrl } from '../utils.js';
import api from '../api.js';
import { getAuth, navigate } from '../app.js';
import { showExportModal } from '../components/export-modal.js';
import { showEditProjectModal, showDeleteProjectModal } from '../components/project-modals.js';

// ─── Status Icon Helper ───
function statusIcon(status) {
    switch (status) {
        case 'PASS': return icon('check-circle', 18, '#3fb950');
        case 'FAIL': return icon('x-circle', 18, '#ff7b72');
        case 'NA': return icon('minus-circle', 18, 'var(--text-secondary)');
        default: return icon('circle', 18, '#d29922');
    }
}

// ─── Test Execution Card ───
function buildTestExecutionCard(execution, onUpdate) {
    let status = execution.status;
    let notes = execution.notes || '';
    let saving = false;
    let saved = false;
    let errorMsg = null;
    let uploading = false;
    let evidence = [...(execution.evidence || [])];

    const cardEl = el('div', { className: 'card', style: { marginBottom: '1rem' } });

    function render() {
        cardEl.innerHTML = '';

        // Header row: test name + status dropdown
        const refLink = execution.test.reference_url
            ? el('a', {
                href: getSafeUrl(execution.test.reference_url),
                target: '_blank',
                rel: 'noreferrer',
                title: 'View Official WSTG Documentation',
                style: { color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' },
            }, icon('external-link', 16))
            : null;

        const select = el('select', {
            className: 'form-input form-select',
            value: status,
            style: { width: 'auto', padding: '0.25rem 2rem 0.25rem 0.5rem' },
            onChange: (e) => { status = e.target.value; render(); },
        },
            el('option', { value: 'NOT_STARTED' }, 'Not Started'),
            el('option', { value: 'PASS' }, 'Pass'),
            el('option', { value: 'FAIL' }, 'Fail'),
            el('option', { value: 'NA' }, 'Not Applicable')
        );
        select.value = status;

        const headerRow = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' } },
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } },
                el('h4', { style: { margin: '0' } }, `${execution.test.ref_id} ${execution.test.name}`),
                refLink
            ),
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' } },
                statusIcon(status),
                select
            )
        );

        // Notes textarea
        const textarea = el('textarea', {
            className: 'form-input',
            placeholder: 'Add engagement notes, findings, or methodology used...',
            rows: '3',
            onInput: (e) => { notes = e.target.value; },
        }, notes);
        // Set value properly for textarea
        textarea.value = notes;

        const notesGroup = el('div', { className: 'form-group', style: { marginBottom: '1rem' } }, textarea);

        // Evidence list
        let evidenceSection = null;
        if (evidence.length > 0) {
            evidenceSection = el('div', { style: { marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' } },
                ...evidence.map(ev => {
                    const fileUrl = ev.file.startsWith('http') ? ev.file : `${window.location.origin}${ev.file}`;
                    return el('div', {
                        className: 'badge',
                        style: {
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            padding: '0.5rem 0.8rem',
                            background: 'rgba(56, 139, 253, 0.1)',
                            border: '1px solid rgba(56, 139, 253, 0.2)',
                            borderRadius: '6px',
                        }
                    },
                        icon('download', 14, 'var(--accent-primary)'),
                        el('a', {
                            href: getSafeUrl(fileUrl),
                            target: '_blank',
                            rel: 'noreferrer',
                            style: { color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '500' },
                        }, ev.original_filename || ev.description || ev.file.split('/').pop())
                    );
                })
            );
        }

        // File upload
        const uploadId = `upload-${execution.id}`;
        const fileInput = el('input', {
            type: 'file',
            id: uploadId,
            style: { display: 'none' },
            disabled: uploading,
            onChange: async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                uploading = true;
                render();

                const formData = new FormData();
                formData.append('file', file);
                formData.append('test_execution', execution.id);
                formData.append('description', file.name);

                try {
                    const res = await api.post('evidence/', formData, {});
                    evidence.push(res.data);
                } catch (error) {
                    console.error('Failed to upload evidence', error);
                    alert('Failed to upload evidence.');
                } finally {
                    uploading = false;
                    event.target.value = null;
                    render();
                }
            },
        });
        const uploadLabel = el('label', {
            htmlFor: uploadId,
            className: 'btn btn-secondary',
            style: { cursor: 'pointer' },
        }, uploading ? 'Uploading...' : 'Attach Evidence');

        // Feedback messages
        const feedbackItems = [];
        if (errorMsg) {
            feedbackItems.push(el('span', {
                style: {
                    color: '#ff7b72', fontSize: '0.875rem',
                    backgroundColor: 'rgba(255, 123, 114, 0.1)',
                    padding: '0.4rem 0.8rem', borderRadius: '6px',
                    border: '1px solid rgba(255, 123, 114, 0.2)',
                }
            }, errorMsg));
        }
        if (saved) {
            feedbackItems.push(el('span', {
                style: {
                    color: 'var(--accent-success)', fontSize: '0.875rem',
                    backgroundColor: 'rgba(63, 185, 80, 0.1)',
                    padding: '0.4rem 0.8rem', borderRadius: '6px',
                    border: '1px solid rgba(63, 185, 80, 0.2)',
                }
            }, '✓ Changes saved!'));
        }

        // Determine if save button should be disabled
        const unchanged = status === execution.status && notes === (execution.notes || '');

        const saveBtn = el('button', {
            className: 'btn btn-primary',
            disabled: saving || unchanged,
            onClick: async () => {
                saving = true;
                saved = false;
                errorMsg = null;
                render();

                try {
                    const res = await api.patch(`test-executions/${execution.id}/`, { status, notes });
                    // Update the execution reference
                    execution.status = res.data.status;
                    execution.notes = res.data.notes;
                    onUpdate({ ...res.data, evidence });
                    saved = true;
                    setTimeout(() => { saved = false; render(); }, 3000);
                } catch (error) {
                    console.error('Failed to update test execution', error);
                    errorMsg = 'Failed to save. Please try again.';
                    setTimeout(() => { errorMsg = null; render(); }, 4000);
                } finally {
                    saving = false;
                    render();
                }
            },
        }, saving ? 'Saving...' : 'Save Changes');

        // Footer row
        const footerRow = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            el('div', {}, fileInput, uploadLabel),
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem' } },
                ...feedbackItems,
                saveBtn
            )
        );

        cardEl.appendChild(headerRow);
        cardEl.appendChild(notesGroup);
        if (evidenceSection) cardEl.appendChild(evidenceSection);
        cardEl.appendChild(footerRow);
    }

    render();
    return cardEl;
}

// ─── Main Page ───
export async function renderProjectWorkspace(container, params) {
    const { user } = getAuth();
    const projectId = params.id;
    let project = null;
    let categories = [];
    let executions = [];
    let activeCategory = null;
    let loading = true;
    let modalCleanup = null;

    function render() {
        container.innerHTML = '';

        if (loading) {
            container.appendChild(el('div', { className: 'app-container', style: { padding: '2rem' } }, 'Loading Workspace...'));
            return;
        }
        if (!project) {
            container.appendChild(el('div', { className: 'app-container', style: { padding: '2rem' } }, 'Project not found or access denied.'));
            return;
        }

        // ─── Header ───
        const ownerBtns = (user && project.owner && user.id === project.owner.id)
            ? el('div', { style: { display: 'flex', gap: '0.5rem' } },
                el('button', {
                    className: 'btn btn-secondary',
                    title: 'Edit Assessment',
                    style: { padding: '0.4rem' },
                    onClick: () => openEditModal(),
                }, icon('edit-2', 16)),
                el('button', {
                    className: 'btn btn-secondary',
                    title: 'Delete Assessment',
                    style: { padding: '0.4rem', color: '#ff7b72' },
                    onClick: () => openDeleteModal(),
                }, icon('trash-2', 16))
            )
            : null;

        const header = el('header', {
            style: { padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }
        },
            el('button', {
                className: 'btn btn-secondary',
                style: { padding: '0.5rem' },
                onClick: () => navigate('/dashboard'),
            }, icon('arrow-left', 18)),
            el('div', { style: { flex: '1', display: 'flex', alignItems: 'center', gap: '1rem' } },
                el('div', {},
                    el('h3', { style: { margin: '0' } }, project.name),
                    el('span', { style: { fontSize: '0.875rem', color: 'var(--text-secondary)' } }, 'Workspace')
                ),
                ownerBtns
            ),
            el('button', {
                className: 'btn btn-primary',
                onClick: () => openExportModal(),
            }, icon('download', 18), 'Export')
        );

        // ─── Sidebar ───
        const sidebar = el('div', {
            style: { width: '300px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflowY: 'auto' }
        },
            el('ul', { style: { listStyle: 'none', padding: '0', margin: '0' } },
                ...categories.map(cat =>
                    el('li', {},
                        el('button', {
                            style: {
                                width: '100%', textAlign: 'left', padding: '1rem',
                                background: activeCategory?.id === cat.id ? 'var(--bg-tertiary)' : 'transparent',
                                border: 'none',
                                borderLeft: activeCategory?.id === cat.id ? '4px solid var(--accent-primary)' : '4px solid transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-color)',
                                fontFamily: 'var(--font-family)',
                            },
                            onClick: () => { activeCategory = cat; render(); },
                        },
                            el('div', { style: { fontWeight: '500', fontSize: '0.875rem' } }, cat.name),
                            el('div', { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' } }, cat.ref_id)
                        )
                    )
                )
            )
        );

        // ─── Content Pane ───
        const currentExecutions = executions.filter(e => e.test.ref_id.startsWith(activeCategory?.ref_id));

        let contentBody;
        if (!activeCategory) {
            contentBody = null;
        } else if (currentExecutions.length === 0) {
            contentBody = el('div', {},
                el('div', { style: { marginBottom: '2rem' } },
                    el('h2', {}, activeCategory.name),
                    el('p', {}, `Manage test cases for ${activeCategory.ref_id}`)
                ),
                el('div', { className: 'card glass' },
                    el('p', { style: { margin: '0' } }, 'No test executions found for this category.')
                )
            );
        } else {
            contentBody = el('div', {},
                el('div', { style: { marginBottom: '2rem' } },
                    el('h2', {}, activeCategory.name),
                    el('p', {}, `Manage test cases for ${activeCategory.ref_id}`)
                ),
                ...currentExecutions.map(exec =>
                    buildTestExecutionCard(exec, (updatedExec) => {
                        executions = executions.map(e => e.id === updatedExec.id ? updatedExec : e);
                    })
                )
            );
        }

        const contentPane = el('div', { style: { flex: '1', padding: '2rem', overflowY: 'auto' } }, contentBody);

        // ─── Layout ───
        const layout = el('div', { style: { display: 'flex', flex: '1', overflow: 'hidden' } }, sidebar, contentPane);
        container.appendChild(el('div', { className: 'app-container' }, header, layout));
    }

    function openExportModal() {
        if (modalCleanup) modalCleanup();
        const safeName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        modalCleanup = showExportModal(project.id, safeName, () => {
            if (modalCleanup) { modalCleanup(); modalCleanup = null; }
        });
    }

    function openEditModal() {
        if (modalCleanup) modalCleanup();
        modalCleanup = showEditProjectModal(project, () => {
            if (modalCleanup) { modalCleanup(); modalCleanup = null; }
        }, (updatedProject) => {
            project = updatedProject;
            render();
        });
    }

    function openDeleteModal() {
        if (modalCleanup) modalCleanup();
        modalCleanup = showDeleteProjectModal(project, () => {
            if (modalCleanup) { modalCleanup(); modalCleanup = null; }
        }, () => {
            navigate('/dashboard');
        });
    }

    // ─── Fetch Data ───
    try {
        const [projRes, catRes, execRes] = await Promise.all([
            api.get(`projects/${projectId}/`),
            api.get('categories/'),
            api.get(`test-executions/?project_id=${projectId}`),
        ]);

        project = projRes.data;
        categories = catRes.data;
        executions = execRes.data;

        if (categories.length > 0) {
            activeCategory = categories[0];
        }
    } catch (error) {
        console.error('Error loading workspace', error);
    } finally {
        loading = false;
    }

    render();

    return () => {
        if (modalCleanup) modalCleanup();
    };
}
