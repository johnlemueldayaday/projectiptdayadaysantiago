import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Settings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('courses'); // Default to courses tab

    // System Management States
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [formData, setFormData] = useState({});
    const [showArchived, setShowArchived] = useState(false);

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
        fetchDepartmentsForDropdown();
    }, []);

    useEffect(() => {
        if (activeTab === 'courses') fetchCourses();
        if (activeTab === 'departments') fetchDepartments();
        if (activeTab === 'academic-years') fetchAcademicYears();
    }, [activeTab, showArchived]);

    const fetchUser = async (retryCount = 0) => {
        const maxRetries = 2;
        try {
            const response = await axios.get('/api/user', {
                withCredentials: true
            });
            if (response.data && response.data.id) {
                // Check if user is admin
                if (response.data.role !== 'admin') {
                    window.location.href = '/dashboard';
                    return;
                }
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

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const params = showArchived ? { archived: 'true' } : {};
            const response = await axios.get('/api/settings/courses', { params, withCredentials: true });
            setCourses(response.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            // Set empty array if endpoint doesn't exist yet
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const params = showArchived ? { archived: 'true' } : {};
            const response = await axios.get('/api/settings/departments', { params, withCredentials: true });
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartmentsForDropdown = async () => {
        try {
            const response = await axios.get('/api/settings/departments/dropdown', { withCredentials: true });
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Error fetching departments for dropdown:', error);
        }
    };

    const fetchAcademicYears = async () => {
        try {
            setLoading(true);
            const params = showArchived ? { archived: 'true' } : {};
            const response = await axios.get('/api/settings/academic-years', { params, withCredentials: true });
            setAcademicYears(response.data || []);
        } catch (error) {
            console.error('Error fetching academic years:', error);
            setAcademicYears([]);
        } finally {
            setLoading(false);
        }
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

    // Modal handlers
    const handleAdd = (type) => {
        setModalType(type);
        setFormData({});
        setShowAddModal(true);
        setErrors({});
    };

    const handleEdit = (type, item) => {
        setModalType(type);
        setFormData(item);
        setShowEditModal(true);
        setErrors({});
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const endpoint = `/api/settings/${modalType === 'course' ? 'courses' : modalType === 'department' ? 'departments' : 'academic-years'}`;
            const response = await axios.post(endpoint, formData, { withCredentials: true });

            setShowAddModal(false);
            setSuccess(`${modalType.charAt(0).toUpperCase() + modalType.slice(1).replace('-', ' ')} added successfully!`);
            setTimeout(() => setSuccess(''), 3000);

            if (modalType === 'course') fetchCourses();
            else if (modalType === 'department') fetchDepartments();
            else fetchAcademicYears();
        } catch (error) {
            console.error('Error adding:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: error.response?.data?.message || 'Failed to add. Please try again.' });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const endpoint = `/api/settings/${modalType === 'course' ? 'courses' : modalType === 'department' ? 'departments' : 'academic-years'}/${formData.id}`;
            await axios.put(endpoint, formData, { withCredentials: true });

            setShowEditModal(false);
            setSuccess(`${modalType.charAt(0).toUpperCase() + modalType.slice(1).replace('-', ' ')} updated successfully!`);
            setTimeout(() => setSuccess(''), 3000);

            if (modalType === 'course') fetchCourses();
            else if (modalType === 'department') fetchDepartments();
            else fetchAcademicYears();
        } catch (error) {
            console.error('Error updating:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: error.response?.data?.message || 'Failed to update. Please try again.' });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (type, id) => {
        if (!confirm(`Are you sure you want to archive this ${type}?`)) return;

        try {
            const endpoint = `/api/settings/${type === 'course' ? 'courses' : type === 'department' ? 'departments' : 'academic-years'}/${id}/archive`;
            await axios.post(endpoint, {}, { withCredentials: true });

            setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} archived successfully!`);
            setTimeout(() => setSuccess(''), 3000);

            if (type === 'course') fetchCourses();
            else if (type === 'department') fetchDepartments();
            else fetchAcademicYears();
        } catch (error) {
            console.error('Error archiving:', error);
            setErrors({ general: error.response?.data?.message || 'Failed to archive. Please try again.' });
        }
    };

    const handleRestore = async (type, id) => {
        if (!confirm(`Are you sure you want to restore this ${type}?`)) return;

        try {
            const endpoint = `/api/settings/${type === 'course' ? 'courses' : type === 'department' ? 'departments' : 'academic-years'}/${id}/restore`;
            await axios.post(endpoint, {}, { withCredentials: true });

            setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} restored successfully!`);
            setTimeout(() => setSuccess(''), 3000);

            if (type === 'course') fetchCourses();
            else if (type === 'department') fetchDepartments();
            else fetchAcademicYears();
        } catch (error) {
            console.error('Error restoring:', error);
            setErrors({ general: error.response?.data?.message || 'Failed to restore. Please try again.' });
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
                            <a href="/settings" className="text-gray-800 hover:text-blue-600 transition font-semibold">System Settings</a>
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

            {/* Main Content */}
            <main className="relative flex-1">
                <img src="/images/background.png" alt="" className="hero-bg-img" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
                        {activeTab !== 'account' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm"
                                >
                                    {showArchived ? 'Show Active' : 'Show Archived'}
                                </button>
                                <button
                                    onClick={() => handleAdd(activeTab === 'courses' ? 'course' : activeTab === 'departments' ? 'department' : 'academic-year')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                                >
                                    + Add {activeTab === 'courses' ? 'Course' : activeTab === 'departments' ? 'Department' : 'Academic Year'}
                                </button>
                            </div>
                        )}
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

                    {/* Tabs */}
                    <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 p-2">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`px-4 py-2 rounded-lg transition ${activeTab === 'courses' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Courses
                            </button>
                            <button
                                onClick={() => setActiveTab('departments')}
                                className={`px-4 py-2 rounded-lg transition ${activeTab === 'departments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Departments
                            </button>
                            <button
                                onClick={() => setActiveTab('academic-years')}
                                className={`px-4 py-2 rounded-lg transition ${activeTab === 'academic-years' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Academic Years
                            </button>
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`px-4 py-2 rounded-lg transition ${activeTab === 'account' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Account Security
                            </button>
                        </div>
                    </div>

                    {/* Courses Tab */}
                    {activeTab === 'courses' && (
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                {showArchived ? 'Archived Courses' : 'Active Courses'}
                            </h2>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : courses.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    {showArchived ? 'No archived courses found.' : 'No courses found. Click "Add Course" to create one.'}
                                </p>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {courses.map((course) => (
                                        <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                            <h3 className="font-semibold text-gray-800 text-lg">{course.code}</h3>
                                            <p className="text-sm text-gray-600 mb-3">{course.name}</p>
                                            <p className="text-xs text-gray-500 mb-4">Department: {course.department}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit('course', course)}
                                                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                {showArchived ? (
                                                    <button
                                                        onClick={() => handleRestore('course', course.id)}
                                                        className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleArchive('course', course.id)}
                                                        className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                    >
                                                        Archive
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Departments Tab */}
                    {activeTab === 'departments' && (
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                {showArchived ? 'Archived Departments' : 'Active Departments'}
                            </h2>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : departments.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    {showArchived ? 'No archived departments found.' : 'No departments found. Click "Add Department" to create one.'}
                                </p>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {departments.map((dept) => (
                                        <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                            <h3 className="font-semibold text-gray-800 text-lg">{dept.name}</h3>
                                            <p className="text-sm text-gray-600 mb-4">{dept.description}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit('department', dept)}
                                                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                {showArchived ? (
                                                    <button
                                                        onClick={() => handleRestore('department', dept.id)}
                                                        className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleArchive('department', dept.id)}
                                                        className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                    >
                                                        Archive
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Academic Years Tab */}
                    {activeTab === 'academic-years' && (
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                {showArchived ? 'Archived Academic Years' : 'Active Academic Years'}
                            </h2>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : academicYears.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    {showArchived ? 'No archived academic years found.' : 'No academic years found. Click "Add Academic Year" to create one.'}
                                </p>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {academicYears.map((year) => (
                                        <div key={year.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                            <h3 className="font-semibold text-gray-800 text-lg">{year.year}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{year.semester}</p>
                                            <p className="text-xs text-gray-500 mb-4">
                                                {year.start_date} - {year.end_date}
                                            </p>
                                            {year.is_current && (
                                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded mb-3">
                                                    Current
                                                </span>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit('academic-year', year)}
                                                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                {showArchived ? (
                                                    <button
                                                        onClick={() => handleRestore('academic-year', year.id)}
                                                        className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleArchive('academic-year', year.id)}
                                                        className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                    >
                                                        Archive
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Account Security Tab */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
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
                    )}
                </div>
            </main>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">
                                Add {modalType === 'course' ? 'Course' : modalType === 'department' ? 'Department' : 'Academic Year'}
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
                            {modalType === 'course' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code || ''}
                                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                                            placeholder="e.g., BSCS, BSIT"
                                            className="w-full border rounded-md p-2"
                                        />
                                        {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="e.g., Computer Science"
                                            className="w-full border rounded-md p-2"
                                        />
                                        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                        <select
                                            required
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                                            className="w-full border rounded-md p-2 bg-white"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.name}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department[0]}</p>}
                                    </div>
                                </>
                            )}
                            {modalType === 'department' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="e.g., Computer Studies"
                                            className="w-full border rounded-md p-2"
                                        />
                                        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Brief description"
                                            className="w-full border rounded-md p-2"
                                            rows="3"
                                        />
                                    </div>
                                </>
                            )}
                            {modalType === 'academic-year' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.year || ''}
                                            onChange={(e) => setFormData({...formData, year: e.target.value})}
                                            placeholder="e.g., 2024-2025"
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                                        <select
                                            required
                                            value={formData.semester || ''}
                                            onChange={(e) => setFormData({...formData, semester: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        >
                                            <option value="">Select Semester</option>
                                            <option value="1st Semester">1st Semester</option>
                                            <option value="2nd Semester">2nd Semester</option>
                                            <option value="Summer">Summer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date || ''}
                                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date || ''}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_current || false}
                                                onChange={(e) => setFormData({...formData, is_current: e.target.checked})}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Set as current academic year</span>
                                        </label>
                                    </div>
                                </>
                            )}
                            {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {saving ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">
                                Edit {modalType === 'course' ? 'Course' : modalType === 'department' ? 'Department' : 'Academic Year'}
                            </h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
                            {modalType === 'course' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code || ''}
                                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        />
                                        {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        />
                                        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                        <select
                                            required
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                                            className="w-full border rounded-md p-2 bg-white"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.name}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department[0]}</p>}
                                    </div>
                                </>
                            )}
                            {modalType === 'department' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                            rows="3"
                                        />
                                    </div>
                                </>
                            )}
                            {modalType === 'academic-year' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.year || ''}
                                            onChange={(e) => setFormData({...formData, year: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                                        <select
                                            required
                                            value={formData.semester || ''}
                                            onChange={(e) => setFormData({...formData, semester: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        >
                                            <option value="">Select Semester</option>
                                            <option value="1st Semester">1st Semester</option>
                                            <option value="2nd Semester">2nd Semester</option>
                                            <option value="Summer">Summer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date || ''}
                                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date || ''}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_current || false}
                                                onChange={(e) => setFormData({...formData, is_current: e.target.checked})}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Set as current academic year</span>
                                        </label>
                                    </div>
                                </>
                            )}
                            {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

