import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Reports() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [filters, setFilters] = useState({
        department: '',
        year: '',
        role: '',
        course: ''
    });
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const reportTypes = [
        {
            id: 'student-enrollment',
            title: 'Student Report',
            description: 'Generate reports filtered by course for students',
            icon: '📊',
            category: 'Students'
        },
        {
            id: 'faculty-assignment',
            title: 'Faculty Report',
            description: 'Generate reports filtered by department for faculty',
            icon: '👨‍🏫',
            category: 'Faculty'
        },

    ];

    useEffect(() => {
        fetchUser();
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

    const generateReport = async (reportId) => {
        setGenerating(true);
        setReportData(null);
        setSelectedReport(reportTypes.find(r => r.id === reportId));

        try {
            // Simulate API call - in production, this would call your backend
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Fetch actual data based on report type
            let data = null;

            if (reportId === 'student-enrollment') {
                // Students filtered by course
                const params = {};
                if (filters.course) params.course = filters.course;
                if (filters.year) params.year = filters.year;

                const response = await axios.get('/api/students', {
                    params: params,
                    withCredentials: true
                });
                data = {
                    type: 'student-enrollment',
                    title: 'Student Enrollment Report',
                    generatedAt: new Date().toISOString(),
                    filters: { course: filters.course, year: filters.year },
                    data: response.data || [],
                    summary: {
                        total: response.data?.length || 0,
                        byCourse: groupByCourse(response.data || []),
                        byYear: groupByYear(response.data || []),
                        byDepartment: groupByDepartment(response.data || [])
                    }
                };
            } else if (reportId === 'faculty-assignment') {
                // Faculty filtered by department
                const params = {};
                if (filters.department) params.department = filters.department;

                const response = await axios.get('/api/faculty', {
                    params: params,
                    withCredentials: true
                });
                data = {
                    type: 'faculty-assignment',
                    title: 'Faculty Assignment Report',
                    generatedAt: new Date().toISOString(),
                    filters: { department: filters.department },
                    data: response.data || [],
                    summary: {
                        total: response.data?.length || 0,
                        byDepartment: groupFacultyByDepartment(response.data || [])
                    }
                };
            } else if (reportId === 'department-statistics') {
                const statsResponse = await axios.get('/api/dashboard/statistics', {
                    withCredentials: true
                });
                data = {
                    type: 'department-statistics',
                    title: 'Department Statistics Report',
                    generatedAt: new Date().toISOString(),
                    data: statsResponse.data || {}
                };
            } else if (reportId === 'year-level-distribution') {
                const statsResponse = await axios.get('/api/dashboard/statistics', {
                    withCredentials: true
                });
                data = {
                    type: 'year-level-distribution',
                    title: 'Year Level Distribution Report',
                    generatedAt: new Date().toISOString(),
                    data: statsResponse.data?.students_by_year || {}
                };
            } else {
                // Default report data
                data = {
                    type: reportId,
                    title: reportTypes.find(r => r.id === reportId)?.title || 'Report',
                    generatedAt: new Date().toISOString(),
                    filters: filters,
                    data: [],
                    message: 'This report type is coming soon!'
                };
            }

            setReportData(data);
        } catch (error) {
            console.error('Error generating report:', error);
            setReportData({
                type: reportId,
                title: reportTypes.find(r => r.id === reportId)?.title || 'Report',
                generatedAt: new Date().toISOString(),
                error: 'Failed to generate report. Please try again.'
            });
        } finally {
            setGenerating(false);
        }
    };

    const groupByCourse = (students) => {
        const grouped = {};
        students.forEach(student => {
            const course = student.course || 'Unknown';
            grouped[course] = (grouped[course] || 0) + 1;
        });
        return grouped;
    };

    const groupByDepartment = (students) => {
        const grouped = {};
        students.forEach(student => {
            const dept = student.department || 'Unknown';
            grouped[dept] = (grouped[dept] || 0) + 1;
        });
        return grouped;
    };

    const groupByYear = (students) => {
        const grouped = {};
        students.forEach(student => {
            const year = student.year || 'Unknown';
            grouped[year] = (grouped[year] || 0) + 1;
        });
        return grouped;
    };

    const groupFacultyByDepartment = (faculty) => {
        const grouped = {};
        faculty.forEach(f => {
            const dept = f.teaching_department || 'Unknown';
            grouped[dept] = (grouped[dept] || 0) + 1;
        });
        return grouped;
    };

    const exportReport = (format) => {
        if (!reportData) return;

        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const printReport = () => {
        if (!reportData) return;
        window.print();
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

    const formatReportDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                            <a href="/reports" className="text-gray-800 hover:text-blue-600 transition font-semibold">Reports</a>
                            <a href="/settings" className="text-gray-800 hover:text-blue-600 transition">System Settings</a>
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
                        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                        {reportData && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => exportReport('json')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                                >
                                    Export JSON
                                </button>
                                <button
                                    onClick={() => exportReport('csv')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={printReport}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm"
                                >
                                    Print Report
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Report Types Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 sticky top-24">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Report Types</h2>

                                {/* Filters */}
                                <div className="mb-4 space-y-3">
                                    {/* Show course filter for student reports */}
                                    {selectedReport?.id === 'student-enrollment' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                            <select
                                                value={filters.course}
                                                onChange={(e) => setFilters({...filters, course: e.target.value})}
                                                className="w-full border rounded-md p-2 bg-white text-sm"
                                            >
                                                <option value="">All Courses</option>
                                                <option value="BSCS">BSCS - Computer Science</option>
                                                <option value="BSIT">BSIT - Information Technology</option>
                                                <option value="BSCE">BSCE - Civil Engineering</option>
                                                <option value="BSEE">BSEE - Electrical Engineering</option>
                                                <option value="BSME">BSME - Mechanical Engineering</option>
                                                <option value="BSA">BSA - Accountancy</option>
                                                <option value="BSBA">BSBA - Business Administration</option>
                                                <option value="BSN">BSN - Nursing</option>
                                                <option value="BEED">BEED - Elementary Education</option>
                                                <option value="BSED">BSED - Secondary Education</option>
                                                <option value="BSTM">BSTM - Tourism Management</option>
                                                <option value="BSHM">BSHM - Hospitality Management</option>
                                                <option value="BSCrim">BSCrim - Criminology</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Show department filter for faculty reports */}
                                    {selectedReport?.id === 'faculty-assignment' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <select
                                                value={filters.department}
                                                onChange={(e) => setFilters({...filters, department: e.target.value})}
                                                className="w-full border rounded-md p-2 bg-white text-sm"
                                            >
                                                <option value="">All Departments</option>
                                                <option value="Computer Studies">Computer Studies</option>
                                                <option value="Engineering">Engineering</option>
                                                <option value="Accountancy">Accountancy</option>
                                                <option value="Business Ad">Business Ad</option>
                                                <option value="Nursing">Nursing</option>
                                                <option value="Teachers Education">Teachers Education</option>
                                                <option value="Tourism and Hospitality Management">Tourism and Hospitality Management</option>
                                                <option value="Arts and Sciences">Arts and Sciences</option>
                                                <option value="Criminal Justice Education">Criminal Justice Education</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Year filter only for student reports */}
                                    {selectedReport?.id === 'student-enrollment' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                                            <select
                                                value={filters.year}
                                                onChange={(e) => setFilters({...filters, year: e.target.value})}
                                                className="w-full border rounded-md p-2 bg-white text-sm"
                                            >
                                                <option value="">All Years</option>
                                                <option value="1">Year 1</option>
                                                <option value="2">Year 2</option>
                                                <option value="3">Year 3</option>
                                                <option value="4">Year 4</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {reportTypes.map((report) => (
                                        <button
                                            key={report.id}
                                            onClick={() => generateReport(report.id)}
                                            disabled={generating}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                                selectedReport?.id === report.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            } ${generating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{report.icon}</span>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800 text-sm">{report.title}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                                                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-200 rounded text-gray-600">
                                                        {report.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Report Content Area */}
                        <div className="lg:col-span-2">
                            {generating ? (
                                <div className="bg-white/95 backdrop-blur-sm p-12 rounded-xl shadow-md border border-gray-200 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Generating report...</p>
                                    <p className="text-sm text-gray-500 mt-2">Please wait while we compile your data</p>
                                </div>
                            ) : reportData ? (
                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200">
                                    {/* Report Header */}
                                    <div className="border-b border-gray-200 pb-4 mb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-800">{reportData.title}</h2>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Generated on {formatReportDate(reportData.generatedAt)}
                                                </p>
                                                {/* Show active filters */}
                                                {reportData.filters && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {reportData.filters.course && (
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                Course: {reportData.filters.course}
                                                            </span>
                                                        )}
                                                        {reportData.filters.department && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                                Department: {reportData.filters.department}
                                                            </span>
                                                        )}
                                                        {reportData.filters.year && (
                                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                                Year: {reportData.filters.year}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">Report ID</p>
                                                <p className="text-xs text-gray-500 font-mono">
                                                    {reportData.type}-{Date.now().toString().slice(-6)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Report Content */}
                                    {reportData.error ? (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                                            {reportData.error}
                                        </div>
                                    ) : reportData.message ? (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                                            {reportData.message}
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Summary Statistics */}
                                            {reportData.summary && (
                                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {reportData.summary.total !== undefined && (
                                                        <div className="bg-blue-50 p-4 rounded-lg">
                                                            <p className="text-sm text-gray-600">Total Records</p>
                                                            <p className="text-2xl font-bold text-blue-600">{reportData.summary.total}</p>
                                                        </div>
                                                    )}
                                                    {reportData.summary.byCourse && Object.keys(reportData.summary.byCourse).length > 0 && (
                                                        <div className="bg-green-50 p-4 rounded-lg">
                                                            <p className="text-sm text-gray-600">Courses</p>
                                                            <p className="text-2xl font-bold text-green-600">
                                                                {Object.keys(reportData.summary.byCourse).length}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {reportData.summary.byDepartment && Object.keys(reportData.summary.byDepartment).length > 0 && (
                                                        <div className="bg-purple-50 p-4 rounded-lg">
                                                            <p className="text-sm text-gray-600">Departments</p>
                                                            <p className="text-2xl font-bold text-purple-600">
                                                                {Object.keys(reportData.summary.byDepartment).length}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Course Breakdown (for student reports) */}
                                            {reportData.summary?.byCourse && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">By Course</h3>
                                                    <div className="space-y-2">
                                                        {Object.entries(reportData.summary.byCourse).map(([course, count]) => (
                                                            <div key={course} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                                <span className="text-gray-700">{course}</span>
                                                                <span className="font-semibold text-blue-600">{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Department Breakdown */}
                                            {reportData.summary?.byDepartment && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">By Department</h3>
                                                    <div className="space-y-2">
                                                        {Object.entries(reportData.summary.byDepartment).map(([dept, count]) => (
                                                            <div key={dept} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                                <span className="text-gray-700">{dept}</span>
                                                                <span className="font-semibold text-blue-600">{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Year Level Breakdown */}
                                            {reportData.summary?.byYear && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">By Year Level</h3>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {Object.entries(reportData.summary.byYear).map(([year, count]) => (
                                                            <div key={year} className="bg-gray-50 p-3 rounded-lg text-center">
                                                                <p className="text-sm text-gray-600">Year {year}</p>
                                                                <p className="text-xl font-bold text-blue-600">{count}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Statistics Data */}
                                            {reportData.data && typeof reportData.data === 'object' && !Array.isArray(reportData.data) && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Statistics</h3>
                                                    <div className="space-y-2">
                                                        {Object.entries(reportData.data).map(([key, value]) => (
                                                            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                                <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                                                                <span className="font-semibold text-blue-600">
                                                                    {typeof value === 'object' ? JSON.stringify(value) : value}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Data Table */}
                                            {reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Detailed Data</h3>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Number</th>
                                                                    {reportData.type === 'student-enrollment' && (
                                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                                                    )}
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {reportData.data.slice(0, 20).map((item, index) => (
                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                                            {item.first_name} {item.last_name}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                                            {item.id_number || 'N/A'}
                                                                        </td>
                                                                        {reportData.type === 'student-enrollment' && (
                                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                                {item.course || 'N/A'}
                                                                            </td>
                                                                        )}
                                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                                            {item.department || item.teaching_department || 'N/A'}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                                            {item.email || 'N/A'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        {reportData.data.length > 20 && (
                                                            <p className="text-sm text-gray-500 mt-2 text-center">
                                                                Showing first 20 of {reportData.data.length} records. Export to view all.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {reportData.data && Array.isArray(reportData.data) && reportData.data.length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    No data available for this report.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white/95 backdrop-blur-sm p-12 rounded-xl shadow-md border border-gray-200 text-center">
                                    <div className="text-6xl mb-4">📊</div>
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Select a Report</h2>
                                    <p className="text-gray-600">
                                        Choose a report type from the sidebar to generate and view detailed reports
                                    </p>
                                </div>
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
                @media print {
                    nav, .no-print {
                        display: none !important;
                    }
                    .hero-bg-img {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

