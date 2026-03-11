import React, { useState } from 'react';
import { Download, FileText, FileJson, FileCode, X } from 'lucide-react';
import api from '../services/api';

const ExportModal = ({ projectId, projectName, onClose }) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (format) => {
        setDownloading(true);
        try {
            // For file downloads, we need responseType: blob
            const response = await api.get(`projects/${projectId}/export_${format}/`, {
                responseType: 'blob'
            });

            // Create a link to download the file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Set filename based on format
            let ext = format;
            if (format === 'html') ext = 'html';
            if (format === 'json') ext = 'json';
            if (format === 'pdf') ext = 'pdf';
            if (format === 'bundle') ext = 'zip';
            
            const filename = format === 'bundle' 
                ? `${projectName}_Full_Bundle.${ext}` 
                : `${projectName}_Report.${ext}`;

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

        } catch (error) {
            console.error(`Export failed for ${format}`, error);
            alert("Failed to export report.");
        } finally {
            setDownloading(false);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card glass animate-enter" style={{ width: '400px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
                
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={20} color="var(--accent-primary)" />
                    Export Engagement Report
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button 
                        className="btn btn-secondary" 
                        style={{ justifyContent: 'flex-start', padding: '1rem' }}
                        onClick={() => handleDownload('pdf')}
                        disabled={downloading}
                    >
                        <FileText size={20} color="var(--accent-danger)" />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold' }}>Executive PDF Report</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Includes only Vulnerable/Failed findings</div>
                        </div>
                    </button>
                    
                    <button 
                        className="btn btn-secondary" 
                        style={{ justifyContent: 'flex-start', padding: '1rem' }}
                        onClick={() => handleDownload('html')}
                        disabled={downloading}
                    >
                        <FileCode size={20} color="var(--accent-success)" />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold' }}>Detailed HTML Report</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Collapsible view of all tests and statuses</div>
                        </div>
                    </button>

                    <button 
                        className="btn btn-secondary" 
                        style={{ justifyContent: 'flex-start', padding: '1rem' }}
                        onClick={() => handleDownload('json')}
                        disabled={downloading}
                    >
                        <FileJson size={20} color="var(--accent-warning)" />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold' }}>Raw JSON Data</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Machine-readable format for API integrations</div>
                        </div>
                    </button>

                    <button 
                        className="btn btn-primary" 
                        style={{ justifyContent: 'flex-start', padding: '1rem', marginTop: '0.5rem' }}
                        onClick={() => handleDownload('bundle')}
                        disabled={downloading}
                    >
                        <FileCode size={20} color="white" />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold' }}>Full Bundle (HTML + Evidence)</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Structured ZIP archive with report and all files</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
