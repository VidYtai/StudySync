
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { BookOpenIcon, XIcon, ChevronDownIcon, UsersIcon, CalendarDaysIcon, ClipboardListIcon, BellIcon, BrainIcon } from './icons';

const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: <BrainIcon className="w-5 h-5" />, id: 'nav-link-dashboard' },
    { name: 'Timetable', path: '/app/timetable', icon: <CalendarDaysIcon className="w-5 h-5" />, id: 'nav-link-timetable' },
    { name: 'To-Do List', path: '/app/todo', icon: <ClipboardListIcon className="w-5 h-5" />, id: 'nav-link-todo' },
    { name: 'Reminders', path: '/app/reminders', icon: <BellIcon className="w-5 h-5" />, id: 'nav-link-reminders' },
    { name: 'Study Room', path: '/app/study-room', icon: <UsersIcon className="w-5 h-5" />, id: 'nav-link-study-room' },
];

const NavLinks = ({ isMobile, closeMenu }: { isMobile?: boolean, closeMenu?: () => void }) => {
    const baseClasses = "flex items-center gap-3 font-semibold transition-colors duration-200 rounded-md";
    const mobileClasses = isMobile ? "px-4 py-3 text-lg" : "px-3 py-1.5 text-sm";
    const activeClass = "bg-white/10 text-white";
    const inactiveClass = "text-text-secondary hover:text-white hover:bg-white/5";

    return (
        <>
            {navItems.map(item => (
                <NavLink
                    key={item.name}
                    to={item.path}
                    id={item.id}
                    onClick={closeMenu}
                    className={({ isActive }) => `${baseClasses} ${mobileClasses} ${isActive ? activeClass : inactiveClass}`}
                >
                    {item.icon}
                    {item.name}
                </NavLink>
            ))}
        </>
    );
}

const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuRendered, setIsMobileMenuRendered] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isUserMenuRendered, setIsUserMenuRendered] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleUserMenuToggle = () => {
        const wasMobileMenuOpen = isMenuOpen;
        if (wasMobileMenuOpen) {
            setIsMenuOpen(false);
        }

        // Toggle user menu. If mobile menu was open, delay the opening.
        if (isUserMenuOpen) {
            setIsUserMenuOpen(false);
        } else {
            if (wasMobileMenuOpen) {
                setTimeout(() => setIsUserMenuOpen(true), 300); // Animation duration
            } else {
                setIsUserMenuOpen(true);
            }
        }
    };

    const handleMobileMenuToggle = () => {
        // If we are about to open the mobile menu, first ensure the user dropdown is closed.
        if (!isMenuOpen) {
            if (isUserMenuOpen) {
                setIsUserMenuOpen(false);
            }
        }
        // Then, toggle the mobile menu's state.
        setIsMenuOpen(prev => !prev);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    // Effect to handle exit animation for user menu
    useEffect(() => {
        if (isUserMenuOpen) {
            setIsUserMenuRendered(true);
        } else {
            // Delay unmounting to allow for exit animation
            const timer = setTimeout(() => setIsUserMenuRendered(false), 200); // Match 'animate-scale-out' duration
            return () => clearTimeout(timer);
        }
    }, [isUserMenuOpen]);
    
    // Effect to handle exit animation for mobile menu
    useEffect(() => {
        if (isMenuOpen) {
            setIsMobileMenuRendered(true);
        } else {
            // Delay unmounting to allow for exit animation
            const timer = setTimeout(() => setIsMobileMenuRendered(false), 300); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [isMenuOpen]);

    // Effect to handle clicks outside the user menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isUserMenuOpen]);


    return (
        <header className="fixed top-0 left-0 right-0 z-50 p-4">
            <nav className="glass-pane flex items-center justify-between h-16 px-4 w-full max-w-7xl mx-auto">
                {/* Left side: Logo and Desktop Nav */}
                <div className="flex items-center gap-6">
                    <Link to="/app/dashboard" className="flex-shrink-0 flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-primary-accent rounded-lg flex items-center justify-center">
                            <BookOpenIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-text-primary hidden sm:block">StudySync</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-1">
                        <NavLinks />
                    </div>
                </div>
                
                {/* Right side: User Menu and Mobile Toggle */}
                <div className="flex items-center gap-2">
                    <div className="relative" ref={userMenuRef}>
                        <button id="user-menu-button" onClick={handleUserMenuToggle} className="flex items-center gap-2 glass-pane !bg-transparent hover:!bg-surface-hover !border-none px-2 py-1.5 rounded-md">
                            <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center font-bold text-primary-accent">
                               {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-text-primary hidden sm:block">{user?.name}</span>
                            <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isUserMenuRendered && (
                            <div className={`absolute right-0 mt-2 w-56 origin-top-right glass-pane popover-pane p-2 z-20 ${isUserMenuOpen ? 'animate-scale-in' : 'animate-scale-out'}`}>
                                <div className="px-3 py-2">
                                    <p className="text-sm font-semibold text-text-primary truncate">{user?.name}</p>
                                    <p className="text-xs text-text-secondary">Welcome back!</p>
                                </div>
                                <div className="h-px bg-border-color my-2"></div>
                                <Link to="/app/settings" id="nav-link-settings" onClick={() => setIsUserMenuOpen(false)} className="block w-full text-left px-3 py-2 text-sm text-text-secondary rounded-md hover:bg-white/5 hover:text-white transition-colors">
                                    Settings
                                </Link>
                                <button onClick={() => { handleLogout(); setIsUserMenuOpen(false); }} className="w-full text-left block px-3 py-2 text-sm text-text-secondary rounded-md hover:bg-white/5 hover:text-white transition-colors">
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={handleMobileMenuToggle}
                            className="btn btn-secondary !p-2"
                            aria-expanded={isMenuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <XIcon className="h-5 w-5" /> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>}
                        </button>
                    </div>
                </div>
            </nav>

            {isMobileMenuRendered && (
                <div 
                    className={`md:hidden fixed inset-0 top-24 z-40 bg-black/50 backdrop-blur-sm px-4 ${isMenuOpen ? 'animate-fade-in' : 'animate-fade-out'}`} 
                    style={{animationDuration: '0.3s'}} 
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div 
                        className={`glass-pane w-full max-w-7xl mx-auto p-4 ${isMenuOpen ? 'animate-slide-down-in' : 'animate-slide-up-out'}`}
                        style={{animationDuration: '0.3s'}}
                        onClick={e => e.stopPropagation()}
                    >
                         <NavLinks isMobile closeMenu={() => setIsMenuOpen(false)} />
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;