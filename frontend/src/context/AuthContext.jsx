import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check session on mount
        const checkAuth = async () => {
            try {
                // Fetch the authenticated user's profile
                const res = await api.get('auth/user/');
                setUser({ ...res.data, isAuthenticated: true });
            } catch (error) {
                // 403 or 401 means not authenticated
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            // Get CSRF cookie explicitly
            await api.get('auth/csrf/'); 
            
            // Post to our new Django REST view
            await api.post('auth/login/', { username, password });
            
            // Fetch full profile info now that we're authed
            const userRes = await api.get('auth/user/');
            setUser({ ...userRes.data, isAuthenticated: true });
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await api.post('auth/logout/');
            setUser(null);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
