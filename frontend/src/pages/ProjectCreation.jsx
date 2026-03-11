import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Target, X } from 'lucide-react';

const ProjectCreation = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('projects/', {
                name,
                target_url: targetUrl
            });
            // Redirect to the new workspace
            navigate(`/projects/${res.data.id}`);
        } catch (err) {
            console.error(err);
            setError('Failed to create project. Please verify inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="card glass animate-enter" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
                <button 
                    onClick={() => navigate('/dashboard')}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Target size={28} color="var(--accent-primary)" />
                    <h2 style={{ margin: 0 }}>New Engagement</h2>
                </div>
                
                <p>Create a new OWASP WSTG workspace to track tests and findings.</p>

                {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Project Name *</label>
                        <input 
                            className="form-input" 
                            type="text" 
                            placeholder="e.g. Internal Portal Q3 Audit"
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Target URL</label>
                        <input 
                            className="form-input" 
                            type="url" 
                            placeholder="https://example.com"
                            value={targetUrl} 
                            onChange={(e) => setTargetUrl(e.target.value)} 
                        />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectCreation;
