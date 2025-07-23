
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Reminder } from '../types';
import { TrashIcon, BellIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTutorial, TutorialStepConfig } from '../contexts/TutorialContext';
import EmptyState from '../components/EmptyState';
import { emptyRemindersImage } from '../assets/images';

const remindersTutorialSteps: TutorialStepConfig[] = [
    {
        selector: '#notification-banner',
        title: 'Never Miss a Deadline',
        content: "To get the most out of reminders, allow browser notifications. StudySync can then ping you even when you're not on the page.",
        placement: 'bottom',
    },
    {
        selector: '#new-reminder-form',
        title: 'Set a Reminder',
        content: "Use this form to set a reminder for anything important. Just give it a title, pick a date and time, and we'll handle the rest.",
        placement: 'bottom',
    },
    {
        selector: '#upcoming-reminders-list',
        title: 'Upcoming Reminders',
        content: 'Your active reminders will appear here, sorted by time. Once a reminder has passed, it will move to the "Recently Past" section below.',
        placement: 'top',
    },
    {
        selector: '#past-reminders-list',
        title: 'Recently Past',
        content: 'Passed reminders are kept here for 7 days so you can review them. You can also manually delete them at any time.',
        placement: 'top',
    },
    {
        selector: '#nav-link-study-room',
        title: 'Time to Collaborate',
        content: "Now for the fun part! Let's check out the Study Room, where you can chat with friends and AI partners.",
        placement: 'right',
        desktopOnly: true,
        nextPath: '/app/study-room',
    },
];

