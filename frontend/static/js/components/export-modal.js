/**
 * Component: Export Modal — port of ExportModal.jsx
 */
import { el, icon } from '../utils.js';
import api from '../api.js';

export function showExportModal(projectId, projectName, onClose) {
    let downloading = false;

    async function handleDownload(format) {
        downloading = true;
        try {
            const url = `/api/projects/${projectId}/export_${format}/`;
            window.location.href = url;
        } catch (error) {
            console.error(`Export failed for ${format}`, error);
            alert('Failed to export report.');
        } finally {
            downloading = false;
            onClose();
        }
    }

    function makeExportBtn(className, iconName, iconColor, title, subtitle, format) {
        return el('button', {
            className: `btn ${className}`,
            style: { justifyContent: 'flex-start', padding: '1rem' },
            disabled: downloading,
            onClick: () => handleDownload(format),
        },
            icon(iconName, 20, iconColor),
            el('div', { style: { textAlign: 'left' } },
                el('div', { style: { fontWeight: 'bold' } }, title),
                el('div', { style: { fontSize: '0.75rem', color: className === 'btn-primary' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' } }, subtitle)
            )
        );
    }

    const overlay = el('div', { className: 'modal-overlay animate-enter' },
        el('div', { className: 'card glass', style: { width: '400px', position: 'relative' } },
            el('button', {
                style: { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' },
                onClick: onClose,
            }, icon('x', 20)),

            el('h3', { style: { marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' } },
                icon('download', 20, 'var(--accent-primary)'),
                'Export Engagement Report'
            ),

            el('div', { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
                makeExportBtn('btn-secondary', 'file-text', 'var(--accent-danger)', 'Executive PDF Report', 'Includes only Vulnerable/Failed findings', 'pdf'),
                makeExportBtn('btn-secondary', 'file-code', 'var(--accent-success)', 'Detailed HTML Report', 'Collapsible view of all tests and statuses', 'html'),
                makeExportBtn('btn-secondary', 'file-json', 'var(--accent-warning)', 'Raw JSON Data', 'Machine-readable format for API integrations', 'json'),
                el('div', { style: { marginTop: '0.5rem' } },
                    makeExportBtn('btn-primary', 'file-code', 'white', 'Full Bundle (HTML + Evidence)', 'Structured ZIP archive with report and all files', 'bundle')
                )
            )
        )
    );

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) onClose();
    });

    document.body.appendChild(overlay);

    // Return cleanup
    return () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
}
