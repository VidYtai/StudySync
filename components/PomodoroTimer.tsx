import React from 'react';
import { useTimer } from '../contexts/TimerContext';

const PomodoroTimer: React.FC = () => {
  const {
    mode,
    activeMode,
    timeLeft,
    isActive,
    pomodoroCount,
    modes,
    toggleTimer,
    resetTimer,
    switchMode,
  } = useTimer();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const progress = ((modes[mode].time - timeLeft) / modes[mode].time) * 100;
  
  const isThisModeActive = activeMode === mode;
  const isAnotherModeActivelyRunning = isActive && activeMode !== null && activeMode !== mode;

  const radius = 85;
  const circumference = 2 * Math.PI * radius;

  return (
    <div id="pomodoro-timer-container" className="animated-component glass-pane w-full p-6 sm:p-8 text-white">
      <div id="pomodoro-modes" className="flex justify-center items-center space-x-2 mb-8">
        {(Object.keys(modes) as Array<keyof typeof modes>).map((key) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`btn !py-2 !px-4 text-sm ${
              mode === key ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            {modes[key].label}
          </button>
        ))}
      </div>
      <div id="pomodoro-timer-display" className="relative w-52 h-52 md:w-64 md:h-64 mx-auto mb-8">
        <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Background Circle */}
            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--border-color)" strokeWidth="10" />
            
            {/* Progress Circle */}
            <circle
                cx="100" cy="100" r={radius} fill="none"
                stroke="var(--primary-accent)" strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear'}}
            />
            {/* Glowing effect */}
            {isThisModeActive && isActive &&
              <circle
                cx="100" cy="100" r={radius} fill="none"
                stroke="var(--primary-accent)" strokeWidth="10"
                strokeLinecap="round"
                style={{ animation: 'subtle-glow 3s ease-in-out infinite', filter: 'blur(5px)' }}
              />
            }
        </svg>
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 ease-in-out ${isThisModeActive && isActive ? 'scale-105' : 'scale-100'}`}>
            <span className="text-5xl md:text-6xl font-bold tracking-tighter tabular-nums">{formatTime(timeLeft)}</span>
            <p className="text-sm font-medium text-text-secondary mt-1">Completed: {pomodoroCount}</p>
        </div>
      </div>
      <div id="pomodoro-controls" className="flex justify-center space-x-4">
        <button
          onClick={toggleTimer}
          className="btn btn-primary w-36 text-lg"
          disabled={isAnotherModeActivelyRunning}
          title={isAnotherModeActivelyRunning ? `A ${modes[activeMode!]?.label} session is running.` : ""}
        >
          {isThisModeActive && isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="btn btn-secondary w-36 text-lg"
          disabled={isAnotherModeActivelyRunning}
          title={isAnotherModeActivelyRunning ? `A ${modes[activeMode!]?.label} session is running.` : ""}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;