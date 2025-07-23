
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../contexts/TimerContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AIPersona, EventCategory, TimetableSlot } from '../types';
import { DEFAULT_AI_PERSONAS, SECURITY_QUESTIONS, EVENT_CATEGORIES, EVENT_COLORS, DEFAULT_EVENT_SUGGESTION_PROMPT, DEFAULT_PERSONA_SUGGESTION_PROMPT } from '../constants';
import { UserIcon, ClockIcon, CalendarDaysIcon, SparklesIcon, CheckCircleIcon, TrashIcon } from '../components/icons';
import CustomDropdown from '../components/CustomDropdown';
import { useTutorial, TutorialStepConfig } from '../contexts/TutorialContext';
import { generateAIAvatar } from '../services/geminiService';
import { defaultAvatarImage } from '../assets/images';

const SectionCard: React.FC<{ children: React.ReactNode, id?: string }> = ({ children, id }) => (
    <div id={id} className="glass-pane p-6 w-full">
        {children}
    </div>
);

const AccountSettings = () => {
    const { user, updateUsername, updatePassword, updateSecurity } = useAuth();
    
    const [newName, setNewName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityPassword, setSecurityPassword] = useState('');
    const [newSecurityQuestion, setNewSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
    const [newSecurityAnswer, setNewSecurityAnswer] = useState('');

    const [nameMessage, setNameMessage] = useState({ text: '', isError: false });
    const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });
    const [securityMessage, setSecurityMessage] = useState({ text: '', isError: false });
    
    const handleNameChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setNameMessage({ text: '', isError: false });
        if (newName.trim() === user?.name) return;
        const res = await updateUsername(user!.id, newName.trim());
        setNameMessage({ text: res.message, isError: !res.success });
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ text: '', isError: false });
        if (newPassword.length < 6) {
            setPasswordMessage({ text: 'New password must be at least 6 characters.', isError: true }); return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ text: 'New passwords do not match.', isError: true }); return;
        }
        const res = await updatePassword(user!.id, currentPassword, newPassword);
        setPasswordMessage({ text: res.message, isError: !res.success });
        if (res.success) {
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        }
    };
    
    const handleSecurityChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityMessage({ text: '', isError: false });
        if (!newSecurityAnswer.trim()) {
            setSecurityMessage({ text: 'Security answer cannot be empty.', isError: true }); return;
        }
        const res = await updateSecurity(user!.id, securityPassword, newSecurityQuestion, newSecurityAnswer);
        setSecurityMessage({ text: res.message, isError: !res.success });
        if (res.success) {
            setSecurityPassword(''); setNewSecurityAnswer('');
        }
    };

    const messageClass = (isError: boolean) => isError ? 'text-red-400' : 'text-primary-accent';

    return (
        <div className="space-y-6">
            <h2 id="account-settings-heading" className="text-2xl font-bold text-text-primary">Account</h2>
            <form id="account-name-form" onSubmit={handleNameChange} className="space-y-4 glass-pane p-6">
                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="form-input" />
                {nameMessage.text && <p className={`text-sm ${messageClass(nameMessage.isError)}`}>{nameMessage.text}</p>}
                <button type="submit" className="btn btn-primary">Save Name</button>
            </form>
            <form id="account-password-form" onSubmit={handlePasswordChange} className="space-y-4 glass-pane p-6">
                <label className="block text-sm font-medium text-text-secondary mb-1">Change Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password" required className="form-input" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" required className="form-input" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required className="form-input" />
                {passwordMessage.text && <p className={`text-sm ${messageClass(passwordMessage.isError)}`}>{passwordMessage.text}</p>}
                <button type="submit" className="btn btn-primary">Update Password</button>
            </form>
            <form id="account-security-form" onSubmit={handleSecurityChange} className="space-y-4 glass-pane p-6">
                <label className="block text-sm font-medium text-text-secondary mb-1">Change Security Question</label>
                 <CustomDropdown options={SECURITY_QUESTIONS} value={newSecurityQuestion} onChange={setNewSecurityQuestion} />
                <input type="text" value={newSecurityAnswer} onChange={(e) => setNewSecurityAnswer(e.target.value)} placeholder="New Security Answer" required className="form-input" />
                <input type="password" value={securityPassword} onChange={(e) => setSecurityPassword(e.target.value)} placeholder="Enter Current Password to Confirm" required className="form-input" />
                {securityMessage.text && <p className={`text-sm ${messageClass(securityMessage.isError)}`}>{securityMessage.text}</p>}
                <button type="submit" className="btn btn-primary">Update Security Info</button>
            </form>
        </div>
    );
};

