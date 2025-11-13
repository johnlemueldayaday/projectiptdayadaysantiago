import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AccountProfile() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [errors, setErrors] = useState({});
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Year options
    const years = ['1', '2', '3', '4'];

    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        sex: 'Male',
        nationality: '',
        id_number: '',
        contact_number: '',
        address: '',
        religion: '',
        civil_status: '',
        email: '',
        birthday: '',
        course: '',
        year: '',
        department: '',
        // Faculty fields
        year_graduated: '',
        years_teaching: '',
        teaching_department: ''
    });

    const religions = [
        'Catholic',
        'Protestant',
        'Islam',
        'Buddhism',
        'Hinduism',
        'Other',
        'None'
    ];

    const civilStatuses = [
        'Single',
        'Married',
        'Divorced',
        'Widowed',
        'Separated'
    ];

    useEffect(() => {
        fetchUser();
        fetchProfile();
        fetchCoursesAndDepartments();
    }, []);

    const fetchUser = async (retryCount = 0) => {
        const maxRetries = 2;
        try {
            const response = await axios.get('/api/user', {
                withCredentials: true
            });
            if (response.data && response.data.id) {
                // Redirect admin users to admin profile
                if (response.data.role === 'admin') {
                    window.location.href = '/profile';
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

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/profile', {
                withCredentials: true
            });
            if (response.data) {
                setProfile(response.data);
                setFormData({
                    first_name: response.data.first_name || '',
                    middle_name: response.data.middle_name || '',
                    last_name: response.data.last_name || '',
                    sex: response.data.sex || 'Male',
                    nationality: response.data.nationality || '',
                    id_number: response.data.id_number || '',
                    contact_number: response.data.contact_number || '',
                    address: response.data.address || '',
                    religion: response.data.religion || '',
                    civil_status: response.data.civil_status || '',
                    email: response.data.email || '',
                    birthday: response.data.birthday || '',
                    course: response.data.course || '',
                    year: response.data.year || '',
                    department: response.data.department || '',
                    // Faculty fields
                    year_graduated: response.data.year_graduated || '',
                    years_teaching: response.data.years_teaching || '',
                    teaching_department: response.data.teaching_department || ''
                });
                // Use profile_picture_url if available, otherwise construct from profile_picture path
                if (response.data.profile_picture_url) {
                    setProfilePicturePreview(response.data.profile_picture_url);
                } else if (response.data.profile_picture) {
                    setProfilePicturePreview(`/storage/${response.data.profile_picture}`);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
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
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            const fileType = file.type.toLowerCase();

            if (!validTypes.includes(fileType)) {
                setErrors({ profile_picture: 'Please upload a PNG or JPEG image file.' });
                e.target.value = ''; // Clear the input
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                setErrors({ profile_picture: 'File size must be less than 5MB.' });
                e.target.value = ''; // Clear the input
                return;
            }

            // Clear any previous errors
            if (errors.profile_picture) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.profile_picture;
                    return newErrors;
                });
            }

            setProfilePicture(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setSuccess('');

        try {
            const formDataToSend = new FormData();

            // Append all form fields (send empty strings for empty fields)
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key] || '');
            });

            // Append role if profile exists and has a role
            if (profile && profile.role) {
                formDataToSend.append('role', profile.role);
            }

            // Append profile picture if selected
            if (profilePicture) {
                formDataToSend.append('profile_picture', profilePicture);
            }

            // Get CSRF token from meta tag or axios defaults
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const token = csrfToken || window.axios?.defaults?.headers?.common?.['X-CSRF-TOKEN'] || '';

            // Don't set Content-Type for FormData - let browser set it with boundary
            const headers = {
                'X-Requested-With': 'XMLHttpRequest'
            };

            // Only add CSRF token if it exists (though api/* routes are excluded)
            if (token) {
                headers['X-CSRF-TOKEN'] = token;
            }

            const response = await axios.post('/api/profile', formDataToSend, {
                headers: headers,
                withCredentials: true
            });

            if (response.data.success) {
                setSuccess(response.data.message || 'Profile updated successfully!');
                setProfile(response.data.profile);
                // Update preview if new picture was uploaded
                if (response.data.profile.profile_picture_url) {
                    setProfilePicturePreview(response.data.profile.profile_picture_url);
                } else if (response.data.profile.profile_picture) {
                    setProfilePicturePreview(`/storage/${response.data.profile.profile_picture}`);
                }
                setProfilePicture(null);

                // Clear success message after 5 seconds
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            console.error('Error response:', error.response);
            console.error('Error data:', error.response?.data);

            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 401 || status === 403) {
                    // Check if it's a real authentication error or just a session issue
                    const errorMessage = errorData?.message || errorData?.error || 'Your session has expired. Please log in again.';
                    setErrors({ general: errorMessage });

                    // Only redirect if it's a confirmed authentication error
                    // Give user a chance to see the error first
                    setTimeout(() => {
                        // Re-check authentication before redirecting
                        axios.get('/api/user', { withCredentials: true })
                            .then(() => {
                                // Still authenticated, don't redirect - might be a different issue
                                setErrors({ general: 'Update failed. Please try again or refresh the page.' });
                            })
                            .catch(() => {
                                // Confirmed not authenticated, redirect
                                window.location.href = '/login';
                            });
                    }, 3000);
                } else if (errorData?.errors) {
                    // Validation errors
                    setErrors(errorData.errors);
                } else {
                    // Other errors
                    setErrors({ general: errorData?.message || errorData?.error || 'Failed to update profile. Please try again.' });
                }
            } else {
                // Network error
                setErrors({ general: 'Network error. Please check your connection and try again.' });
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

    if (loading) {
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

            {/* Profile Content */}
            <main className="relative flex-1">
                <img src="/images/background.png" alt="" className="hero-bg-img" />

                <div className="relative z-15 max-w-6xl mx-auto px-2 py-5">
                    {success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>
                    )}

                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{errors.general}</div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-200 space-y-4">
                        {/* Profile Picture */}
                        <div className="flex items-center gap-4 mb-6">
                            <img
                                src={profilePicturePreview || '/images/default-avatar.png'}
                                alt="Profile"
                                className="h-20 w-20 rounded-full object-cover border"
                                onError={(e) => {
                                    e.target.src = '/images/default-avatar.png';
                                }}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Change Profile Picture</label>
                                <input
                                    type="file"
                                    name="profile_picture"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-1">Accepted formats: PNG, JPEG (Max 5MB)</p>
                                {errors.profile_picture && (
                                    <p className="text-xs text-red-600 mt-1">{errors.profile_picture}</p>
                                )}
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md p-2"
                                />
                                {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Middle Name</label>
                                <input
                                    type="text"
                                    name="middle_name"
                                    value={formData.middle_name}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md p-2"
                                />
                                {errors.middle_name && <p className="text-xs text-red-600 mt-1">{errors.middle_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md p-2"
                                />
                                {errors.last_name && <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>}
                            </div>
                        </div>

                        {/* Other Details */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Sex</label>
                                <select
                                    name="sex"
                                    value={formData.sex}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md p-2"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                {errors.sex && <p className="text-xs text-red-600 mt-1">{errors.sex}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Nationality</label>
                                <input
                                    type="text"
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md p-2"
                                />
                                {errors.nationality && <p className="text-xs text-red-600 mt-1">{errors.nationality}</p>}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">ID Number</label>
                                <input
                                    type="text"
                                    name="id_number"
                                    value={formData.id_number}
                                    readOnly
                                    className="mt-1 w-full border rounded-md p-2 bg-gray-100 cursor-not-allowed"
                                    title="Auto-generated ID number"
                                />
                                <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                                {errors.id_number && <p className="text-xs text-red-600 mt-1">{errors.id_number}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Contact Number</label>
                                <input
                                    type="text"
                                    name="contact_number"
                                    value={formData.contact_number}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md p-2"
                                />
                                {errors.contact_number && <p className="text-xs text-red-600 mt-1">{errors.contact_number}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="mt-1 w-full border rounded-md p-2"
                            />
                            {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Religion</label>
                                <select
                                    name="religion"
                                    value={formData.religion}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md p-2 bg-white"
                                >
                                    <option value="">Select Religion</option>
                                    {religions.map((religion) => (
                                        <option key={religion} value={religion}>
                                            {religion}
                                        </option>
                                    ))}
                                </select>
                                {errors.religion && <p className="text-xs text-red-600 mt-1">{errors.religion}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Civil Status</label>
                                <select
                                    name="civil_status"
                                    value={formData.civil_status}
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-md p-2 bg-white"
                                >
                                    <option value="">Select Civil Status</option>
                                    {civilStatuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                {errors.civil_status && <p className="text-xs text-red-600 mt-1">{errors.civil_status}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 w-full border rounded-md p-2"
                            />
                            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Birthday</label>
                            <input
                                type="date"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleChange}
                                className="mt-1 w-full border rounded-md p-2"
                            />
                            {errors.birthday && <p className="text-xs text-red-600 mt-1">{errors.birthday}</p>}
                        </div>

                        {/* Role-specific fields */}
                        {profile && profile.role === 'faculty' ? (
                            <>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium">Year Graduated</label>
                                        <input
                                            type="text"
                                            name="year_graduated"
                                            value={formData.year_graduated}
                                            onChange={handleChange}
                                            placeholder="e.g., 2010"
                                            className="mt-1 w-full border rounded-md p-2"
                                        />
                                        {errors.year_graduated && <p className="text-xs text-red-600 mt-1">{errors.year_graduated}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Years of Teaching</label>
                                        <input
                                            type="number"
                                            name="years_teaching"
                                            value={formData.years_teaching}
                                            onChange={handleChange}
                                            placeholder="Number of years"
                                            min="0"
                                            className="mt-1 w-full border rounded-md p-2"
                                        />
                                        {errors.years_teaching && <p className="text-xs text-red-600 mt-1">{errors.years_teaching}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Teaching Department</label>
                                    <select
                                        name="teaching_department"
                                        value={formData.teaching_department}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                                        ))}
                                    </select>
                                    {errors.teaching_department && <p className="text-xs text-red-600 mt-1">{errors.teaching_department}</p>}
                                </div>
                            </>
                        ) : (
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Course</label>
                                    <input
                                        type="text"
                                        name="course"
                                        value={formData.course}
                                        onChange={handleChange}
                                        placeholder="e.g., BSIT, BSCS, etc."
                                        className="mt-1 w-full border rounded-md p-2"
                                        list="course-list"
                                    />
                                    <datalist id="course-list">
                                        {courses.map(course => (
                                            <option key={course.id} value={course.code}>{course.name}</option>
                                        ))}
                                    </datalist>
                                    {errors.course && <p className="text-xs text-red-600 mt-1">{errors.course}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Year</label>
                                    <select
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="">Select Year</option>
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.year && <p className="text-xs text-red-600 mt-1">{errors.year}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Department</label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded-md p-2 bg-white"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                                        ))}
                                    </select>
                                    {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
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

