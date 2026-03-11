import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export const EditProjectModal = ({ project, onClose, onProjectUpdated }) => {
    const [name, setName] = useState(project.name);
    const [targetUrl, setTargetUrl] = useState(project.target_url || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        
        try {
            const res = await api.patch(`projects/${project.id}/`, {
                name,
                target_url: targetUrl
            });
            onProjectUpdated(res.data);
            onClose();
        } catch (err) {
            console.error("Failed to update project", err);
            setError(err.response?.data?.detail || "An error occurred while updating the project.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay animate-enter" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Edit Assessment</h3>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'rgba(255, 123, 114, 0.1)', color: '#ff7b72', borderRadius: '6px', border: '1px solid rgba(255, 123, 114, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Project Name</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Target URL</label>
                        <input 
                            type="url" 
                            className="form-input" 
                            value={targetUrl} 
                            onChange={e => setTargetUrl(e.target.value)} 
                            placeholder="https://example.com"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const DeleteProjectModal = ({ project, onClose, onProjectDeleted }) => {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);

    const handleDelete = async () => {
        setDeleting(true);
        setError(null);
        try {
            await api.delete(`projects/${project.id}/`);
            onProjectDeleted(project.id);
            onClose();
        } catch (err) {
            console.error("Failed to delete project", err);
            setError(err.response?.data?.detail || "An error occurred while deleting the project.");
            setDeleting(false);
        }
    };

    return (
        <div className="modal-overlay animate-enter" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '450px', padding: '2rem', border: '1px solid rgba(255, 123, 114, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ff7b72', marginBottom: '1.5rem' }}>
                    <AlertTriangle size={28} />
                    <h3 style={{ margin: 0 }}>Delete Assessment</h3>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Are you absolutely sure you want to delete <strong>{project.name}</strong>? 
                    This action cannot be undone. All test executions, notes, and uploaded evidence files will be permanently deleted.
                </p>

                {error && (
                    <div style={{ padding: '0.75rem', marginBottom: '1.5rem', backgroundColor: 'rgba(255, 123, 114, 0.1)', color: '#ff7b72', borderRadius: '6px', border: '1px solid rgba(255, 123, 114, 0.2)' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={deleting}>Cancel</button>
                    <button 
                        className="btn" 
                        style={{ backgroundColor: '#da3633', color: 'white' }} 
                        onClick={handleDelete} 
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Yes, Delete Project'}
                    </button>
                </div>
            </div>
        </div>
    );
};
