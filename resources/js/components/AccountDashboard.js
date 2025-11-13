import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function AccountDashboard() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchingRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        // Only fetch user on initial mount if we don't have one
        if (!user && !fetchingRef.current) {
            fetchUser();
        }
        
        return () => {
            mountedRef.current = false;
        };
    }, []); // Empty deps - only run on mount

    const fetchUser = async (retryCount = 0) => {
        // Prevent multiple simultaneous calls
        if (fetchingRef.current && retryCount === 0) {
            return;
        }
        
        // If we already have a user, don't fetch again
        if (user && retryCount === 0) {
            setLoading(false);
            return;
        }
        
        fetchingRef.current = true;
        const maxRetries = 3;
        
        try {
            const response = await axios.get('/api/user', {
                withCredentials: true
            });
            
            // Check if component is still mounted
            if (!mountedRef.current) {
                fetchingRef.current = false;
                return;
            }
            
            if (response.data && response.data.id) {
                // Redirect admin users to admin dashboard
                if (response.data.role === 'admin') {
                    window.location.href = '/dashboard';
                    return;
                }
                setUser(response.data);
                setUserRole(response.data.role || null);
                setLoading(false);
                fetchingRef.current = false;
                return true; // Success
            } else {
                // If response exists but no user data, only redirect after all retries
                if (retryCount < maxRetries) {
                    fetchingRef.current = false;
                    setTimeout(() => fetchUser(retryCount + 1), 500);
                    return false;
                }
                // Only redirect if we're not already on login page and component is mounted
                setLoading(false);
                fetchingRef.current = false;
                const hasSession = document.cookie.includes('laravel_session') || document.cookie.includes('_session');
                if (mountedRef.current && !hasSession && window.location.pathname !== '/login' && window.location.pathname !== '/') {
                    window.location.href = '/login';
                }
                return false;
            }
        } catch (error) {
            // Check if component is still mounted
            if (!mountedRef.current) {
                fetchingRef.current = false;
                return;
            }
            
            if (error.response) {
                const status = error.response.status;
                // Only redirect on authentication errors after all retries
                if (status === 401 || status === 403) {
                    if (retryCount < maxRetries) {
                        fetchingRef.current = false;
                        setTimeout(() => fetchUser(retryCount + 1), 500);
                        return false;
                    }
                    setLoading(false);
                    fetchingRef.current = false;
                    const hasSession = document.cookie.includes('laravel_session') || document.cookie.includes('_session');
                    if (mountedRef.current && !hasSession && window.location.pathname !== '/login' && window.location.pathname !== '/') {
                        window.location.href = '/login';
                    }
                    return false;
                } else {
                    // For other HTTP errors (500, 404, etc.), don't redirect - just retry
                    if (retryCount < maxRetries) {
                        fetchingRef.current = false;
                        setTimeout(() => fetchUser(retryCount + 1), 1000);
                        return false;
                    }
                    setLoading(false);
                    fetchingRef.current = false;
                    return false;
                }
            } else {
                // Network error - retry with longer delay
                if (retryCount < maxRetries) {
                    fetchingRef.current = false;
                    setTimeout(() => fetchUser(retryCount + 1), 1000);
                    return false;
                }
                setLoading(false);
                fetchingRef.current = false;
                return false;
            }
        }
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            await axios.post('/api/logout', {}, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken || window.axios.defaults.headers.common['X-CSRF-TOKEN']
                }
            });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    };

    const formatDate = () => {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return now.toLocaleDateString('en-US', options);
    };

    if (loading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-gray-600 text-lg mb-2">Loading...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                            <img src="/images/school_logo.png" alt="School Logo" className="h-14 w-auto object-contain" />
                            <div className="flex flex-col">
                                <span className="text-lg font-semibold text-gray-800">
                                    Welcome, {user.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {formatDate()}
                                </span>
                            </div>
                        </div>
                        {/* Navigation - Only Dashboard and Profile for students/faculty */}
                        <div className="hidden md:flex gap-10 text-lg font-medium">
                            <a href="/account-dashboard" className="text-gray-800 hover:text-blue-600">Dashboard</a>
                            <a href="/account-profile" className="text-gray-800 hover:text-blue-600">Profile</a>
                        </div>
                        <div>
                            <form onSubmit={handleLogout}>
                                <button type="submit" className="px-4 py-2 bg-[#243b80] text-white rounded-md hover:bg-red-700 transition">
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <main className="relative flex-1">
                <img src="/images/background.png" alt="" className="hero-bg-img" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">My Dashboard</h1>

                    {/* Welcome Message */}
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                            Welcome to your Account Dashboard
                        </h2>
                        <p className="text-gray-600">
                            This is your personal dashboard. Here you can view your information and manage your profile.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer">
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile</h2>
                            <p className="text-sm text-gray-500 mb-4">View and update your profile information.</p>
                            <a href="/account-profile" className="inline-block text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
                                Go to Profile
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                :root { --nav-h: 64px; }
                .hero-bg-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: blur(6px) brightness(0.85);
                }
                body {
                    font-family: 'Roboto', sans-serif;
                    background: #f3f4f6;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
            `}</style>
        </div>
    );
}

