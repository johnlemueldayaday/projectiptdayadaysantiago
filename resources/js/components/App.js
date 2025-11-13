import React, { useState, useEffect } from 'react';
import Welcome from './Welcome';
import Login from './Login';
import AdminLogin from './AdminLogin';
import Register from './Register';
import Home from './Home';
import Profile from './Profile';
import AccountProfile from './AccountProfile';
import AccountDashboard from './AccountDashboard';
import Students from './Students';
import Dashboard from './Dashboard';
import Faculty from './Faculty';
import Settings from './Settings';
import Reports from './Reports';

export default function App() {
    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    useEffect(() => {
        // Listen for popstate events (back/forward buttons)
        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };

        // Listen for custom navigation events
        const handleNavigation = () => {
            setCurrentPath(window.location.pathname);
        };

        // Listen for custom navigate event from Login/Register
        const handleCustomNavigate = (e) => {
            if (e.detail && e.detail.path) {
                setCurrentPath(e.detail.path);
            } else {
                setCurrentPath(window.location.pathname);
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('pushstate', handleNavigation);
        window.addEventListener('replacestate', handleNavigation);
        window.addEventListener('navigate', handleCustomNavigate);

        // Override link clicks to handle client-side routing
        const handleLinkClick = (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link && !link.hasAttribute('data-external')) {
                e.preventDefault();
                const href = link.getAttribute('href');
                window.history.pushState({}, '', href);
                setCurrentPath(href);
            }
        };

        document.addEventListener('click', handleLinkClick);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('pushstate', handleNavigation);
            window.removeEventListener('replacestate', handleNavigation);
            window.removeEventListener('navigate', handleCustomNavigate);
            document.removeEventListener('click', handleLinkClick);
        };
    }, []);

    // Route matching logic
    const renderComponent = () => {
        // Normalize path (remove trailing slashes)
        const normalizedPath = currentPath.replace(/\/$/, '') || '/';
        
        if (normalizedPath === '/login') {
            return <Login />;
        }
        if (normalizedPath === '/admin-login') {
            return <AdminLogin />;
        }
        if (normalizedPath === '/register') {
            return <Register />;
        }
        if (normalizedPath === '/home') {
            return <Home />;
        }
        if (normalizedPath === '/profile') {
            return <Profile />;
        }
        if (normalizedPath === '/account-profile') {
            return <AccountProfile />;
        }
        if (normalizedPath === '/account-dashboard') {
            return <AccountDashboard />;
        }
        if (normalizedPath === '/students') {
            return <Students />;
        }
        if (normalizedPath === '/dashboard') {
            return <Dashboard />;
        }
        if (normalizedPath === '/faculty') {
            return <Faculty />;
        }
        if (normalizedPath === '/settings') {
            return <Settings />;
        }
        if (normalizedPath === '/reports') {
            return <Reports />;
        }
        // Default to Welcome
        return <Welcome />;
    };

    return (
        <div>
            {renderComponent()}
        </div>
    );
}

if (document.getElementById('app')) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    ReactDOM.render(<App />, document.getElementById('app'));
}
