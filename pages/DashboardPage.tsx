
import React, { useState, useEffect, useMemo } from 'react';
import { fetchMotivationalQuote } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import PomodoroTimer from '../components/PomodoroTimer';
import { SparklesIcon } from '../components/icons';
import { useTutorial, TutorialStepConfig } from '../contexts/TutorialContext';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [quote, setQuote] = useState<string>("");
    const { tutorialProgress, startTutorial, isDesktop } = useTutorial();

    const dashboardTutorialSteps = useMemo((): TutorialStepConfig[] => [
        {
            selector: '#greeting-header',
            title: 'Welcome to StudySync!',
            content: "This is your all-in-one productivity hub. Let's take a quick tour to see how you can organize your schedule, manage tasks, and supercharge your focus.",
            placement: 'center',
            isWelcome: true,
        },
        {
            selector: '#motivation-quote',
            title: 'Daily Motivation',
            content: "Get a fresh dose of inspiration every day. A new quote appears here to help you get started on the right foot.",
            placement: 'bottom',
        },
        {
            selector: '#pomodoro-timer-container',
            title: 'The Focus Timer',
            content: "This is the Pomodoro Timer, a powerful tool to boost your concentration. Work in focused sprints to maximize productivity and prevent burnout.",
            placement: isDesktop ? 'top' : 'right',
        },
        {
            selector: '#pomodoro-modes',
            title: 'Work & Break Modes',
            content: "Easily switch between focused work sessions and restorative short or long breaks. The app guides you through the cycle automatically.",
            placement: 'top',
        },
        {
            selector: '#pomodoro-controls',
            title: 'Timer Controls',
            content: "Use these buttons to start, pause, or reset the timer. You can customize the length of each session in the Settings menu.",
            placement: 'top',
        },
        {
            selector: '#nav-link-timetable',
            title: 'Plan Your Week',
            content: "Ready to get organized? Head to the 'Timetable' to visually map out your classes and study sessions. Let's go there now.",
            placement: 'right',
            desktopOnly: true,
            nextPath: '/app/timetable',
        },
    ], [isDesktop]);

    useEffect(() => {
        const getQuote = async () => {
            const fetchedQuote = await fetchMotivationalQuote();
            setQuote(fetchedQuote);
        };
        getQuote();
    }, []);

    useEffect(() => {
        if (tutorialProgress.dashboard === 'unseen') {
            const timer = setTimeout(() => {
                startTutorial('dashboard', dashboardTutorialSteps);
            }, 500); // Delay to allow page animation to finish
            return () => clearTimeout(timer);
        }
    }, [tutorialProgress, startTutorial, dashboardTutorialSteps]);

    const getGreetingText = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const greetingText = getGreetingText();

    return (
        <div className="w-full space-y-10 animate-fade-in">
            
            <div id="greeting-header" className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-full bg-surface-hover hidden sm:flex items-center justify-center font-bold text-primary-accent text-4xl flex-shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">{greetingText}, {user?.name}!</h1>
                    <p className="text-text-secondary mt-2 text-lg sm:text-xl">Ready to make today productive?</p>
                </div>
            </div>
            
            {quote && (
                <div id="motivation-quote" className="relative text-center p-8 border border-dashed border-border-color rounded-lg animate-fade-in">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-bg-color px-2">
                      <SparklesIcon className="w-5 h-5 text-primary-accent" />
                    </div>
                    <blockquote className="text-lg sm:text-xl italic font-medium text-text-secondary">
                        {`“${quote}”`}
                    </blockquote>
                </div>
            )}

            <PomodoroTimer />
        </div>
    );
};

export default DashboardPage;
