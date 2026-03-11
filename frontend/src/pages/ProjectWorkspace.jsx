import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Circle, Download, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import ExportModal from '../components/ExportModal';
import { getSafeUrl } from '../utils/urlValidators';
import { EditProjectModal, DeleteProjectModal } from '../components/ProjectModals';

const StatusIcon = ({ status }) => {
    switch (status) {
        case 'PASS': return <CheckCircle size={18} color="#3fb950" />;
        case 'FAIL': return <XCircle size={18} color="#ff7b72" />;
        case 'NA': return <MinusCircle size={18} color="var(--text-secondary)" />;
        default: return <Circle size={18} color="#d29922" />;
    }
};

const TestExecutionCard = ({ execution, onUpdate }) => {
    const [status, setStatus] = useState(execution.status);
    const [notes, setNotes] = useState(execution.notes || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [evidence, setEvidence] = useState(execution.evidence || []);

    // Sync state if execution prop changes (e.g. after a save or category switch)
    useEffect(() => {
        setStatus(execution.status);
        setNotes(execution.notes || '');
        setEvidence(execution.evidence || []);
        setSaved(false);
        setErrorMsg(null);
    }, [execution]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setErrorMsg(null);
        try {
            const payload = {
                status,
                notes
            };
            
            // Use PATCH to only update the modified fields and avoid nested model validation errors
            const res = await api.patch(`test-executions/${execution.id}/`, payload);
            onUpdate({...res.data, evidence}); // preserve evidence locally
            
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Failed to update test execution", error);
            setErrorMsg("Failed to save. Please try again.");
            setTimeout(() => setErrorMsg(null), 4000);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('test_execution', execution.id);
        formData.append('description', file.name);

        try {
            const res = await api.post('evidence/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setEvidence([...evidence, res.data]);
        } catch (error) {
            console.error("Failed to upload evidence", error);
            alert("Failed to upload evidence.");
        } finally {
            setUploading(false);
            event.target.value = null; // reset input
        }
    };

    return (
        <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>{execution.test.ref_id} {execution.test.name}</h4>
                    {execution.test.reference_url && (
                        <a 
                            href={getSafeUrl(execution.test.reference_url)}
                            target="_blank" 
                            rel="noreferrer"
                            title="View Official WSTG Documentation"
                            style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                        >
                            <ExternalLink size={16} />
                        </a>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusIcon status={status} />
                    <select 
                        className="form-input form-select" 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.5rem' }}
                    >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="PASS">Pass</option>
                        <option value="FAIL">Fail</option>
                        <option value="NA">Not Applicable</option>
                    </select>
                </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <textarea 
                    className="form-input" 
                    placeholder="Add engagement notes, findings, or methodology used..."
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                />
            </div>

            {/* Evidence List */}
            {evidence.length > 0 && (
                <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {evidence.map(ev => {
                        const fileUrl = ev.file.startsWith('http') ? ev.file : `http://localhost:8000${ev.file}`;
                        return (
                            <div key={ev.id} className="badge" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.6rem',
                                padding: '0.5rem 0.8rem',
                                background: 'rgba(56, 139, 253, 0.1)',
                                border: '1px solid rgba(56, 139, 253, 0.2)',
                                borderRadius: '6px'
                            }}>
                                <Download size={14} color="var(--accent-primary)" />
                                <a 
                                    href={getSafeUrl(fileUrl)} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ 
                                        color: 'var(--accent-primary)', 
                                        textDecoration: 'none',
                                        fontSize: '0.85rem',
                                        fontWeight: 500
                                    }}
                                >
                                    {ev.original_filename || ev.description || ev.file.split('/').pop()}
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <input 
                        type="file" 
                        id={`upload-${execution.id}`} 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label htmlFor={`upload-${execution.id}`} className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        {uploading ? 'Uploading...' : 'Attach Evidence'}
                    </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {errorMsg && (
                        <span style={{ 
                            color: '#ff7b72', 
                            fontSize: '0.875rem', 
                            backgroundColor: 'rgba(255, 123, 114, 0.1)', 
                            padding: '0.4rem 0.8rem', 
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 123, 114, 0.2)'
                        }}>
                            {errorMsg}
                        </span>
                    )}
                    {saved && (
                        <span style={{ 
                            color: 'var(--accent-success)', 
                            fontSize: '0.875rem', 
                            backgroundColor: 'rgba(63, 185, 80, 0.1)', 
                            padding: '0.4rem 0.8rem', 
                            borderRadius: '6px',
                            border: '1px solid rgba(63, 185, 80, 0.2)' 
                        }}>
                            ✓ Changes saved!
                        </span>
                    )}
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSave} 
                        disabled={saving || (status === execution.status && notes === (execution.notes || ''))}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectWorkspace = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [categories, setCategories] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);
    const [editingProject, setEditingProject] = useState(false);
    const [deletingProject, setDeletingProject] = useState(false);

    useEffect(() => {
        const fetchWorkspaceData = async () => {
            try {
                // Fetch project details
                const projRes = await api.get(`projects/${id}/`);
                setProject(projRes.data);

                // Fetch categories
                const catRes = await api.get('categories/');
                setCategories(catRes.data);
                if (catRes.data.length > 0) {
                    setActiveCategory(catRes.data[0]);
                }

                // Fetch executions
                const execRes = await api.get(`test-executions/?project_id=${id}`);
                setExecutions(execRes.data);
                
                // If there are no executions, we should probably generate them for the project.
                // In a full implementation, you'd trigger this via API. For simplicity here:
                if (execRes.data.length === 0) {
                    // Logic to bulk create executions based on WSTGTests
                    // This is usually handled on the backend upon project creation.
                }

            } catch (error) {
                console.error("Error loading workspace", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkspaceData();
    }, [id]);

    const handleExecutionUpdate = (updatedExec) => {
        setExecutions(prev => prev.map(e => e.id === updatedExec.id ? updatedExec : e));
    };

    if (loading) return <div className="app-container" style={{ padding: '2rem' }}>Loading Workspace...</div>;
    if (!project) return <div className="app-container" style={{ padding: '2rem' }}>Project not found or access denied.</div>;

    // Filter executions for the active category
    // Note: If no executions exist yet, you'll need the backend to auto-generate them.
    const currentExecutions = executions.filter(e => e.test.ref_id.startsWith(activeCategory?.ref_id));

    return (
        <div className="app-container">
            <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>{project.name}</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Workspace</span>
                    </div>
                    {user && project.owner && user.id === project.owner.id && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setEditingProject(true)} title="Edit Assessment" style={{ padding: '0.4rem' }}>
                                <Edit2 size={16} />
                            </button>
                            <button className="btn btn-secondary" onClick={() => setDeletingProject(true)} title="Delete Assessment" style={{ padding: '0.4rem', color: '#ff7b72' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
                <button className="btn btn-primary" onClick={() => setShowExportModal(true)}>
                    <Download size={18} /> Export
                </button>
            </header>

            {showExportModal && (
                <ExportModal 
                    projectId={project.id} 
                    projectName={project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}
                    onClose={() => setShowExportModal(false)} 
                />
            )}

            {editingProject && (
                <EditProjectModal 
                    project={project} 
                    onClose={() => setEditingProject(false)} 
                    onProjectUpdated={(updatedProject) => setProject(updatedProject)}
                />
            )}
            
            {deletingProject && (
                <DeleteProjectModal 
                    project={project} 
                    onClose={() => setDeletingProject(false)} 
                    onProjectDeleted={() => navigate('/dashboard')}
                />
            )}

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: '300px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <button 
                                    style={{ 
                                        width: '100%', 
                                        textAlign: 'left', 
                                        padding: '1rem', 
                                        background: activeCategory?.id === cat.id ? 'var(--bg-tertiary)' : 'transparent',
                                        border: 'none',
                                        borderLeft: activeCategory?.id === cat.id ? '4px solid var(--accent-primary)' : '4px solid transparent',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{cat.ref_id}</div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Content Pane */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    {activeCategory && (
                        <>
                            <div style={{ marginBottom: '2rem' }}>
                                <h2>{activeCategory.name}</h2>
                                <p>Manage test cases for {activeCategory.ref_id}</p>
                            </div>

                            {currentExecutions.length === 0 ? (
                                <div className="card glass">
                                    <p style={{ margin: 0 }}>No test executions found for this category.</p>
                                </div>
                            ) : (
                                currentExecutions.map(exec => (
                                    <TestExecutionCard 
                                        key={exec.id} 
                                        execution={exec} 
                                        onUpdate={handleExecutionUpdate}
                                    />
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectWorkspace;