const TimerSettings = () => {
    const { settings, updateSettings } = useTimer();
    const [localSettings, setLocalSettings] = useState(settings);
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(localSettings);
        setMessage('Timer settings saved!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div>
           <h2 id="timer-settings-heading" className="text-2xl font-bold text-text-primary mb-6">Timer Settings</h2>
            <SectionCard id="settings-timer-card">
                <form onSubmit={handleSave} className="space-y-4">
                    <p className="font-semibold text-text-primary">Pomodoro Durations (minutes)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Focus</label>
                            <input type="number" name="pomodoro" min="1" value={localSettings.pomodoro} onChange={handleChange} className="form-input"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Short Break</label>
                            <input type="number" name="shortBreak" min="1" value={localSettings.shortBreak} onChange={handleChange} className="form-input"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Long Break</label>
                            <input type="number" name="longBreak" min="1" value={localSettings.longBreak} onChange={handleChange} className="form-input"/>
                        </div>
                    </div>
                    {message && <p className="text-sm text-primary-accent flex items-center gap-2"><CheckCircleIcon className="w-4 h-4"/>{message}</p>}
                    <button type="submit" className="btn btn-primary">Save Durations</button>
                </form>
            </SectionCard>
        </div>
    );
};

interface TimetableConfig {
  startHour: number;
  endHour: number;
}

