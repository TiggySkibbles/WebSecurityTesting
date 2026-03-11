import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PlusCircle, Shield, Link, Share2, Edit2, Trash2 } from 'lucide-react';
import { getSafeUrl } from '../utils/urlValidators';
import { EditProjectModal, DeleteProjectModal } from '../components/ProjectModals';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProject, setEditingProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);

    const handleProjectUpdated = (updatedProject) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    };

    const handleProjectDeleted = (deletedId) => {
        setProjects(prev => prev.filter(p => p.id !== deletedId));
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('projects/');
            setProjects(res.data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield color="var(--accent-primary)" size={24} />
                    <h3>WSTG Platform</h3>
                </div>
                <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
            </header>

            <main className="main-content animate-enter">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>Engagements</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
                        <PlusCircle size={18} /> New Project
                    </button>
                </div>

                {loading ? (
                    <p>Loading projects...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {projects.length === 0 ? (
                            <p style={{ gridColumn: '1/-1' }}>No projects found. Create one to get started.</p>
                        ) : (
                            projects.map(proj => (
                                <div key={proj.id} className="card glass" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0 }}>{proj.name}</h3>
                                        <div className="badge badge-pass">Active</div>
                                    </div>
                                    
                                    {proj.target_url && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            <Link size={14} />
                                            <a href={getSafeUrl(proj.target_url)} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                                                {proj.target_url}
                                            </a>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button className="btn btn-secondary" onClick={() => navigate(`/projects/${proj.id}`)} style={{ flex: 1, marginRight: '0.5rem' }}>
                                            Open
                                        </button>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {user && proj.owner && user.id === proj.owner.id && (
                                                <>
                                                    <button className="btn btn-secondary" onClick={() => setEditingProject(proj)} title="Edit" style={{ padding: '0.5rem' }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={() => setDeletingProject(proj)} title="Delete" style={{ padding: '0.5rem', color: '#ff7b72' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button className="btn btn-secondary" onClick={() => alert('Share feature pending')} title="Share" style={{ padding: '0.5rem' }}>
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {editingProject && (
                <EditProjectModal 
                    project={editingProject} 
                    onClose={() => setEditingProject(null)} 
                    onProjectUpdated={handleProjectUpdated}
                />
            )}
            
            {deletingProject && (
                <DeleteProjectModal 
                    project={deletingProject} 
                    onClose={() => setDeletingProject(null)} 
                    onProjectDeleted={handleProjectDeleted}
                />
            )}
        </div>
    );
};

export default Dashboard;
