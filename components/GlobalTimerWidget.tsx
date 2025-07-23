
import React from 'react';
import { useNavigate } from 'react-router';
import { useTimer } from '../contexts/TimerContext';
import { PlayIcon, PauseIcon } from './icons';

const GlobalTimerWidget: React.FC = () => {
  const { times, isActive, activeMode, modes, toggleTimer, switchMode } = useTimer();
  const navigate = useNavigate();

  if (!activeMode) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  const handleWidgetClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (activeMode) {
      switchMode(activeMode);
    }
    navigate('/app/dashboard');
  };

  return (
    <div 
        className="fixed bottom-6 right-6 z-50 glass-pane p-2 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform duration-300"
        onClick={handleWidgetClick}
        style={{ animationName: 'fadeIn', animationDuration: '0.5s' }}
    >
      <div className="pl-2">
        <p className="font-bold text-text-primary text-lg tabular-nums">{formatTime(times[activeMode])}</p>
        <p className="text-xs text-text-secondary -mt-1">{modes[activeMode].label}</p>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleTimer(); }} 
        className="btn btn-primary !p-2.5 !rounded-lg"
        aria-label={isActive ? 'Pause timer' : 'Start timer'}
      >
        {isActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default GlobalTimerWidget;