import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Students() {
    const [user, setUser] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
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
        course: '',
        year: '',
        department: ''
    });
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchUser();
        fetchStudents();
        fetchCoursesAndDepartments();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [selectedDepartment, selectedCourse, showArchived]);

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

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedDepartment) params.department = selectedDepartment;
            if (selectedCourse) params.course = selectedCourse;
            if (showArchived) params.archived = true;

            const response = await axios.get('/api/students', {
                params,
                withCredentials: true
            });
            setStudents(response.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCoursesAndDepartments = async () => {
        try {
            const [coursesRes, deptsRes] = await Promise.all([
                axios.get('/api/settings/courses/dropdown', { withCredentials: true }),
                axios.get('/api/settings/departments/dropdown', { withCredentials: true })
            ]);

            setCourses(coursesRes.data || []);
            setDepartments(deptsRes.data || []);
        } catch (error) {
            console.error('Error fetching courses/departments:', error);
            // Fallback to hardcoded values if API fails
            setCourses([
                { code: 'BSCS', name: 'Computer Science' },
                { code: 'BSIT', name: 'Information Technology' },
                // ...etc
            ]);
        }
    };

    const handleViewStudent = async (studentId) => {
        try {
            const response = await axios.get(`/api/students/${studentId}`, {
                withCredentials: true
            });
            setSelectedStudent(response.data);
            setShowStudentModal(true);
        } catch (error) {
            console.error('Error fetching student details:', error);
        }
    };

    const handleAddStudent = () => {
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
            course: '',
            year: '',
            department: ''
        });
        setShowAddModal(true);
    };

    const handleEditStudent = (student) => {
        setFormData({
            id: student.id,
            first_name: student.first_name || '',
            middle_name: student.middle_name || '',
            last_name: student.last_name || '',
            id_number: student.id_number || '',
            email: student.email || '',
            contact_number: student.contact_number || '',
            sex: student.sex || '',
            birthday: student.birthday || '',
            nationality: student.nationality || '',
            address: student.address || '',
            religion: student.religion || '',
            civil_status: student.civil_status || '',
            course: student.course || '',
            year: student.year || '',
            department: student.department || ''
        });
        setShowEditModal(true);
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/students', formData, { withCredentials: true });
            setShowAddModal(false);
            fetchStudents();
            alert('Student added successfully!');
        } catch (error) {
            console.error('Error adding student:', error);
            alert('Failed to add student. Please try again.');
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/students/${formData.id}`, formData, { withCredentials: true });
            setShowEditModal(false);
            fetchStudents();
            alert('Student updated successfully!');
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Failed to update student. Please try again.');
        }
    };

    const handleArchiveStudent = async (studentId) => {
        if (!confirm('Are you sure you want to archive this student?')) return;
        try {
            await axios.post(`/api/students/${studentId}/archive`, {}, { withCredentials: true });
            fetchStudents();
            alert('Student archived successfully!');
        } catch (error) {
            console.error('Error archiving student:', error);
            alert('Failed to archive student. Please try again.');
        }
    };

    const handleRestoreStudent = async (studentId) => {
        if (!confirm('Are you sure you want to restore this student?')) return;
        try {
            await axios.post(`/api/students/${studentId}/restore`, {}, { withCredentials: true });
            fetchStudents();
            alert('Student restored successfully!');
        } catch (error) {
            console.error('Error restoring student:', error);
            alert('Failed to restore student. Please try again.');
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

    const filteredStudents = students.filter(student => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            student.first_name?.toLowerCase().includes(query) ||
            student.middle_name?.toLowerCase().includes(query) ||
            student.last_name?.toLowerCase().includes(query) ||
            student.id_number?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query) ||
            student.course?.toLowerCase().includes(query) ||
            student.department?.toLowerCase().includes(query)
        );
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
                        <h1 className="text-3xl font-bold text-gray-800">Students</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                            >
                                {showArchived ? 'Show Active' : 'Show Archived'}
                            </button>
                            <button
                                onClick={handleAddStudent}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                            >
                                + Add Student
                            </button>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 mb-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Course Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Course
                                </label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full border rounded-md p-2 bg-white"
                                >
                                    <option value="">All Courses</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.code}>
                                            {course.code} - {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Department
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full border rounded-md p-2 bg-white"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Student
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full border rounded-md p-2 bg-white"
                                />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {(selectedCourse || selectedDepartment || searchQuery) && (
                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        setSelectedCourse('');
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

                    {/* Students List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 text-center">
                            <p className="text-gray-600">
                                {searchQuery || selectedCourse || selectedDepartment
                                    ? 'No students found matching your criteria.'
                                    : showArchived ? 'No archived students found.' : 'No students found.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4 text-sm text-gray-600">
                                Showing {filteredStudents.length} of {students.length} students
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <img
                                                src={student.profile_picture ? `/storage/${student.profile_picture}` : '/images/default-avatar.png'}
                                                alt={`${student.first_name} ${student.last_name}`}
                                                className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {student.first_name} {student.middle_name} {student.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{student.course || 'No Course'}</p>
                                                <p className="text-xs text-gray-400">{student.department || 'No Department'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-medium">ID Number:</span> {student.id_number || 'N/A'}</p>
                                            <p><span className="font-medium">Year:</span> {student.year || 'N/A'}</p>
                                            <p><span className="font-medium">Email:</span> {student.email || 'N/A'}</p>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleViewStudent(student.id)}
                                                className="text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditStudent(student)}
                                                className="text-sm px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
                                            >
                                                Edit
                                            </button>
                                            {showArchived ? (
                                                <button
                                                    onClick={() => handleRestoreStudent(student.id)}
                                                    className="col-span-2 text-sm px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                                >
                                                    Restore
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleArchiveStudent(student.id)}
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

            {/* Student Detail Modal */}
            {showStudentModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Student Profile</h2>
                            <button
                                onClick={() => {
                                    setShowStudentModal(false);
                                    setSelectedStudent(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-6 mb-6">
                                <img
                                    src={selectedStudent.profile_picture ? `/storage/${selectedStudent.profile_picture}` : '/images/default-avatar.png'}
                                    alt={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
                                    className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                                />
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.last_name}
                                    </h3>
                                    <p className="text-lg text-gray-600">{selectedStudent.department}</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Number</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.id_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sex</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.sex || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.contact_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Birthday</label>
                                    <p className="mt-1 text-gray-900">{formatBirthday(selectedStudent.birthday)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nationality</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.nationality || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Course</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.course || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Year</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.year || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Department</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.department || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Religion</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.religion || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Civil Status</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.civil_status || 'N/A'}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <p className="mt-1 text-gray-900">{selectedStudent.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowStudentModal(false);
                                    setSelectedStudent(null);
                                }}
                                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Add Student</h2>
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
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                                    <select required value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select Course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.code}>{course.code} - {course.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                                    <select required value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select Year</option>
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                    <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border rounded-md p-2" rows="3"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Student</h2>
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
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                                    <select required value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select Course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.code}>{course.code} - {course.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                                    <select required value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select Year</option>
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                    <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full border rounded-md p-2">
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border rounded-md p-2" rows="3"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update Student</button>
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

