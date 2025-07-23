
import React from 'react';
import { Link } from 'react-router';
import { BookOpenIcon, ArrowRightIcon } from '../components/icons';
import { heroImage, timetableImage, todoImage, pomodoroImage, studyRoomImage } from '../assets/images';

const FeatureCard: React.FC<{ imageUrl: string; title: string; description: string }> = ({ imageUrl, title, description }) => (
    <div className="glass-pane text-left transition-all duration-300 transform-gpu hover:-translate-y-1 h-full flex flex-col overflow-hidden group">
        <div className="w-full h-48 overflow-hidden">
             <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="mt-2 text-text-secondary flex-grow">{description}</p>
        </div>
    </div>
);


const LandingPage: React.FC = () => {
    return (
        <div className="w-screen h-screen overflow-y-auto overflow-x-hidden text-text-primary font-sans main-content">
            <header className="fixed inset-x-0 top-0 z-50 p-4">
                <nav className="glass-pane landing-navbar-bg flex items-center justify-between h-16 px-6 w-full max-w-7xl mx-auto" aria-label="Global">
                    <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-primary-accent rounded-lg flex items-center justify-center">
                           <BookOpenIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-text-primary">StudySync</span>
                    </Link>
                     
                </nav>
            </header>
            
            <main>
                {/* Hero Section */}
                <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 grid lg:grid-cols-2 items-center gap-x-16 gap-y-20">
                        <div className="text-center lg:text-left animate-fade-in">
                            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-text-secondary sm:text-5xl md:text-6xl lg:text-7xl">
                                Your Personal Study OS
                            </h1>
                            <p className="mt-6 text-lg max-w-xl mx-auto lg:mx-0 leading-8 text-text-secondary">
                                An intelligent suite of tools designed to organize your schedule, streamline your tasks, and amplify your focus. Achieve academic excellence with StudySync.
                            </p>
                            <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
                                <Link to="/signup" className="btn btn-primary text-base !px-8 !py-3">
                                    Get Started for Free
                                </Link>
                                <Link to="/login" className="text-base font-semibold leading-6 text-text-primary group flex items-center gap-2">
                                    Log in <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                        <div className="w-full max-w-lg mx-auto lg:max-w-none animate-fade-in h-80 rounded-2xl shadow-2xl shadow-primary-accent/10 overflow-hidden" style={{ animationDelay: '0.2s' }}>
                            <img
                                src={heroImage}
                                alt="A vibrant and inspiring image of a modern study setup, encouraging focus and productivity."
                                className="w-full h-full object-cover object-top"
                            />
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <section id="features" className="py-20 sm:py-28 animate-fade-in">
                    <div className="px-6 lg:px-8 max-w-7xl mx-auto">
                        <div className="w-full max-w-3xl mx-auto text-center">
                            <h2 className="text-base font-semibold leading-7 text-primary-accent">Core Features</h2>
                            <p className="mt-2 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
                                A Smarter Way to Study
                            </p>
                            <p className="mt-6 text-lg text-text-secondary">
                                StudySync integrates every tool you need into one seamless platform, powered by intelligent assistance.
                            </p>
                        </div>
                        <div className="mt-16 sm:mt-20">
                            <dl className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                                <FeatureCard imageUrl={timetableImage} title="Dynamic Timetable" description="Visually orchestrate your week. Schedule classes, study blocks, and personal time. Our AI can even auto-generate checklists for your events." />
                                <FeatureCard imageUrl={todoImage} title="Intelligent To-Do List" description="Conquer your workload with a smart to-do list. Prioritize tasks, track progress, and experience the satisfaction of a clear agenda." />
                                <FeatureCard imageUrl={pomodoroImage} title="Focused Pomodoro Timer" description="Enhance concentration and prevent burnout using the Pomodoro technique. Cycle between focused sprints and restorative breaks, all tracked globally." />
                                <FeatureCard imageUrl={studyRoomImage} title="AI-Powered Study Rooms" description="Collaborate in virtual rooms with friends or custom AI tutors. Get answers, stay motivated, and learn together in a shared, focused environment." />
                            </dl>
                        </div>
                    </div>
                </section>
                                
                {/* Final CTA Section */}
                <section className="py-20 sm:py-28 animate-fade-in">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">Ready to unlock your potential?</h2>
                        <p className="mt-6 text-lg text-text-secondary">Join thousands of students who are studying smarter, not harder. Sign up for free and take control of your academic life today.</p>
                         <div className="mt-10">
                            <Link to="/signup" className="btn btn-primary text-lg !px-10 !py-4">
                                Start Your Journey
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            
             <footer className="py-12 border-t border-border-color-light">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-center text-xs text-text-tertiary">&copy; {new Date().getFullYear()} StudySync. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;