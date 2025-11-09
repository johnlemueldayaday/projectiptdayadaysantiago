import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Settings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [errors, setErrors] = useState({});
    
    // Notification preferences
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        smsNotifications: false,
        systemAlerts: true,
        reportReminders: true,
        profileUpdates: true
    });

    // Display preferences
    const [display, setDisplay] = useState({
        theme: 'light',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        itemsPerPage: '10'
    });

    // Security settings
    const [security, setSecurity] = useState({
        twoFactorAuth: false,
        sessionTimeout: '30',
        requirePasswordChange: false
    });

    // Password change
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Delete account
    const [deleteAccountData, setDeleteAccountData] = useState({
        password: '',
        confirmText: ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchUser();
        loadSettings();
    }, []);

    const fetchUser = async (retryCount = 0) => {
        const maxRetries = 2;
        try {
            const response = await axios.get('/api/user', {
                withCredentials: true
            });
            if (response.data && response.data.id) {
                setUser(response.data);
                setLoading(false);
            } else {
                if (retryCount < maxRetries) {
                    setTimeout(() => fetchUser(retryCount + 1), 500);
                    return;
                }
                setLoading(false);
                window.location.href = '/login';
            }
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 401 || status === 403) {
                    if (retryCount < maxRetries) {
                        setTimeout(() => fetchUser(retryCount + 1), 500);
                        return;
                    }
                    setLoading(false);
                    window.location.href = '/login';
                } else {
                    // For other errors, retry once
                    if (retryCount < maxRetries) {
                        setTimeout(() => fetchUser(retryCount + 1), 500);
                        return;
                    }
                    setLoading(false);
                }
            } else {
                // Network error - retry
                if (retryCount < maxRetries) {
                    setTimeout(() => fetchUser(retryCount + 1), 1000);
                    return;
                }
                setLoading(false);
            }
        }
    };

    const loadSettings = async () => {
        try {
            // In a real app, you'd fetch these from an API
            // For now, we'll use localStorage or defaults
            const savedNotifications = localStorage.getItem('notificationSettings');
            const savedDisplay = localStorage.getItem('displaySettings');
            const savedSecurity = localStorage.getItem('securitySettings');

            if (savedNotifications) {
                setNotifications(JSON.parse(savedNotifications));
            }
            if (savedDisplay) {
                setDisplay(JSON.parse(savedDisplay));
            }
            if (savedSecurity) {
                setSecurity(JSON.parse(savedSecurity));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleNotificationChange = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleDisplayChange = (key, value) => {
        setDisplay(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSecurityChange = (key, value) => {
        setSecurity(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const saveSettings = async (category) => {
        setSaving(true);
        setSuccess('');
        setErrors({});

        try {
            // Save to localStorage (in production, save to backend)
            if (category === 'notifications') {
                localStorage.setItem('notificationSettings', JSON.stringify(notifications));
            } else if (category === 'display') {
                localStorage.setItem('displaySettings', JSON.stringify(display));
            } else if (category === 'security') {
                localStorage.setItem('securitySettings', JSON.stringify(security));
            }

            setSuccess(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setErrors({ general: 'Failed to save settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess('');
        setErrors({});

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' });
            setSaving(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setErrors({ newPassword: 'Password must be at least 6 characters' });
            setSaving(false);
            return;
        }

        try {
            const response = await axios.post('/api/change-password', {
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                setSuccess('Password updated successfully!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: error.response?.data?.message || 'Failed to update password. Please check your current password.' });
            }
        } finally {
            setSaving(false);
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

    const exportData = async () => {
        try {
            // In production, this would export user data
            const data = {
                user: user,
                settings: {
                    notifications,
                    display,
                    security
                },
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `settings-export-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setSuccess('Settings exported successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setErrors({ general: 'Failed to export data. Please try again.' });
        }
    };

    const resetSettings = () => {
        if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            setNotifications({
                emailNotifications: true,
                smsNotifications: false,
                systemAlerts: true,
                reportReminders: true,
                profileUpdates: true
            });
            setDisplay({
                theme: 'light',
                language: 'en',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h',
                itemsPerPage: '10'
            });
            setSecurity({
                twoFactorAuth: false,
                sessionTimeout: '30',
                requirePasswordChange: false
            });
            localStorage.removeItem('notificationSettings');
            localStorage.removeItem('displaySettings');
            localStorage.removeItem('securitySettings');
            setSuccess('Settings reset to default!');
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleDeleteAccountChange = (e) => {
        const { name, value } = e.target;
        setDeleteAccountData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleting(true);
        setErrors({});
        setSuccess('');

        // Validate confirmation text
        if (deleteAccountData.confirmText !== 'DELETE') {
            setErrors({ confirmText: 'Please type DELETE to confirm' });
            setDeleting(false);
            return;
        }

        if (!deleteAccountData.password) {
            setErrors({ password: 'Password is required' });
            setDeleting(false);
            return;
        }

        try {
            const response = await axios.post('/api/delete-account', {
                password: deleteAccountData.password
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Account deleted successfully, redirect to home
                window.location.href = '/';
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: error.response?.data?.message || 'Failed to delete account. Please try again.' });
            }
        } finally {
            setDeleting(false);
        }
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
                            <a href="/dashboard" className="text-gray-800 hover:text-blue-600 transition">Dashboard</a>
                            <a href="/faculty" className="text-gray-800 hover:text-blue-600 transition">Faculty</a>
                            <a href="/students" className="text-gray-800 hover:text-blue-600 transition">Students</a>
                            <a href="/reports" className="text-gray-800 hover:text-blue-600 transition">Reports</a>
                            <a href="/settings" className="text-gray-800 hover:text-blue-600 transition font-semibold">Settings</a>
                            <a href="/profile" className="text-gray-800 hover:text-blue-600 transition">Profile</a>
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

            {/* Main Content */}
            <main className="relative flex-1">
                <img src="/images/background.png" alt="" className="hero-bg-img" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={exportData}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                            >
                                Export Settings
                            </button>
                            <button
                                onClick={resetSettings}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm"
                            >
                                Reset to Default
                            </button>
                        </div>
                    </div>

                    {success && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                            {success}
                        </div>
                    )}

                    {errors.general && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                            {errors.general}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Notification Settings */}
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Notification Preferences</h2>
                                <button
                                    onClick={() => saveSettings('notifications')}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-700">Email Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={notifications.emailNotifications}
                                        onChange={() => handleNotificationChange('emailNotifications')}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-700">SMS Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={notifications.smsNotifications}
                                        onChange={() => handleNotificationChange('smsNotifications')}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-700">System Alerts</span>
                                    <input
                                        type="checkbox"
                                        checked={notifications.systemAlerts}
                                        onChange={() => handleNotificationChange('systemAlerts')}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-700">Report Reminders</span>
                                    <input
                                        type="checkbox"
                                        checked={notifications.reportReminders}
                                        onChange={() => handleNotificationChange('reportReminders')}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-700">Profile Update Notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={notifications.profileUpdates}
                                        onChange={() => handleNotificationChange('profileUpdates')}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Display Settings */}
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Display Preferences</h2>
                                <button
                                    onClick={() => saveSettings('display')}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                                    <select
                                        value={display.theme}
                                        onChange={(e) => handleDisplayChange('theme', e.target.value)}
                                        className="w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="auto">Auto (System)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                    <select
                                        value={display.language}
                                        onChange={(e) => handleDisplayChange('language', e.target.value)}
                                        className="w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                                    <select
                                        value={display.dateFormat}
                                        onChange={(e) => handleDisplayChange('dateFormat', e.target.value)}
                                        className="w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                                    <select
                                        value={display.timeFormat}
                                        onChange={(e) => handleDisplayChange('timeFormat', e.target.value)}
                                        className="w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="12h">12 Hour</option>
                                        <option value="24h">24 Hour</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
                                    <select
                                        value={display.itemsPerPage}
                                        onChange={(e) => handleDisplayChange('itemsPerPage', e.target.value)}
                                        className="w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Security Settings</h2>
                                <button
                                    onClick={() => saveSettings('security')}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <span className="text-gray-700 font-medium">Two-Factor Authentication</span>
                                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={security.twoFactorAuth}
                                        onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                                    <select
                                        value={security.sessionTimeout}
                                        onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                                        className="w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="60">1 hour</option>
                                        <option value="120">2 hours</option>
                                        <option value="0">Never</option>
                                    </select>
                                </div>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <span className="text-gray-700 font-medium">Require Password Change</span>
                                        <p className="text-sm text-gray-500">Force password change on next login</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={security.requirePasswordChange}
                                        onChange={(e) => handleSecurityChange('requirePasswordChange', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Change Password */}
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full border rounded-md p-2"
                                        required
                                    />
                                    {errors.current_password && <p className="text-xs text-red-600 mt-1">{errors.current_password}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full border rounded-md p-2"
                                        required
                                        minLength={6}
                                    />
                                    {errors.new_password && <p className="text-xs text-red-600 mt-1">{errors.new_password}</p>}
                                    {errors.newPassword && <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full border rounded-md p-2"
                                        required
                                    />
                                    {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {saving ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>

                        {/* Account Information */}
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full border rounded-md p-2 bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
                                    <input
                                        type="text"
                                        value={new Date(user.created_at).toLocaleDateString()}
                                        disabled
                                        className="w-full border rounded-md p-2 bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Delete Account */}
                        <div className="bg-red-50/95 backdrop-blur-sm p-6 rounded-xl shadow-md border-2 border-red-300">
                            <h2 className="text-xl font-semibold text-red-800 mb-2">Danger Zone</h2>
                            <p className="text-sm text-red-700 mb-4">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            
                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
                                >
                                    Delete My Account
                                </button>
                            ) : (
                                <form onSubmit={handleDeleteAccount} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-red-800 mb-2">
                                            Enter your password to confirm
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={deleteAccountData.password}
                                            onChange={handleDeleteAccountChange}
                                            className="w-full border-2 border-red-300 rounded-md p-2 focus:border-red-500 focus:outline-none"
                                            placeholder="Enter your password"
                                            required
                                        />
                                        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-red-800 mb-2">
                                            Type <span className="font-bold">DELETE</span> to confirm
                                        </label>
                                        <input
                                            type="text"
                                            name="confirmText"
                                            value={deleteAccountData.confirmText}
                                            onChange={handleDeleteAccountChange}
                                            className="w-full border-2 border-red-300 rounded-md p-2 focus:border-red-500 focus:outline-none"
                                            placeholder="Type DELETE"
                                            required
                                        />
                                        {errors.confirmText && <p className="text-xs text-red-600 mt-1">{errors.confirmText}</p>}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={deleting}
                                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            {deleting ? 'Deleting...' : 'Permanently Delete Account'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteAccountData({ password: '', confirmText: '' });
                                                setErrors({});
                                            }}
                                            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
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

