import React, { useState } from 'react';
import axios from 'axios';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
            const response = await axios.post('/api/login', formData, {
                withCredentials: true
            });
            if (response.data.success) {
                // Wait a moment for session to be established
                await new Promise(resolve => setTimeout(resolve, 300));

                // Check if profile needs to be completed
                const needsProfile = response.data.needsProfile;
                const redirectPath = needsProfile ? '/profile' : '/home';

                // Trigger App.js routing by updating the path
                window.dispatchEvent(new CustomEvent('navigate', { detail: { path: redirectPath } }));

                // Also update the URL and trigger popstate
                window.history.pushState({}, '', redirectPath);
                window.dispatchEvent(new PopStateEvent('popstate'));

                // Fallback: use full reload if client-side navigation doesn't work
                setTimeout(() => {
                    if (window.location.pathname !== redirectPath) {
                        window.location.href = redirectPath;
                    }
                }, 500);
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ email: error.response?.data?.message || 'Invalid credentials.' });
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
            <a href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
                <img src="/images/ihs-logo.png" alt="IHS Logo"
                     className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain" />
            </a>

            {/* Login Card */}
            <div className="w-full max-w-6xl bg-white card-radius shadow-lg overflow-hidden flex flex-col lg:flex-row">
                {/* Left Panel (Info Section) */}
                <div className="hidden lg:flex lg:w-2/3 brand-blue text-white p-8 xl:p-12 flex-col gap-6">
                    <h2 className="text-3xl xl:text-4xl font-bold tracking-tight font-heading italic">IHS Admin</h2>

                    <div className="mt-2 text-sm leading-relaxed font-body">
                        <p className="mb-4">
                            Is this your first time here? Your username is your University ID and your default password is a
                            combination of your Last Name, in capital letters, and the last four (4) digits of your University ID number.
                        </p>

                        <p className="mb-3">
                            <strong>Example using University ID:</strong><br />
                            username: 2013001934<br />
                            password: LEE1934
                        </p>

                        <p className="mb-3">
                            <strong>Example using University email:</strong><br />
                            username: 2013001934@my.ihs.edu.ph<br />
                            password: LEE1934
                        </p>

                        <p className="mt-6 text-xs opacity-90">
                            Access IHS for Graduate degree programs: <a href="https://opisv2025.ihs.edu.ph" className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">opisv2025.ihs.edu.ph</a>.
                        </p>
                    </div>
                </div>

                {/* Right Panel (Login Form) */}
                <div className="w-full lg:w-1/3 p-6 sm:p-8 xl:p-10 bg-white font-ui">
                    {/* Login Header */}
                    <div className="mb-6">
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">Already have an account?</h3>
                        <p className="text-sm text-gray-500 mt-1">Sign in with your University ID or email</p>
                    </div>

                    {/* Login Form */}
                    <form method="POST" onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Email / Admin ID Input */}
                        <div>
                            <label className="sr-only" htmlFor="email">Admin ID / Email</label>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                <img src="/images/admin-icon.png" alt="Admin Icon" className="w-5 h-5 object-contain" />
                                <input
                                    id="email"
                                    name="email"
                                    type="text"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-transparent outline-none ml-3 text-sm sm:text-base"
                                    placeholder="Admin ID"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                        </div>

                        {/* Password Input */}
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

                        {/* Options Row */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="inline-flex items-center gap-2 text-gray-600">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={formData.remember}
                                    onChange={handleChange}
                                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                />
                                Remember username
                            </label>
                            <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-[#243b80] text-white font-semibold rounded-md hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'Log in'}
                            </button>
                        </div>

                        {/* Error Message */}
                        {Object.keys(errors).length > 0 && !errors.email && !errors.password && (
                            <div className="text-sm text-red-600">
                                {Object.values(errors)[0]}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Mobile Info Card */}
            <div className="lg:hidden max-w-6xl w-full mt-6">
                <div className="bg-[#243b80] text-white rounded-xl p-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-3">IHS Admin</h3>
                    <p className="text-sm sm:text-base mb-3">
                        Is this your first time here? Your username is your University ID and your default password is a
                        combination of your Last Name, in capital letters, and the last four (4) digits of your University ID number.
                    </p>
                    <p className="text-sm sm:text-base">
                        <strong>Example:</strong> username: 2013001934, password: LEE1934
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

                /* Responsive, professional logo sizing */
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