const RemindersPage: React.FC = () => {
  const { user } = useAuth();
  const { tutorialProgress, startTutorial } = useTutorial();
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(`studysync-reminders-${user!.id}`, []);
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [, setForceUpdate] = useState(0); // Used to force re-renders for time-sensitive UI

  useEffect(() => {
    if (tutorialProgress.reminders === 'unseen') {
        const timer = setTimeout(() => {
            startTutorial('reminders', remindersTutorialSteps);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [tutorialProgress, startTutorial]);

  // This effect runs every minute to re-render the component,
  // ensuring that reminders correctly move from "Upcoming" to "Past" as time passes.
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(tick => tick + 1);
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  // This effect runs once on mount to clean up any reminders older than 7 days.
  useEffect(() => {
    const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
    const recentReminders = reminders.filter(r => new Date(r.datetime).getTime() >= sevenDaysAgo);
    if (recentReminders.length < reminders.length) {
      setReminders(recentReminders);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }

    // Explicitly handle the case where permission is already denied, as some browsers
    // won't show a prompt and just resolve the promise immediately.
    if (Notification.permission === 'denied') {
      alert("Notifications are blocked. To enable them, please go to your browser's site settings.");
      // We can also update our state just in case it was out of sync.
      setNotificationPermission('denied');
      return;
    }

    try {
      // The promise-based API is standard.
      const permission = await Notification.requestPermission();
      
      // Update the state with the user's choice.
      setNotificationPermission(permission);

      // Provide feedback if the user explicitly denies the request.
      if (permission === 'denied') {
        alert("You've chosen to block notifications. You can change this in your browser's site settings if you change your mind.");
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('An error occurred while requesting notification permissions. This might be due to your browser or site settings.');
    }
  };

  useEffect(() => {
    const activeTimeouts: ReturnType<typeof setTimeout>[] = [];

    reminders.forEach(reminder => {
      const reminderTime = new Date(reminder.datetime).getTime();
      const now = new Date().getTime();
      const delay = reminderTime - now;

      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('StudySync Reminder', {
              body: reminder.title,
              icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📚</text></svg>",
              tag: reminder.id,
            });
          } else {
            alert(`Reminder: ${reminder.title}`);
          }
          // Force a re-render to move the reminder to the "Past" list
          setForceUpdate(tick => tick + 1);
        }, delay);
        activeTimeouts.push(timeoutId);
      }
    });

    return () => {
      activeTimeouts.forEach(clearTimeout);
    };
  }, [reminders]);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === '' || datetime === '') return;

    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title,
      datetime,
    };

    const sortedReminders = [...reminders, newReminder].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
    setReminders(sortedReminders);

    setTitle('');
    setDatetime('');
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };
  
  const now = new Date().getTime();
  const upcomingReminders = reminders.filter(r => new Date(r.datetime).getTime() > now);
  const pastReminders = reminders.filter(r => new Date(r.datetime).getTime() <= now).sort((a,b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const NotificationBanner = () => {
    if (notificationPermission === 'default') {
      return (
        <div id="notification-banner" className="glass-pane p-4 mb-8 flex items-center justify-between flex-wrap gap-4 animate-fade-in">
          <p className="text-sm text-text-secondary">Enable notifications to get reminders on your device.</p>
          <button onClick={requestNotificationPermission} className="btn btn-primary !py-1.5 !px-3 text-sm flex-shrink-0">
            Enable Notifications
          </button>
        </div>
      );
    }
    if (notificationPermission === 'denied') {
        return (
             <div id="notification-banner" className="glass-pane p-4 mb-8 animate-fade-in">
                <p className="text-sm text-center text-text-tertiary">
                    Notifications are blocked.
                    To enable system notifications, please update your browser settings for this site.
                </p>
             </div>
        );
    }
    return <div id="notification-banner" className="hidden"></div>; // Hidden div to serve as a tutorial target if permissions are already granted
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-8">Reminders</h1>

      <NotificationBanner />

      <div id="new-reminder-form" className="glass-pane p-6 mb-8">
        <h2 className="text-xl font-bold text-text-primary mb-4">Set a New Reminder</h2>
        <form onSubmit={handleAddReminder} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Submit Physics paper" required className="form-input"
            />
          </div>
          <div>
            <label htmlFor="datetime" className="block text-sm font-medium text-text-secondary mb-1">Date and Time</label>
            <input
              type="datetime-local" id="datetime" value={datetime} onChange={(e) => setDatetime(e.target.value)}
              required className="form-input" style={{ colorScheme: 'dark' }}
            />
          </div>
          <button type="submit" className="w-full btn btn-primary">
            Set Reminder
          </button>
        </form>
      </div>

      <div id="upcoming-reminders-list">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Upcoming</h2>
        {upcomingReminders.length > 0 ? (
          <ul className="space-y-3">
            {upcomingReminders.map(reminder => (
              <li key={reminder.id} className="flex items-center justify-between p-4 glass-pane !bg-transparent hover:!bg-surface-hover transition-colors group">
                <div className="flex items-center gap-4">
                    <BellIcon className="w-5 h-5 text-primary-accent flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-text-primary">{reminder.title}</p>
                      <p className="text-sm text-text-secondary">{new Date(reminder.datetime).toLocaleString()}</p>
                    </div>
                </div>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-2 text-text-tertiary hover:text-red-400 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete reminder"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            image={emptyRemindersImage}
            title="No Upcoming Reminders"
            description="You're all caught up! Set a new reminder above to stay on top of your deadlines."
          />
        )}
      </div>

      <div id="past-reminders-list" className="mt-10">
        <h2 className="text-2xl font-semibold text-text-primary mb-2">Recently Past</h2>
        <p className="text-sm text-text-tertiary mb-4">Reminders are automatically deleted after 7 days.</p>
        {pastReminders.length > 0 ? (
            <ul className="space-y-3">
                {pastReminders.map(reminder => (
                    <li key={reminder.id} className="flex items-center justify-between p-4 glass-pane !bg-transparent opacity-70 hover:opacity-100 transition-opacity group">
                        <div className="flex items-center gap-4">
                            <BellIcon className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-text-secondary">{reminder.title}</p>
                                <p className="text-sm text-text-tertiary">{new Date(reminder.datetime).toLocaleString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => deleteReminder(reminder.id)}
                            className="p-2 text-text-tertiary hover:text-red-400 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Delete reminder"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </li>
                ))}
            </ul>
        ) : (
            <div className="text-center py-12 glass-pane">
                <p className="text-text-secondary italic">No past reminders... yet!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default RemindersPage;