const TimetableSettings = () => {
    const { user } = useAuth();
    const [config, setConfig] = useLocalStorage<TimetableConfig>(`studysync-timetable-config-${user!.id}`, { startHour: 7, endHour: 22 });
    const [categories, setCategories] = useLocalStorage<EventCategory[]>('studysync-event-categories', EVENT_CATEGORIES);
    const [events, setEvents] = useLocalStorage<TimetableSlot[]>(`studysync-events-${user!.id}`, []);
    
    const [message, setMessage] = useState({ text: '', isError: false });
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(EVENT_COLORS[0]);
    const [editingName, setEditingName] = useState<{ id: string, oldName: string } | null>(null);

    const showMessage = (text: string, isError = false) => {
        setMessage({ text, isError });
        setTimeout(() => setMessage({ text: '', isError: false }), 3000);
    };
    
    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            showMessage('Category name cannot be empty.', true);
            return;
        }
        if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            showMessage('A category with this name already exists.', true);
            return;
        }

        const newCategory: EventCategory = {
            id: crypto.randomUUID(),
            name: newCategoryName.trim(),
            color: newCategoryColor,
        };
        setCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
        setNewCategoryColor(EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)]);
        showMessage('Category added successfully!');
    };

    const handleRenameCategory = (categoryId: string, oldName: string, newName: string) => {
        if (oldName === newName) return;

        if (!newName.trim()) {
             setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: oldName } : c));
             showMessage('Category name cannot be empty.', true);
             return;
        }

        if (categories.some(c => c.id !== categoryId && c.name.toLowerCase() === newName.toLowerCase())) {
            setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: oldName } : c));
            showMessage('A category with this name already exists.', true);
            return;
        }

        setEvents(currentEvents => currentEvents.map(event => {
            if (event.category === oldName) {
                return { ...event, category: newName };
            }
            return event;
        }));
        showMessage('Category renamed successfully.');
    };

    const handleDeleteCategory = (categoryIdToDelete: string) => {
        if (categories.length <= 1) {
            showMessage('You must have at least one category.', true); return;
        }
        const categoryToDelete = categories.find(c => c.id === categoryIdToDelete);
        if (!categoryToDelete || categoryToDelete.name === 'Other') {
            showMessage("The 'Other' category cannot be deleted.", true); return;
        }
        
        const fallbackCategory = categories.find(c => c.name === 'Other') || categories.find(c => c.id !== categoryIdToDelete);
        if (!fallbackCategory) return;
        
        setEvents(currentEvents => currentEvents.map(event => {
            if (event.category === categoryToDelete.name) {
                return { ...event, category: fallbackCategory.name };
            }
            return event;
        }));

        setCategories(prev => prev.filter(c => c.id !== categoryIdToDelete));
        showMessage('Category deleted.');
    };
    
    const hourOptions = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => ({
            value: String(i),
            label: `${String(i).padStart(2, '0')}:00`
        }));
    }, []);

    const handleConfigSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (config.startHour >= config.endHour) {
            showMessage('Start hour must be before end hour.', true);
            return;
        }
        showMessage('Timetable settings saved!');
    };
    
    return (
        <div>
            <h2 id="timetable-settings-heading" className="text-2xl font-bold text-text-primary mb-6">Timetable Settings</h2>
            <SectionCard id="settings-timetable-card">
                <div className="space-y-6">
                     <form onSubmit={handleConfigSave} className="space-y-4">
                        <p className="font-semibold text-text-primary">Display Hours</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <CustomDropdown label="Start Hour" options={hourOptions} value={String(config.startHour)} onChange={v => setConfig(c => ({...c, startHour: Number(v)}))} />
                             <CustomDropdown label="End Hour" options={hourOptions.slice(1)} value={String(config.endHour)} onChange={v => setConfig(c => ({...c, endHour: Number(v)}))} />
                        </div>
                        <button type="submit" className="btn btn-primary">Save Hours</button>
                    </form>
                    
                    <div className="border-t border-border-color pt-6">
                        <p className="font-semibold text-text-primary">Event Categories</p>
                        <p className="text-text-secondary mb-4 text-sm">Add, remove, rename, and recolor categories. Changes are saved automatically.</p>
                        <div className="space-y-3">
                            {categories.map(category => (
                                <div key={category.id} className="flex items-center gap-3">
                                    <div className="relative w-8 h-8">
                                        <input 
                                            type="color"
                                            value={category.color}
                                            onChange={(e) => setCategories(prev => prev.map(cat => cat.id === category.id ? { ...cat, color: e.target.value } : cat))}
                                            className="w-full h-full rounded-full border-none cursor-pointer appearance-none bg-transparent"
                                            style={{'--color': category.color} as any}
                                            aria-label={`Change color for ${category.name}`}
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={category.name}
                                        onFocus={() => setEditingName({ id: category.id, oldName: category.name })}
                                        onChange={(e) => setCategories(prev => prev.map(c => c.id === category.id ? { ...c, name: e.target.value } : c))}
                                        onBlur={() => {
                                            if (editingName) {
                                                const currentCategory = categories.find(c => c.id === editingName.id);
                                                if (currentCategory) {
                                                    handleRenameCategory(editingName.id, editingName.oldName, currentCategory.name);
                                                }
                                                setEditingName(null);
                                            }
                                        }}
                                        disabled={category.name === 'Other'}
                                        className="form-input !py-2 flex-grow"
                                    />
                                    <button 
                                        onClick={() => handleDeleteCategory(category.id)}
                                        disabled={category.name === 'Other'}
                                        className="p-2 text-text-tertiary hover:text-red-400 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        aria-label={`Delete category ${category.name}`}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                     <form onSubmit={handleAddCategory} className="border-t border-border-color pt-6 space-y-3">
                        <p className="font-semibold text-text-primary">Add New Category</p>
                         <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 flex-shrink-0">
                                <input type="color" value={newCategoryColor} onChange={e => setNewCategoryColor(e.target.value)} className="w-full h-full rounded-full border-none cursor-pointer appearance-none bg-transparent" />
                            </div>
                            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New category name" className="form-input !py-2 flex-grow" />
                        </div>
                        <button type="submit" className="btn btn-secondary">Add Category</button>
                    </form>

                    {message.text && (
                        <p className={`text-sm flex items-center gap-2 pt-2 ${message.isError ? 'text-red-400' : 'text-primary-accent'}`}>
                           <CheckCircleIcon className="w-4 h-4"/>{message.text}
                        </p>
                    )}
                </div>
            </SectionCard>
        </div>
    );
};

interface AIPrompts {
    event: string;
    persona: string;
}

const AISettings = () => {
    const { user } = useAuth();
    const [allAIPersonas, setAllAIPersonas] = useLocalStorage<AIPersona[]>('studysync-aiPersonas', DEFAULT_AI_PERSONAS);
    const [defaultAI, setDefaultAI] = useLocalStorage<string | null>(`studysync-defaultAI-${user!.id}`, null);
    const [aiPrompts, setAiPrompts] = useLocalStorage<AIPrompts>(`studysync-ai-prompts`, {
        event: DEFAULT_EVENT_SUGGESTION_PROMPT,
        persona: DEFAULT_PERSONA_SUGGESTION_PROMPT
    });
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const aiOptions = useMemo(() => {
        const userAIs = allAIPersonas.filter(p => p.ownerId === user!.id && !p.isDefault);
        const defaultAIs = allAIPersonas.filter(p => p.isDefault);
        const availableAIs = [...defaultAIs, ...userAIs];
    
        return [
            { value: '', label: 'None (default: Professor Synapse)' },
            ...availableAIs.sort((a,b) => a.name.localeCompare(b.name)).map(ai => ({ value: ai.id, label: ai.name }))
        ];
    }, [allAIPersonas, user]);
    
    const handleSave = () => {
        // This is a controlled component with useLocalStorage, so saving is automatic.
        // We just show a message.
        setMessage('AI settings saved!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAiPrompts(p => ({ ...p, [name]: value }));
    };

    const handleCreateAIPersona = async (name: string, behavior: string) => {
        setIsSaving(true);
        const avatarUrl = await generateAIAvatar(name, behavior);
        const newAI: AIPersona = {
            id: crypto.randomUUID(),
            name: name,
            behavior: behavior,
            avatar: avatarUrl,
            ownerId: user!.id,
            isDefault: false
        };
        setAllAIPersonas(prev => [...prev, newAI]);
        setIsSaving(false);
    }

    return (
        <div>
             <h2 id="ai-settings-heading" className="text-2xl font-bold text-text-primary mb-6">AI Settings</h2>
            <SectionCard id="settings-ai-card">
                <div className="space-y-6">
                    <div>
                        <p className="font-semibold text-text-primary">Default AI Persona</p>
                        <p className="text-text-secondary mb-4 text-sm">Select an AI to be automatically added to any new study rooms you create. You can manage custom AIs on the Study Room page.</p>
                        <CustomDropdown
                            options={aiOptions}
                            value={defaultAI || ''}
                            onChange={(val) => setDefaultAI(val || null)}
                        />
                    </div>
                    
                    <div className="border-t border-border-color pt-6">
                         <p className="font-semibold text-text-primary">Custom AI Prompts</p>
                         <p className="text-text-secondary mb-4 text-sm">Advanced: Modify the system prompts used to generate AI suggestions. Changes are saved automatically.</p>
                         <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-text-secondary">Event Checklist Prompt</label>
                                    <button onClick={() => setAiPrompts(p => ({...p, event: DEFAULT_EVENT_SUGGESTION_PROMPT}))} className="text-xs font-semibold text-text-tertiary hover:text-white">Reset to Default</button>
                                </div>
                                <textarea name="event" value={aiPrompts.event} onChange={handlePromptChange} rows={4} className="form-input text-sm" />
                            </div>
                             <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-text-secondary">AI Persona Suggestion Prompt</label>
                                    <button onClick={() => setAiPrompts(p => ({...p, persona: DEFAULT_PERSONA_SUGGESTION_PROMPT}))} className="text-xs font-semibold text-text-tertiary hover:text-white">Reset to Default</button>
                                </div>
                                <textarea name="persona" value={aiPrompts.persona} onChange={handlePromptChange} rows={4} className="form-input text-sm" />
                            </div>
                         </div>
                    </div>
                    
                    {message && <p className="text-sm text-primary-accent flex items-center gap-2 pt-4"><CheckCircleIcon className="w-4 h-4"/>{message}</p>}
                    <button onClick={handleSave} className="btn btn-primary mt-4">Save AI Settings</button>
                </div>
            </SectionCard>
        </div>
    );
};

const TABS = [
  { id: 'account', label: 'Account', icon: <UserIcon className="w-5 h-5" /> },
  { id: 'timer', label: 'Timer', icon: <ClockIcon className="w-5 h-5" /> },
  { id: 'timetable', label: 'Timetable', icon: <CalendarDaysIcon className="w-5 h-5" /> },
  { id: 'ai', label: 'AI', icon: <SparklesIcon className="w-5 h-5" /> },
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('account');
  const { tutorialProgress, startTutorial, isDesktop } = useTutorial();

  const settingsTutorialSteps: TutorialStepConfig[] = useMemo(() => [
    {
        selector: '#settings-nav',
        title: 'Your Command Center',
        content: "This is where you can customize every aspect of StudySync to fit your personal workflow. Let's look at the options.",
        placement: 'right'
    },
    // Account section
    {
        selector: '#settings-tab-account',
        title: 'Account Settings',
        content: "First, let's look at your account settings. The tour will switch to this tab for you.",
        placement: 'right',
        action: () => setActiveTab('account'),
    },
    {
        selector: '#account-name-form',
        title: 'Update Your Name',
        content: "You can change your display name here. This is how you'll appear to others in Study Rooms.",
        placement: 'bottom',
    },
    {
        selector: '#account-password-form',
        title: 'Change Password',
        content: 'Keep your account secure by updating your password periodically.',
        placement: 'bottom',
    },
    {
        selector: '#account-security-form',
        title: 'Security Question',
        content: 'Update your security question and answer here. This is used for password recovery.',
        placement: 'bottom',
    },
    // Timer Section
    {
        selector: '#settings-tab-timer',
        title: 'Timer Settings',
        content: 'Next, you can adjust the focus and break durations for the Pomodoro timer.',
        placement: 'right',
        action: () => setActiveTab('timer'),
    },
    {
        selector: '#settings-timer-card',
        title: 'Customize Your Timer',
        content: 'Fine-tune the length of your work sprints and breaks to match your personal rhythm and maximize focus.',
        placement: 'bottom',
    },
    // Timetable Section
    {
        selector: '#settings-tab-timetable',
        title: 'Timetable Settings',
        content: "Here you can customize your schedule's appearance, from the hours shown to the colors of your events.",
        placement: 'right',
        action: () => setActiveTab('timetable'),
    },
    {
        selector: '#settings-timetable-card',
        title: 'Organize Your Schedule',
        content: 'Customize the visible hours and manage event categories for better visual organization. This is great for seeing your week at a glance.',
        placement: 'bottom',
    },
    // AI Section
    {
        selector: '#settings-tab-ai',
        title: 'AI Settings',
        content: "Finally, let's look at the advanced AI settings.",
        placement: 'right',
        action: () => setActiveTab('ai'),
    },
    {
        selector: '#settings-ai-card',
        title: 'Advanced AI Settings',
        content: "Here you can select a default AI partner and even customize the prompts StudySync uses to generate suggestions, tailoring the AI's behavior to your needs.",
        placement: isDesktop ? 'bottom' : 'left',
    },
    // Finish
    {
        selector: '#nav-link-settings',
        title: 'Tour Complete!',
        content: "You've finished the main tour! Feel free to explore and customize everything. You can access settings anytime from the user menu.",
        placement: 'bottom',
        desktopOnly: true,
        action: () => {
            const userMenuButton = document.getElementById('user-menu-button');
            const settingsLink = document.getElementById('nav-link-settings');
            if (userMenuButton && !settingsLink) {
                userMenuButton.click();
            }
        }
    }
], [isDesktop]);

  useEffect(() => {
    if (tutorialProgress.settings === 'unseen') {
        const timer = setTimeout(() => {
            startTutorial('settings', settingsTutorialSteps);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [tutorialProgress, startTutorial, settingsTutorialSteps]);

  const renderContent = () => {
    switch (activeTab) {
        case 'account': return <div id="settings-account"><AccountSettings /></div>;
        case 'timer': return <TimerSettings />;
        case 'timetable': return <TimetableSettings />;
        case 'ai': return <AISettings />;
        default: return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-10">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <aside className="md:w-64 md:flex-shrink-0">
          <nav id="settings-nav" className="flex flex-row overflow-x-auto md:flex-col gap-1 p-1">
            {TABS.map(tab => (
                 <button 
                    key={tab.id}
                    id={`settings-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm font-semibold whitespace-nowrap ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                 </button>
            ))}
          </nav>
        </aside>
        
        <main className="flex-grow" key={activeTab}>
          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;