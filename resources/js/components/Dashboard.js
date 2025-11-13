import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Simple Pie Chart Component
function PieChart({ data, title, colors }) {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
            </div>
        );
    }

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const entries = Object.entries(data);

    let currentAngle = -90; // Start from top
    const radius = 80;
    const centerX = 120;
    const centerY = 120;

    const paths = entries.map(([label, value], index) => {
        const percentage = (value / total) * 100;
        const angle = (value / total) * 360;

        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
        const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
        const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');

        currentAngle = endAngle;

        return {
            path: pathData,
            label,
            value,
            percentage: percentage.toFixed(1),
            color: colors[index % colors.length]
        };
    });

    return (
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    <svg width="240" height="240" viewBox="0 0 240 240">
                        {paths.map((item, index) => (
                            <path
                                key={index}
                                d={item.path}
                                fill={item.color}
                                stroke="#fff"
                                strokeWidth="2"
                            />
                        ))}
                    </svg>
                </div>
                <div className="flex-1 space-y-2">
                    {paths.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm text-gray-700 flex-1">
                                {item.label}
                            </span>
                            <span className="text-sm font-semibold text-gray-800">
                                {item.value} ({item.percentage}%)
                            </span>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200 mt-2">
                        <span className="text-sm font-bold text-gray-800">
                            Total: {total}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState(null);
    const fetchingRef = useRef(false);
    const mountedRef = useRef(true);

    const chartColors = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#F97316', // Orange
        '#84CC16', // Lime
    ];

    useEffect(() => {
        // Only fetch user on initial mount if we don't have one
        if (!user && !fetchingRef.current) {
            fetchUser();
        }
        
        return () => {
            mountedRef.current = false;
        };
    }, []); // Empty deps - only run on mount
    
    // Separate effect to fetch statistics when user is available
    useEffect(() => {
        if (user && !statistics && !fetchingRef.current) {
            fetchStatistics();
        }
    }, [user]); // Run when user changes

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
                // Redirect non-admin users to account dashboard
                if (response.data.role !== 'admin') {
                    window.location.href = '/account-dashboard';
                    return;
                }
                setUser(response.data);
                setUserRole(response.data.role || null);
                setLoading(false);
                fetchingRef.current = false;
                // Fetch statistics after successful user fetch
                fetchStatistics();
                return true; // Success
            } else {
                // If response exists but no user data, only redirect after all retries
                if (retryCount < maxRetries) {
                    fetchingRef.current = false;
                    setTimeout(() => fetchUser(retryCount + 1), 500);
                    return false;
                }
                // Only redirect if we're not already on login page and component is mounted
                // Also check if we have a session cookie - if we do, don't redirect
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
                    // Only redirect if we're not already on login page and component is mounted
                    // Also check if we have a session cookie - if we do, don't redirect
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
                    // Don't redirect on server errors - user might still be authenticated
                    // But also don't fetch statistics if we can't verify user
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
                // Don't redirect on network errors - session might still be valid
                // But also don't fetch statistics if we can't verify user
                setLoading(false);
                fetchingRef.current = false;
                return false;
            }
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await axios.get('/api/dashboard/statistics', {
                withCredentials: true
            });
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            // Don't redirect on statistics errors - user might still be authenticated
            // Statistics failure shouldn't prevent dashboard access
            // Only log the error and continue
        }
        // Note: Don't set loading to false here - let fetchUser handle that
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
                        {/* Navigation */}
                        <div className="hidden md:flex gap-10 text-lg font-medium">
                            <a href="/dashboard" className="text-gray-800 hover:text-blue-600">Dashboard</a>
                            {userRole === 'admin' && (
                                <>
                                    <a href="/faculty" className="text-gray-800 hover:text-blue-600">Faculty</a>
                                    <a href="/students" className="text-gray-800 hover:text-blue-600">Students</a>
                                    <a href="/reports" className="text-gray-800 hover:text-blue-600">Reports</a>
                                    <a href="/settings" className="text-gray-800 hover:text-blue-600">System Settings</a>
                                </>
                            )}
                            <a href="/profile" className="text-gray-800 hover:text-blue-600">Profile</a>
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
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

                    {/* Statistics Cards */}
                    {statistics && statistics.totals && (
                        <div className="grid gap-6 sm:grid-cols-3 mb-8">
                            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Students</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">
                                            {statistics.totals.students || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Faculty</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">
                                            {statistics.totals.faculty || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Users</p>
                                        <p className="text-3xl font-bold text-gray-800 mt-2">
                                            {statistics.totals.users || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts Grid */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Students by Department Pie Chart */}
                        {statistics && (
                            <PieChart
                                data={statistics.students_by_department || {}}
                                title="Students by Department"
                                colors={chartColors}
                            />
                        )}

                        {/* Faculty by Department Pie Chart */}
                        {statistics && (
                            <PieChart
                                data={statistics.faculty_by_department || {}}
                                title="Faculty by Department"
                                colors={chartColors}
                            />
                        )}
                    </div>

                    {/* Students by Year Chart */}
                    {statistics && statistics.students_by_year && Object.keys(statistics.students_by_year).length > 0 && (
                        <div className="mt-6">
                            <PieChart
                                data={statistics.students_by_year}
                                title="Students by Year"
                                colors={chartColors}
                            />
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {userRole === 'admin' && (
                            <>
                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer">
                                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Faculty</h2>
                                    <p className="text-sm text-gray-500 mb-4">Manage faculty records, assignments, and schedules.</p>
                                    <a href="/faculty" className="inline-block text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
                                        Go to Faculty
                                    </a>
                                </div>

                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer">
                                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Students</h2>
                                    <p className="text-sm text-gray-500 mb-4">View, enroll, and update student information.</p>
                                    <a href="/students" className="inline-block text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
                                        Go to Students
                                    </a>
                                </div>

                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer">
                                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Reports</h2>
                                    <p className="text-sm text-gray-500 mb-4">Generate academic and administrative reports.</p>
                                    <a href="/reports" className="inline-block text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
                                        Go to Reports
                                    </a>
                                </div>

                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer">
                                    <h2 className="text-xl font-semibold text-gray-700 mb-2">System Settings</h2>
                                    <p className="text-sm text-gray-500 mb-4">Update portal configurations and preferences.</p>
                                    <a href="/settings" className="inline-block text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
                                        Go to System Settings
                                    </a>
                                </div>
                            </>
                        )}
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer">
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile</h2>
                            <p className="text-sm text-gray-500 mb-4">View and update your profile information.</p>
                            <a href="/profile" className="inline-block text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
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

