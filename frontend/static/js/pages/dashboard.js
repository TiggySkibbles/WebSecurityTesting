/**
 * Dashboard page — port of Dashboard.jsx
 */
import { el, icon, getSafeUrl } from '../utils.js';
import api from '../api.js';
import { getAuth, logout, navigate } from '../app.js';
import { showEditProjectModal, showDeleteProjectModal } from '../components/project-modals.js';

export async function renderDashboard(container) {
    const { user } = getAuth();
    let projects = [];
    let loading = true;
    let modalCleanup = null;

    function render() {
        container.innerHTML = '';

        // Header
        const header = el('header', {
            style: { padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        },
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' } },
                icon('shield', 24, 'var(--accent-primary)'),
                el('h3', {}, 'WSTG Platform')
            ),
            el('button', {
                className: 'btn btn-secondary',
                onClick: async () => { await logout(); navigate('/login'); },
            }, 'Logout')
        );

        // Main content
        let content;
        if (loading) {
            content = el('p', {}, 'Loading projects...');
        } else if (projects.length === 0) {
            content = el('p', {}, 'No projects found. Create one to get started.');
        } else {
            content = el('div', {
                style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }
            }, ...projects.map(proj => buildProjectCard(proj)));
        }

        const main = el('main', { className: 'main-content animate-enter' },
            el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' } },
                el('h2', {}, 'Engagements'),
                el('button', {
                    className: 'btn btn-primary',
                    onClick: () => navigate('/projects/new'),
                },
                    icon('plus-circle', 18),
                    'New Project'
                )
            ),
            content
        );

        container.appendChild(el('div', { className: 'app-container' }, header, main));
    }

    function buildProjectCard(proj) {
        const urlRow = proj.target_url
            ? el('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' } },
                icon('link', 14),
                el('a', {
                    href: getSafeUrl(proj.target_url),
                    target: '_blank',
                    rel: 'noreferrer',
                    style: { color: 'var(--accent-primary)', textDecoration: 'none' },
                }, proj.target_url)
            )
            : null;

        const ownerButtons = (user && proj.owner && user.id === proj.owner.id)
            ? [
                el('button', {
                    className: 'btn btn-secondary',
                    title: 'Edit',
                    style: { padding: '0.5rem' },
                    onClick: () => openEditModal(proj),
                }, icon('edit-2', 16)),
                el('button', {
                    className: 'btn btn-secondary',
                    title: 'Delete',
                    style: { padding: '0.5rem', color: '#ff7b72' },
                    onClick: () => openDeleteModal(proj),
                }, icon('trash-2', 16)),
            ]
            : [];

        return el('div', { className: 'card glass', style: { display: 'flex', flexDirection: 'column' } },
            el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' } },
                el('h3', { style: { margin: '0' } }, proj.name),
                el('div', { className: 'badge badge-pass' }, 'Active')
            ),
            urlRow,
            el('div', { style: { marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                el('button', {
                    className: 'btn btn-secondary',
                    style: { flex: '1', marginRight: '0.5rem' },
                    onClick: () => navigate(`/projects/${proj.id}`),
                }, 'Open'),
                el('div', { style: { display: 'flex', gap: '0.25rem' } },
                    ...ownerButtons,
                    el('button', {
                        className: 'btn btn-secondary',
                        title: 'Share',
                        style: { padding: '0.5rem' },
                        onClick: () => alert('Share feature pending'),
                    }, icon('share-2', 16))
                )
            )
        );
    }

    function openEditModal(proj) {
        if (modalCleanup) modalCleanup();
        modalCleanup = showEditProjectModal(proj, () => {
            if (modalCleanup) { modalCleanup(); modalCleanup = null; }
        }, (updatedProject) => {
            projects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
            render();
        });
    }

    function openDeleteModal(proj) {
        if (modalCleanup) modalCleanup();
        modalCleanup = showDeleteProjectModal(proj, () => {
            if (modalCleanup) { modalCleanup(); modalCleanup = null; }
        }, (deletedId) => {
            projects = projects.filter(p => p.id !== deletedId);
            render();
        });
    }

    // Fetch projects
    try {
        const res = await api.get('projects/');
        projects = res.data;
    } catch (error) {
        console.error('Failed to fetch projects', error);
    } finally {
        loading = false;
    }

    render();

    // Return cleanup
    return () => {
        if (modalCleanup) modalCleanup();
    };
}
