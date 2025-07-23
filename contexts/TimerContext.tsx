
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TimerSettings {
  pomodoro: number; // in minutes
  shortBreak: number;
  longBreak: number;
}

interface TimerContextType {
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  activeMode: 'pomodoro' | 'shortBreak' | 'longBreak' | null;
  timeLeft: number;
  isActive: boolean;
  pomodoroCount: number;
  modes: {
    pomodoro: { time: number; label: string };
    shortBreak: { time: number; label: string };
    longBreak: { time: number; label: string };
  };
  settings: TimerSettings;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  switchMode: (newMode: 'pomodoro' | 'shortBreak' | 'longBreak') => void;
  times: {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
  };
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<TimerSettings>('studysync-timer-settings', {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
  });

  const modes = useMemo(() => ({
    pomodoro: { time: settings.pomodoro * 60, label: 'Focus' },
    shortBreak: { time: settings.shortBreak * 60, label: 'Short Break' },
    longBreak: { time: settings.longBreak * 60, label: 'Long Break' },
  }), [settings]);

  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [activeMode, setActiveMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak' | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const [times, setTimes] = useState({
    pomodoro: modes.pomodoro.time,
    shortBreak: modes.shortBreak.time,
    longBreak: modes.longBreak.time,
  });

  useEffect(() => {
    setTimes(currentTimes => ({
      pomodoro: activeMode === 'pomodoro' ? currentTimes.pomodoro : modes.pomodoro.time,
      shortBreak: activeMode === 'shortBreak' ? currentTimes.shortBreak : modes.shortBreak.time,
      longBreak: activeMode === 'longBreak' ? currentTimes.longBreak : modes.longBreak.time,
    }));
  }, [modes, activeMode]);
  
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null;
    if (isActive && activeMode) {
      interval = setInterval(() => {
        setTimes(prev => ({ ...prev, [activeMode]: Math.max(0, prev[activeMode] - 1) }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, activeMode]);

  useEffect(() => {
    if (!activeMode || times[activeMode] > 0) return;

    new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3").play().catch(e => console.error("Audio play failed", e));
    
    const finishedMode = activeMode;
    setTimes(prev => ({...prev, [finishedMode]: modes[finishedMode].time}));

    if (finishedMode === 'pomodoro') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      const nextMode = newCount > 0 && newCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
    } else {
      setMode('pomodoro');
    }

    setIsActive(false);
    setActiveMode(null);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [times]);

  const switchMode = useCallback((newMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
  }, []);

  const toggleTimer = () => {
    if (activeMode === mode) {
        setIsActive(prev => !prev);
    } 
    else if (activeMode === null) {
        setActiveMode(mode);
        setIsActive(true);
    }
    else {
        const oldActiveMode = activeMode;
        setTimes(prev => ({...prev, [oldActiveMode]: modes[oldActiveMode].time}));
        setActiveMode(mode);
        setIsActive(true);
    }
  };

  const resetTimer = () => {
    const modeToReset = mode;
    if (activeMode === modeToReset) {
        setActiveMode(null);
        setIsActive(false);
    }
    setTimes(prev => ({...prev, [modeToReset]: modes[modeToReset].time}));
  };

  const updateSettings = useCallback((newSettings: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);
  
  const value = {
    mode,
    activeMode,
    timeLeft: times[mode],
    isActive,
    pomodoroCount,
    modes,
    settings,
    updateSettings,
    toggleTimer,
    resetTimer,
    switchMode,
    times,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
