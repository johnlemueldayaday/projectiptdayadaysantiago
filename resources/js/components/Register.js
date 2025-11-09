import React, { useState } from 'react';
import axios from 'axios';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post('/api/register', formData);
            if (response.data.success) {
                // Wait a moment for session to be established
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Always redirect to profile on first registration
                const redirectPath = '/profile';
                
                // Trigger App.js routing
                window.dispatchEvent(new CustomEvent('navigate', { detail: { path: redirectPath } }));
                window.history.pushState({}, '', redirectPath);
                window.dispatchEvent(new PopStateEvent('popstate'));
                
                // Fallback
                setTimeout(() => {
                    if (window.location.pathname !== redirectPath) {
                        window.location.href = redirectPath;
                    }
                }, 500);
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                // Handle validation errors
                const errorData = error.response.data.errors;
                const formattedErrors = {};
                
                // Format Laravel validation errors
                Object.keys(errorData).forEach(key => {
                    if (Array.isArray(errorData[key])) {
                        formattedErrors[key] = errorData[key][0];
                    } else {
                        formattedErrors[key] = errorData[key];
                    }
                });
                
                setErrors(formattedErrors);
            } else {
                setErrors({ 
                    general: error.response?.data?.message || 'Registration failed. Please try again.' 
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
            {/* Logo */}
            <a href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
                <img src="/images/ihs-logo.png" alt="IHS Logo"
                     className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain" />
            </a>

            {/* Register Card */}
            <div className="w-full max-w-6xl bg-white card-radius shadow-lg overflow-hidden flex flex-col lg:flex-row">
                {/* Left Panel (Info Section) */}
                <div className="hidden lg:flex lg:w-2/3 brand-blue text-white p-8 xl:p-12 flex-col gap-6">
                    <h2 className="text-3xl xl:text-4xl font-bold tracking-tight font-heading italic">IHS Admin</h2>

                    <div className="mt-2 text-sm leading-relaxed font-body">
                        <p className="mb-4">
                            Create your account to access the IHS Admin system. Make sure to use a valid University email or ID.
                        </p>

                        <p className="mb-3">
                            <strong>Password Policy:</strong><br />
                            Minimum of 6 characters. Use a mix of letters and numbers for security.
                        </p>

                        <p className="mt-6 text-xs opacity-90">
                            Access IHS for Graduate degree programs: <a href="https://opisv2025.ihs.edu.ph" className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">opisv2025.ihs.edu.ph</a>.
                        </p>
                    </div>
                </div>

                {/* Right Panel (Register Form) */}
                <div className="w-full lg:w-1/3 p-6 sm:p-8 xl:p-10 bg-white font-ui">
                    {/* Register Header */}
                    <div className="mb-6">
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">Create an Account</h3>
                        <p className="text-sm text-gray-500 mt-1">Fill in your details below to register</p>
                    </div>

                    {/* Register Form */}
                    <form method="POST" onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Name */}
                        <div>
                            <label className="sr-only" htmlFor="name">Full Name</label>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                <img src="/images/admin-icon.png" alt="Name Icon" className="w-5 h-5 object-contain" />
                                <input 
                                    id="name" 
                                    name="name" 
                                    type="text" 
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-transparent outline-none ml-3 text-sm sm:text-base"
                                    placeholder="Full Name"
                                />
                            </div>
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="sr-only" htmlFor="email">Email</label>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                <img src="/images/admin-icon.png" alt="Email Icon" className="w-5 h-5 object-contain" />
                                <input 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-transparent outline-none ml-3 text-sm sm:text-base"
                                    placeholder="Email"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="sr-only" htmlFor="password">Password</label>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                <img src="/images/password-icon.png" alt="Password Icon" className="w-5 h-5 object-contain" />
                                <input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-transparent outline-none ml-3 text-sm sm:text-base"
                                    placeholder="Password"
                                />
                            </div>
                            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="role" 
                                        value="student"
                                        checked={formData.role === 'student'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Student</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="role" 
                                        value="faculty"
                                        checked={formData.role === 'faculty'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Faculty</span>
                                </label>
                            </div>
                            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
                        </div>

                        {/* Submit */}
                        <div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-3 bg-[#243b80] text-white font-semibold rounded-md hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Registering...' : 'Register'}
                            </button>
                        </div>

                        {/* Error Message */}
                        {errors.general && (
                            <div className="text-sm text-red-600">
                                {errors.general}
                            </div>
                        )}
                    </form>

                    {/* Link to login */}
                    <div className="mt-4 text-sm text-gray-600 text-center">
                        Already have an account?
                        <a href="/login" className="text-blue-600 hover:underline ml-1">Log in</a>
                    </div>
                </div>
            </div>

            {/* Mobile Info Card */}
            <div className="lg:hidden max-w-6xl w-full mt-6">
                <div className="bg-[#243b80] text-white rounded-xl p-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-3">IHS Admin</h3>
                    <p className="text-sm sm:text-base">
                        Register with your University email or ID to access the Admin portal.
                    </p>
                </div>
            </div>

            <style>{`
                body {
                    font-family: 'Nunito', sans-serif;
                    background: #fbfbfe;
                }

                /* Brand Color */
                .brand-blue {
                    background: #243b80;
                }

                /* Card Radius */
                .card-radius {
                    border-radius: 1rem;
                }

                /* Font Groups */
                .font-heading {
                    font-family: 'Work Sans', 'Roboto', sans-serif;
                }

                .font-body {
                    font-family: 'Roboto', 'Nunito', sans-serif;
                }

                .font-ui {
                    font-family: 'Nunito', sans-serif;
                }

                /* Responsive Logo */
                .ihs-logo {
                    display: block;
                    width: 96px;
                    height: auto;
                    transition: width .18s ease, transform .18s ease;
                }
                @media (min-width: 640px) {
                    .ihs-logo { width: 120px; }
                }
                @media (min-width: 768px) {
                    .ihs-logo { width: 160px; }
                }
                @media (min-width: 1024px) {
                    .ihs-logo { width: 192px; }
                }
                @media (min-width: 1280px) {
                    .ihs-logo { width: 220px; }
                }
                .ihs-logo:hover { transform: scale(1.02); }
            `}</style>
        </div>
    );
}
