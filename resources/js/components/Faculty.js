import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Faculty() {
    const [user, setUser] = useState(null);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearchingFaculty, setIsSearchingFaculty] = useState(false);
    const fetchCancelSourceFaculty = useRef(null);
    const latestFacultyRequestId = useRef(0);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        id_number: '',
        email: '',
        contact_number: '',
        sex: '',
        birthday: '',
        nationality: '',
        address: '',
        religion: '',
        civil_status: '',
        teaching_department: '',
        years_teaching: '',
        year_graduated: ''
    });
    const [departments, setDepartments] = useState([]);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        fetchUser();
        fetchFaculty();
        fetchDepartments();

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        fetchFaculty();
    }, [selectedDepartment, showArchived]);

    // Debounced server-side search for faculty
    useEffect(() => {
        const delay = 350;
        const handler = setTimeout(() => {
            fetchFaculty(true);
        }, delay);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchUser = async (retryCount = 0) => {
        const maxRetries = 1; // Reduce retries
        try {
            const response = await axios.get('/api/user', {
                withCredentials: true
            });
            if (!isMountedRef.current) return;

            if (response.data && response.data.id) {
                setUser(response.data);
                setLoading(false);
            } else {
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        if (isMountedRef.current) fetchUser(retryCount + 1);
                    }, 300);
                    return;
                }
                // Don't redirect immediately, the interceptor will handle it
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        } catch (error) {
            if (!isMountedRef.current) return;

            if (error.response) {
                const status = error.response.status;
                if (status === 401 || status === 403 || status === 419) {
                    // Let the axios interceptor handle the redirect
                    if (isMountedRef.current) {
                        setLoading(false);
                    }
                } else {
                    if (isMountedRef.current) setLoading(false);
                }
            } else {
                if (isMountedRef.current) setLoading(false);
            }
        }
    };

    const fetchFaculty = async (silentOrRetry = false, maybeRetry) => {
        // silentOrRetry: boolean for silent mode OR number for retryCount
        let silent = false;
        let retryCount = 0;
        if (typeof silentOrRetry === 'boolean') {
            silent = silentOrRetry;
            retryCount = typeof maybeRetry === 'number' ? maybeRetry : 0;
        } else {
            retryCount = typeof silentOrRetry === 'number' ? silentOrRetry : 0;
        }

        const maxRetries = 1; // Reduce retries
        let requestId;
        try {
            if (isMountedRef.current) {
                if (!silent) setLoading(true);
                else setIsSearchingFaculty(true);
            }

            const params = {};
            if (selectedDepartment) params.department = selectedDepartment;
            if (showArchived) params.archived = true;
            if (searchQuery && searchQuery.trim() !== '') params.search = searchQuery.trim();

            // cancel previous
            if (fetchCancelSourceFaculty.current) {
                try { fetchCancelSourceFaculty.current.cancel('New faculty request'); } catch (c) {}
                fetchCancelSourceFaculty.current = null;
            }
            fetchCancelSourceFaculty.current = axios.CancelToken.source();

            latestFacultyRequestId.current += 1;
            requestId = latestFacultyRequestId.current;

            const response = await axios.get('/api/faculty', {
                params,
                withCredentials: true,
                cancelToken: fetchCancelSourceFaculty.current.token
            });

            if (!isMountedRef.current) return;

            if (requestId === latestFacultyRequestId.current) {
                setFaculty(response.data || []);
                fetchCancelSourceFaculty.current = null;
            } else {
                // stale response
            }
        } catch (error) {
            if (axios.isCancel && axios.isCancel(error)) {
                // ignore
            } else {
                console.error('Error fetching faculty:', error);
                if (!isMountedRef.current) return;
                if (isMountedRef.current && !silent) setLoading(false);
            }
        } finally {
            if (isMountedRef.current) {
                if (typeof requestId !== 'undefined') {
                    if (requestId === latestFacultyRequestId.current) {
                        setLoading(false);
                        setIsSearchingFaculty(false);
                    }
                } else {
                    setLoading(false);
                    setIsSearchingFaculty(false);
                }
            }
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('/api/settings/departments/dropdown', { withCredentials: true });
            if (isMountedRef.current) {
                setDepartments(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleViewFaculty = async (facultyId) => {
        try {
            const response = await axios.get(`/api/faculty/${facultyId}`, {
                withCredentials: true
            });
            setSelectedFaculty(response.data);
            setShowFacultyModal(true);
        } catch (error) {
            console.error('Error fetching faculty details:', error);
        }
    };

    const handleAddFaculty = () => {
        setFormData({
            first_name: '',
            middle_name: '',
            last_name: '',
            id_number: '',
            email: '',
            contact_number: '',
            sex: '',
            birthday: '',
            nationality: '',
            address: '',
            religion: '',
            civil_status: '',
            teaching_department: '',
            years_teaching: '',
            year_graduated: ''
        });
        setShowAddModal(true);
    };

    const handleEditFaculty = (facultyMember) => {
        setFormData({
            id: facultyMember.id,
            first_name: facultyMember.first_name || '',
            middle_name: facultyMember.middle_name || '',
            last_name: facultyMember.last_name || '',
            id_number: facultyMember.id_number || '',
            email: facultyMember.email || '',
            contact_number: facultyMember.contact_number || '',
            sex: facultyMember.sex || '',
            birthday: facultyMember.birthday || '',
            nationality: facultyMember.nationality || '',
            address: facultyMember.address || '',
            religion: facultyMember.religion || '',
            civil_status: facultyMember.civil_status || '',
            teaching_department: facultyMember.teaching_department || '',
            years_teaching: facultyMember.years_teaching || '',
            year_graduated: facultyMember.year_graduated || ''
        });
        setShowEditModal(true);
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/faculty', formData, { withCredentials: true });

            if (response.data.success) {
                setShowAddModal(false);
                fetchFaculty();
                alert('Faculty member added successfully!');
            }
        } catch (error) {
            console.error('Error adding faculty:', error);

            if (error.response?.data?.errors) {
                // Display validation errors
                const errors = error.response.data.errors;
                const errorMessages = Object.values(errors).flat().join('\n');
                alert('Validation errors:\n' + errorMessages);
            } else if (error.response?.data?.message) {
                alert('Error: ' + error.response.data.message);
            } else {
                alert('Failed to add faculty member. Please try again.');
            }
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`/api/faculty/${formData.id}`, formData, { withCredentials: true });

            if (response.data.success) {
                setShowEditModal(false);
                fetchFaculty();
                alert('Faculty member updated successfully!');
            }
        } catch (error) {
            console.error('Error updating faculty:', error);

            if (error.response?.data?.errors) {
                // Display validation errors
                const errors = error.response.data.errors;
                const errorMessages = Object.values(errors).flat().join('\n');
                alert('Validation errors:\n' + errorMessages);
            } else if (error.response?.data?.message) {
                alert('Error: ' + error.response.data.message);
            } else {
                alert('Failed to update faculty member. Please try again.');
            }
        }
    };

    const handleArchiveFaculty = async (facultyId) => {
        if (!confirm('Are you sure you want to archive this faculty member?')) return;
        try {
            await axios.post(`/api/faculty/${facultyId}/archive`, {}, { withCredentials: true });
            fetchFaculty();
            alert('Faculty member archived successfully!');
        } catch (error) {
            console.error('Error archiving faculty:', error);
            alert('Failed to archive faculty member. Please try again.');
        }
    };

    const handleRestoreFaculty = async (facultyId) => {
        if (!confirm('Are you sure you want to restore this faculty member?')) return;
        try {
            await axios.post(`/api/faculty/${facultyId}/restore`, {}, { withCredentials: true });
            fetchFaculty();
            alert('Faculty member restored successfully!');
        } catch (error) {
            console.error('Error restoring faculty:', error);
            alert('Failed to restore faculty member. Please try again.');
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

    const formatBirthday = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const filteredFaculty = faculty.filter(facultyMember => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase().trim();

        const first = facultyMember.first_name?.toLowerCase() || '';
        const middle = facultyMember.middle_name?.toLowerCase() || '';
        const last = facultyMember.last_name?.toLowerCase() || '';
        const idNumber = facultyMember.id_number?.toLowerCase() || '';
        const email = facultyMember.email?.toLowerCase() || '';
        const dept = facultyMember.teaching_department?.toLowerCase() || '';
        const mastery = facultyMember.mastery?.toLowerCase() || '';

        const fullName = [first, middle, last].filter(Boolean).join(' ').trim();
        const reversedFullName = [last, first].filter(Boolean).join(' ').trim();

        if (
            first.includes(query) ||
            middle.includes(query) ||
            last.includes(query) ||
            idNumber.includes(query) ||
            email.includes(query) ||
            dept.includes(query) ||
            mastery.includes(query) ||
            fullName.includes(query) ||
            reversedFullName.includes(query)
        ) {
            return true;
        }

        const tokens = query.split(/\s+/).filter(Boolean);
        if (tokens.length > 1) {
            return tokens.every(tok => (
                first.includes(tok) ||
                middle.includes(tok) ||
                last.includes(tok) ||
                idNumber.includes(tok) ||
                email.includes(tok) ||
                dept.includes(tok) ||
                mastery.includes(tok) ||
                fullName.includes(tok) ||
                reversedFullName.includes(tok)
            ));
        }

        return false;
    });

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
                            <a href="/faculty" className="text-gray-800 hover:text-blue-600">Faculty</a>
                            <a href="/students" className="text-gray-800 hover:text-blue-600">Students</a>
                            <a href="/reports" className="text-gray-800 hover:text-blue-600">Reports</a>
                            <a href="/settings" className="text-gray-800 hover:text-blue-600">System Settings</a>

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
                        <h1 className="text-3xl font-bold text-gray-800">Faculty</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                            >
                                {showArchived ? 'Show Active' : 'Show Archived'}
                            </button>
                            <button
                                onClick={handleAddFaculty}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                            >
                                + Add Faculty
                            </button>
                        </div>
                    </div>

                    {/* Filter and Search */}
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 mb-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Teaching Department
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full border rounded-md p-2 bg-white"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept.name} value={dept.name}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Faculty
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name, ID, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full border rounded-md p-2 bg-white pr-10"
                                    />
                                    {isSearchingFaculty && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {(selectedDepartment || searchQuery) && (
                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        setSelectedDepartment('');
                                        setSearchQuery('');
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Faculty List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredFaculty.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 text-center">
                            <p className="text-gray-600">
                                {searchQuery || selectedDepartment
                                    ? 'No faculty found matching your criteria.'
                                    : showArchived ? 'No archived faculty found.' : 'No faculty found.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4 text-sm text-gray-600">
                                Showing {filteredFaculty.length} of {faculty.length} faculty members
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredFaculty.map((facultyMember) => (
                                    <div
                                        key={facultyMember.id}
                                        className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <img
                                                src={facultyMember.profile_picture ? `/storage/${facultyMember.profile_picture}` : '/images/default-avatar.png'}
                                                alt={`${facultyMember.first_name} ${facultyMember.last_name}`}
                                                className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {facultyMember.first_name} {facultyMember.middle_name} {facultyMember.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{facultyMember.teaching_department || 'No Department'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-medium">ID Number:</span> {facultyMember.id_number || 'N/A'}</p>
                                            <p><span className="font-medium">Years Teaching:</span> {facultyMember.years_teaching || 'N/A'}</p>
                                            <p><span className="font-medium">Email:</span> {facultyMember.email || 'N/A'}</p>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleViewFaculty(facultyMember.id)}
                                                className="text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditFaculty(facultyMember)}
                                                className="text-sm px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
                                            >
                                                Edit
                                            </button>
                                            {showArchived ? (
                                                <button
                                                    onClick={() => handleRestoreFaculty(facultyMember.id)}
                                                    className="col-span-2 text-sm px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                                >
                                                    Restore
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleArchiveFaculty(facultyMember.id)}
                                                    className="col-span-2 text-sm px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                                                >
                                                    Archive
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Faculty Detail Modal */}
            {showFacultyModal && selectedFaculty && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Faculty Profile</h2>
                            <button
                                onClick={() => {
                                    setShowFacultyModal(false);
                                    setSelectedFaculty(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-6 mb-6">
                                <img
                                    src={selectedFaculty.profile_picture ? `/storage/${selectedFaculty.profile_picture}` : '/images/default-avatar.png'}
                                    alt={`${selectedFaculty.first_name} ${selectedFaculty.last_name}`}
                                    className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                                />
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {selectedFaculty.first_name} {selectedFaculty.middle_name} {selectedFaculty.last_name}
                                    </h3>
                                    <p className="text-lg text-gray-600">{selectedFaculty.teaching_department || 'No Department'}</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Number</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.id_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sex</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.sex || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.contact_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Birthday</label>
                                    <p className="mt-1 text-gray-900">{formatBirthday(selectedFaculty.birthday)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nationality</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.nationality || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Year Graduated</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.year_graduated || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Years of Teaching</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.years_teaching || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Teaching Department</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.teaching_department || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Religion</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.religion || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Civil Status</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.civil_status || 'N/A'}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowFacultyModal(false);
                                    setSelectedFaculty(null);
                                }}
                                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Faculty Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Add Faculty Member</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmitAdd} className="p-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                                    <input type="text" value={formData.middle_name} onChange={(e) => setFormData({...formData, middle_name: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
                                    <input type="text" required value={formData.id_number} onChange={(e) => setFormData({...formData, id_number: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input type="text" value={formData.contact_number} onChange={(e) => setFormData({...formData, contact_number: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                                    <select value={formData.sex} onChange={(e) => setFormData({...formData, sex: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                                    <input type="date" value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                                    <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                                    <input type="text" value={formData.religion} onChange={(e) => setFormData({...formData, religion: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                                    <select value={formData.civil_status} onChange={(e) => setFormData({...formData, civil_status: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Department *</label>
                                    <select required value={formData.teaching_department} onChange={(e) => setFormData({...formData, teaching_department: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.name} value={dept.name}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Years Teaching</label>
                                    <input type="number" value={formData.years_teaching} onChange={(e) => setFormData({...formData, years_teaching: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Graduated</label>
                                    <input type="number" value={formData.year_graduated} onChange={(e) => setFormData({...formData, year_graduated: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border rounded-md p-2" rows="3"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add Faculty</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Faculty Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Faculty Member</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmitEdit} className="p-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                                    <input type="text" value={formData.middle_name} onChange={(e) => setFormData({...formData, middle_name: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
                                    <input type="text" required value={formData.id_number} onChange={(e) => setFormData({...formData, id_number: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input type="text" value={formData.contact_number} onChange={(e) => setFormData({...formData, contact_number: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                                    <select value={formData.sex} onChange={(e) => setFormData({...formData, sex: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                                    <input type="date" value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                                    <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                                    <input type="text" value={formData.religion} onChange={(e) => setFormData({...formData, religion: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                                    <select value={formData.civil_status} onChange={(e) => setFormData({...formData, civil_status: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Department *</label>
                                    <select required value={formData.teaching_department} onChange={(e) => setFormData({...formData, teaching_department: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.name} value={dept.name}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Years Teaching</label>
                                    <input type="number" value={formData.years_teaching} onChange={(e) => setFormData({...formData, years_teaching: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Graduated</label>
                                    <input type="number" value={formData.year_graduated} onChange={(e) => setFormData({...formData, year_graduated: e.target.value})} className="w-full border rounded-md p-2" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border rounded-md p-2" rows="3"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update Faculty</button>
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

