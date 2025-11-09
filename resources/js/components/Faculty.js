import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Faculty() {
    const [user, setUser] = useState(null);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [showFacultyModal, setShowFacultyModal] = useState(false);

    const departments = [
        'Computer Studies',
        'Engineering',
        'Accountancy',
        'Business Ad',
        'Nursing',
        'Teachers Education',
        'Tourism and Hospitality Management',
        'Arts and Sciences',
        'Criminal Justice Education'
    ];

    useEffect(() => {
        fetchUser();
        fetchFaculty();
    }, []);

    useEffect(() => {
        fetchFaculty();
    }, [selectedDepartment]);

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

    const fetchFaculty = async (retryCount = 0) => {
        const maxRetries = 2;
        try {
            setLoading(true);
            const params = selectedDepartment ? { department: selectedDepartment } : {};
            const response = await axios.get('/api/faculty', {
                params,
                withCredentials: true
            });
            setFaculty(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching faculty:', error);
            if (error.response) {
                const status = error.response.status;
                if (status === 401 || status === 403) {
                    if (retryCount < maxRetries) {
                        setTimeout(() => fetchFaculty(retryCount + 1), 500);
                        return;
                    }
                    setLoading(false);
                    window.location.href = '/login';
                } else {
                    // For other errors, retry once
                    if (retryCount < maxRetries) {
                        setTimeout(() => fetchFaculty(retryCount + 1), 500);
                        return;
                    }
                    setLoading(false);
                }
            } else {
                // Network error - retry
                if (retryCount < maxRetries) {
                    setTimeout(() => fetchFaculty(retryCount + 1), 1000);
                    return;
                }
                setLoading(false);
            }
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
                            <a href="/settings" className="text-gray-800 hover:text-blue-600">Settings</a>
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
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Faculty</h1>

                    {/* Department Filter */}
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Teaching Department
                        </label>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full sm:w-auto border rounded-md p-2 bg-white"
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>
                        {selectedDepartment && (
                            <button
                                onClick={() => setSelectedDepartment('')}
                                className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>

                    {/* Faculty List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : faculty.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 text-center">
                            <p className="text-gray-600">
                                {selectedDepartment 
                                    ? `No faculty found in ${selectedDepartment} department.`
                                    : 'No faculty found.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {faculty.map((facultyMember) => (
                                <div
                                    key={facultyMember.id}
                                    className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer"
                                    onClick={() => handleViewFaculty(facultyMember.id)}
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
                                        <p><span className="font-medium">Mastery:</span> {facultyMember.mastery || 'N/A'}</p>
                                        <p><span className="font-medium">Years Teaching:</span> {facultyMember.years_teaching || 'N/A'}</p>
                                        <p><span className="font-medium">Email:</span> {facultyMember.email || 'N/A'}</p>
                                    </div>
                                    <button className="mt-4 w-full text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                                        View Profile
                                    </button>
                                </div>
                            ))}
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
                                    <label className="block text-sm font-medium text-gray-700">Graduated School</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.graduated_school || 'N/A'}</p>
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
                                    <label className="block text-sm font-medium text-gray-700">Mastery</label>
                                    <p className="mt-1 text-gray-900">{selectedFaculty.mastery || 'N/A'}</p>
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

