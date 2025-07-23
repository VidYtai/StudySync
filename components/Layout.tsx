
import React from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from './Navbar';
import { useTimer } from '../contexts/TimerContext';
import GlobalTimerWidget from './GlobalTimerWidget';
import TutorialPrompt from './TutorialPrompt';

const Layout: React.FC = () => {
  const { activeMode } = useTimer();
  const { pathname } = useLocation();

  const showWidget = activeMode !== null && pathname !== '/app/dashboard';
  const isStudyRoom = pathname === '/app/study-room';

  return (
    <div className="h-screen w-screen flex flex-col font-sans text-text-primary overflow-hidden">
      <Navbar />
      <main className="flex-grow pt-28 md:pt-24 overflow-hidden">
        <div className="h-full w-full overflow-y-auto main-content">
          <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isStudyRoom ? 'h-full flex flex-col pb-6' : 'pt-8 pb-16'}`}>
            <Outlet />
          </div>
        </div>
      </main>
      {showWidget && <GlobalTimerWidget />}
      <TutorialPrompt />
    </div>
  );
};

export default Layout;