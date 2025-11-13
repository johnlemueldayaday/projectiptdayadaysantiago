import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
    const [user, setUser] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    const slides = [
        '/images/image-1.png',
        '/images/image-2.png',
        '/images/image-3.png',
        '/images/image-4.png'
    ];

    useEffect(() => {
        fetchUser();

        // Auto-slide carousel
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUser = async (retryCount = 0) => {
        const maxRetries = 2;
        try {
            // Make sure we include credentials for session-based auth
            const response = await axios.get('/api/user', {
                withCredentials: true
            });
            if (response.data && response.data.id) {
                setUser(response.data);
                setLoading(false);
            } else {
                // No valid user data
                if (retryCount < maxRetries) {
                    // Retry after a short delay (session might still be establishing)
                    console.log(`No user data, retrying... (${retryCount + 1}/${maxRetries})`);
                    setTimeout(() => fetchUser(retryCount + 1), 500);
                    return;
                }
                console.log('No user data received after retries, redirecting to login');
                setLoading(false);
                window.location.href = '/login';
            }
        } catch (error) {
            console.log('Fetch user error:', error);
            // If not authenticated, redirect to login
            if (error.response) {
                const status = error.response.status;
                if (status === 401 || status === 403) {
                    // If we just logged in, retry once more
                    if (retryCount < maxRetries && status === 401) {
                        console.log(`401 error, retrying... (${retryCount + 1}/${maxRetries})`);
                        setTimeout(() => fetchUser(retryCount + 1), 500);
                        return;
                    }
                    console.log('Unauthorized, redirecting to login');
                    setLoading(false);
                    window.location.href = '/login';
                } else {
                    console.error('Unexpected error:', status, error.response.data);
                    // For other errors, retry once
                    if (retryCount < maxRetries) {
                        setTimeout(() => fetchUser(retryCount + 1), 500);
                        return;
                    }
                    setLoading(false);
                    window.location.href = '/login';
                }
            } else {
                // Network error or no response
                console.error('Network error or no response:', error.message);
                // Retry on network errors
                if (retryCount < maxRetries) {
                    setTimeout(() => fetchUser(retryCount + 1), 1000);
                    return;
                }
                setLoading(false);
            }
        }
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

            await axios.post('/api/logout', {}, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken || window.axios.defaults.headers.common['X-CSRF-TOKEN']
                }
            });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect on error
            window.location.href = '/';
        }
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
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
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-gray-600 text-lg mb-4">Please wait...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                            <a href="/dashboard">
                                <img src="/images/school_logo.png" alt="School Logo" className="h-14 w-auto object-contain" />
                            </a>
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
                            <a href="/settings" className="text-gray-800 hover:text-blue-600 transition">Settings</a>

                        </div>

                        {/* Logout */}
                        <form onSubmit={handleLogout}>
                            <button type="submit" className="px-4 py-2 bg-[#243b80] text-white rounded-md hover:bg-red-700 transition">
                                Logout
                            </button>
                        </form>
                    </div>
                </div>
            </nav>

            {/* Hero Background */}
            <main className="relative flex-1">
                <div className="relative hero-wrap overflow-hidden">
                    {/* Background */}
                    <img src="/images/background.png" alt="Background" className="hero-bg-img" />

                    {/* Carousel */}
                    <div className="relative z-10 w-full max-w-7xl mx-auto mt-8 px-4">
                        <div className="relative rounded-lg overflow-hidden shadow-lg">
                            <div className="relative w-full h-[56vh] md:h-[64vh] lg:h-[72vh]">
                                {slides.map((slide, index) => (
                                    <div
                                        key={index}
                                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                            index === currentSlide ? 'opacity-100 z-20' : 'opacity-0 z-10'
                                        }`}
                                    >
                                        <img src={slide} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/30"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Arrows */}
                            <button
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow z-30 transition"
                            >
                                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow z-30 transition"
                            >
                                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>

                            {/* Dots */}
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-30 flex gap-3">
                                {slides.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`w-3 h-3 rounded-full transition ${
                                            index === currentSlide ? 'bg-white/80' : 'bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Vignette Overlay */}
                    <div
                        className="pointer-events-none absolute inset-0 z-20"
                        style={{
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.08) 60%, rgba(0,0,0,0.18) 100%)'
                        }}
                    />
                </div>
            </main>

            <style>{`
                :root { --nav-h: 64px; }
                .hero-wrap { height: calc(100vh - var(--nav-h)); }
                html, body { height:100%; }
                body {
                    font-family: 'Roboto', sans-serif;
                    background: #f3f4f6;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                .hero-bg-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: blur(6px) brightness(0.85);
                }
            `}</style>
        </div>
    );
}
