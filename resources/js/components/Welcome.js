import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Welcome() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false });
    const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'student' });
    const [errors, setErrors] = useState({});

    const slides = [
        '/images/image-1.png',
        '/images/image-2.png',
        '/images/image-3.png'
    ];

    useEffect(() => {
        checkAuth();
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkAuth = async () => {
        try {
            const response = await axios.get('/api/user');
            setIsAuthenticated(!!response.data);
        } catch (error) {
            setIsAuthenticated(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/login', loginForm);
            if (response.data.success) {
                const needsProfile = response.data.needsProfile;
                const redirectPath = needsProfile ? '/profile' : '/home';
                window.location.href = redirectPath;
            }
        } catch (error) {
            setErrors(error.response?.data?.errors || { email: 'Invalid credentials.' });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/register', registerForm);
            if (response.data.success) {
                // Always redirect to profile on first registration
                window.location.href = '/profile';
            }
        } catch (error) {
            setErrors(error.response?.data?.errors || {});
        }
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/logout');
            setIsAuthenticated(false);
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                            <img src="/images/school_logo.png" alt="School Logo" className="h-14 w-auto object-contain" />
                            <span className="text-2xl font-bold text-gray-800 pl-14">International Horizon School</span>
                        </div>

                        {isAuthenticated && (
                            <>
                                <div className="flex items-center gap-10 text-lg font-medium">
                                    <a href="/dashboard" className="text-gray-800 hover:text-blue-600">Dashboard</a>
                                    <a href="#" className="text-gray-800 hover:text-blue-600">Faculty</a>
                                    <a href="#" className="text-gray-800 hover:text-blue-600">Students</a>
                                    <a href="#" className="text-gray-800 hover:text-blue-600">Reports</a>
                                    <a href="#" className="text-gray-800 hover:text-blue-600">Settings</a>

                                </div>
                                <div>
                                    <form method="POST" action="/api/logout" onSubmit={handleLogout}>
                                        <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                                        <button type="submit" className="px-4 py-2 bg-[#243b80] text-white rounded-md hover:bg-red-700 transition">
                                            Logout
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative">
                <div className="relative hero-wrap overflow-hidden">
                    <img src="/images/welcomebackground.png" alt="" className="hero-bg-img" />
                    {!isAuthenticated && (
                        <div className="relative z-30 w-full px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                                <div className="flex-1 flex flex-col md:flex-row gap-6">
                                    <div className="hidden md:flex flex-col gap-4">
                                        <img src="/images/thumb-1.png" alt="Thumbnail 1" className="max-w-full object-contain rounded-lg shadow-md cursor-pointer hover:opacity-80 transition" />
                                        <img src="/images/thumb-2.png" alt="Thumbnail 2" className="max-w-full object-contain rounded-lg shadow-md cursor-pointer hover:opacity-80 transition" />
                                        <img src="/images/thumb-3.png" alt="Thumbnail 3" className="max-w-full object-contain rounded-lg shadow-md cursor-pointer hover:opacity-80 transition" />
                                        <img src="/images/thumb-4.png" alt="Thumbnail 4" className="max-w-full object-contain rounded-lg shadow-md cursor-pointer hover:opacity-80 transition" />
                                        <img src="/images/thumb-5.png" alt="Thumbnail 5" className="max-w-full object-contain rounded-lg shadow-md cursor-pointer hover:opacity-80 transition" />
                                    </div>

                                    <div className="flex-1 relative">
                                        <div className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px] overflow-hidden rounded-xl shadow-xl z-10" id="carousel">
                                            {slides.map((slide, index) => (
                                                <div
                                                    key={index}
                                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                                        index === currentSlide ? 'opacity-100 z-20' : 'opacity-0 z-10'
                                                    }`}
                                                >
                                                    <img src={slide} className="w-full h-full object-cover" alt={`Slide ${index + 1}`} />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-2 z-30">
                                            {slides.map((_, index) => (
                                                <button
                                                    key={index}
                                                    className={`w-3 h-3 rounded-full transition ${
                                                        index === currentSlide ? 'bg-white/70' : 'bg-white/40'
                                                    }`}
                                                    onClick={() => goToSlide(index)}
                                                    aria-label={`Slide ${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
                                    {/* Login/Signup */}
                                    <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-gray-100 p-5">
                                        <h4 className="text-lg font-semibold text-gray-800">Get started</h4>
                                        <p className="text-sm text-gray-500 mt-1">Create an account or sign in to access the registrar tools.</p>
                                        <div className="mt-4 flex flex-col gap-3">
                                            <a href="/register" className="block text-center py-2 px-3 rounded-md bg-[#243b80] text-white font-medium hover:bg-[#21346a] transition">Sign up</a>
                                            <a href="/login" className="block text-center py-2 px-3 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-yellow-500 hover:text-white hover:border-yellow-500 transition duration-300 ease-in-out">
                                                Log in
                                            </a>
                                            <a href="/admin-login" className="block text-center py-2 px-3 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 transition duration-300 ease-in-out">
                                                Admin Login
                                            </a>
                                        </div>
                                    </div>
                                    {/* News */}
                                    <div className="bg-gray-100 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="px-4 py-2 border-b border-gray-300 bg-gray-200 rounded-t-lg">
                                            <h5 className="text-sm font-bold text-gray-700 tracking-wide">NEWS / EVENTS</h5>
                                        </div>
                                        <div className="p-4 bg-white rounded-b-lg">
                                            <h6 className="text-sm font-semibold text-gray-800">
                                                Proposed Change in Tuition and Other School Fees for Academic Year 2025-2026 in the Basic Education Department
                                            </h6>
                                            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                                IHS's mission is to provide access to quality and relevant education. The university remains committed
                                                to keeping education affordable while ensuring that students receive the best possible learning experience.
                                                To maintain academic excellence, attract and retain qualified faculty, and improve learning resources,
                                                IHS proposed to implement a reasonable change...
                                            </p>
                                            <a href="#" className="block mt-2 text-xs text-blue-600 hover:underline">Read more</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#243b80] text-white mt-0">
                <div className="max-w-9xl mx-auto px-6 lg:px-34 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">About IHS Portal</h3>
                            <p className="text-sm text-gray-200 leading-relaxed">
                                The IHS Portal provides students, faculty, and administrators with easy access
                                to registrar tools, resources, and announcements. Our mission is to deliver efficiency and transparency in academic services.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/dashboard" className="hover:underline">Dashboard</a></li>
                                <li><a href="#" className="hover:underline">Faculty</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
                            <p className="text-sm text-gray-200">935 International Horizon School, Cebu, Canada</p>
                            <p className="text-sm text-gray-200 mt-1">Email: greatestloveofall.ihs.edu</p>
                            <p className="text-sm text-gray-200">Phone: (+63) 923-69693</p>
                        </div>
                    </div>
                    <div className="border-t border-white/20 mt-8 pt-4 text-center text-xs text-gray-300">
                        © {new Date().getFullYear()} IHS Portal. All rights reserved.
                    </div>
                </div>
            </footer>

            <style>{`
                :root { --nav-h: 64px; }
                .hero-wrap {
                }
                .hero-bg-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: blur(6px) brightness(0.85);
                    z-index: 0;
                }
            `}</style>
        </div>
    );
}
