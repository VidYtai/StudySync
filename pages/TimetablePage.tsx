
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TimetableSlot, ChecklistItem, EventCategory } from '../types';
import { DAYS_OF_WEEK, EVENT_CATEGORIES, EVENT_COLORS } from '../constants';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, TrashIcon, CheckCircleIcon, CircleIcon, SparklesIcon } from '../components/icons';
import { generateChecklistForEvent } from '../services/geminiService';
import { useTutorial, TutorialStepConfig } from '../contexts/TutorialContext';

interface TimetableConfig {
  startHour: number;
  endHour: number;
}

const ROW_HEIGHT_PER_HOUR = 96; 

const getToday = () => {
    const dayIndex = new Date().getDay(); 
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAYS_OF_WEEK[adjustedIndex];
}

interface EventFormProps {
    event: TimetableSlot;
    onSave: (event: TimetableSlot) => void;
    onDelete: (eventId: string) => void;
    eventCategories: EventCategory[];
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onDelete, eventCategories }) => {
    const [currentEvent, setCurrentEvent] = useState(event);
    const [newItemText, setNewItemText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isNewEvent] = useState(!event.title.trim()); 

    useEffect(() => {
        
        
        if (!eventCategories.some(c => c.name === currentEvent.category)) {
            setCurrentEvent(prev => ({...prev, category: eventCategories[0]?.name || 'Other'}));
        }
    }, [eventCategories, currentEvent.category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (itemId: string, newText: string) => {
        setCurrentEvent(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === itemId ? { ...item, text: newText } : item)
        }));
    };
    
    const toggleItemCompletion = (itemId: string) => {
        setCurrentEvent(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
        }));
    };

    const handleAddItem = () => {
        if (newItemText.trim() === "") return;
        const newItem: ChecklistItem = { id: crypto.randomUUID(), text: newItemText, completed: false };
        setCurrentEvent(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setNewItemText("");
    };

    const handleDeleteItem = (itemId: string) => {
        setCurrentEvent(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
    };

    const handleGenerateChecklist = async () => {
        if (!currentEvent.title) return;
        setIsGenerating(true);
        try {
            const storedPrompts = localStorage.getItem('studysync-ai-prompts');
            const customPrompts = storedPrompts ? JSON.parse(storedPrompts) : {};
            const checklistItems = await generateChecklistForEvent(currentEvent.title, customPrompts.event);
            const newItems: ChecklistItem[] = checklistItems.map(text => ({
                id: crypto.randomUUID(),
                text,
                completed: false,
            }));
            setCurrentEvent(prev => ({...prev, items: [...prev.items, ...newItems]}));
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    }

    const handleSave = () => {
        onSave(currentEvent);
    };

    const isSaveDisabled = !currentEvent.title.trim() || !currentEvent.startTime || !currentEvent.endTime;

    return (
        <div className="space-y-6">
            <div id="event-modal-title">
                <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                <input id="title" type="text" name="title" value={currentEvent.title} onChange={handleChange} className="form-input" placeholder="e.g. Chemistry Lecture" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="event-modal-time-controls">
                 <div>
                    <label htmlFor="day" className="block text-sm font-medium text-text-secondary mb-1">Day</label>
                    <select id="day" name="day" value={currentEvent.day} onChange={handleChange} className="form-input">
                        {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-text-secondary mb-1">Start Time</label>
                    <input id="startTime" type="time" name="startTime" value={currentEvent.startTime} onChange={handleChange} className="form-input" style={{ colorScheme: 'dark' }}/>
                </div>
                 <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-text-secondary mb-1">End Time</label>
                    <input id="endTime" type="time" name="endTime" value={currentEvent.endTime} onChange={handleChange} className="form-input" style={{ colorScheme: 'dark' }}/>
                </div>
            </div>
             <div id="event-modal-category-section">
                <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
                <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 -mb-2">
                    {eventCategories.map(category => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => setCurrentEvent(prev => ({ ...prev, category: category.name }))}
                            className="flex-shrink-0 w-20 rounded-lg p-2 transition-colors duration-200 hover:bg-white/5"
                            title={category.name}
                        >
                            <div className="flex flex-col items-center justify-center gap-1.5">
                                <div
                                    className={`w-8 h-8 rounded-full border border-white/10 transition-all duration-200 ${currentEvent.category === category.name ? 'ring-2 ring-offset-2 ring-offset-bg-color ring-white' : ''}`}
                                    style={{ backgroundColor: category.color }}
                                />
                                <span className={`text-xs font-medium truncate w-full transition-colors duration-200 ${currentEvent.category === category.name ? 'text-text-primary' : 'text-text-secondary'}`}>
                                    {category.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <div id="event-modal-checklist-header" className="flex justify-between items-center mt-4 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">Checklist</h3>
                    <button onClick={handleGenerateChecklist} disabled={!currentEvent.title || isGenerating} className="btn btn-secondary text-xs !py-1 !px-2 flex items-center gap-1.5">
                        {isGenerating ? 'Generating...' : <><SparklesIcon className="w-4 h-4" /> AI Suggest</>}
                    </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {currentEvent.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 group">
                             <button onClick={() => toggleItemCompletion(item.id)} aria-label="Toggle item completion">
                                {item.completed ? <CheckCircleIcon className="w-5 h-5 text-text-tertiary"/> : <CircleIcon className="w-5 h-5 text-text-tertiary"/>}
                            </button>
                            <input type="text" value={item.text} onChange={(e) => handleItemChange(item.id, e.target.value)} className={`flex-grow bg-transparent outline-none p-1 rounded transition-colors focus:bg-white/10 ${item.completed ? 'line-through text-text-tertiary' : 'text-text-primary'}`} placeholder="Checklist item"/>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-text-tertiary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete item"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                     {currentEvent.items.length === 0 && <p className="text-sm text-text-tertiary italic">No checklist items yet.</p>}
                </div>
                <form id="event-modal-checklist-form" onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="flex gap-2 mt-2">
                    <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Add new item..." className="flex-grow form-input !py-2 text-sm"/>
                    <button type="submit" className="btn btn-secondary text-sm !py-1 !px-3 flex-shrink-0">Add</button>
                </form>
            </div>
            
            <div className="flex justify-between items-center gap-3 pt-4">
                <button onClick={() => onDelete(currentEvent.id)} className="btn btn-danger" disabled={isNewEvent}>Delete</button>
                <button id="event-modal-save" onClick={handleSave} className="btn btn-primary" disabled={isSaveDisabled}>Save Event</button>
            </div>
        </div>
    );
};

const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const { tutorialProgress, startTutorial, isPromptActive, nextStep } = useTutorial();
  const [events, setEvents] = useLocalStorage<TimetableSlot[]>(`studysync-events-${user!.id}`, []);
  const [timetableConfig] = useLocalStorage<TimetableConfig>(
    `studysync-timetable-config-${user!.id}`,
    { startHour: 7, endHour: 22 }
  );
  const [eventCategories] = useLocalStorage<EventCategory[]>('studysync-event-categories', EVENT_CATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimetableSlot | null>(null);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<string>(getToday());
  const [eventsToAnimateOut, setEventsToAnimateOut] = useState<string[]>([]);

  const wasModalOpenedByTutorial = useRef(false);
  const prevIsPromptActive = useRef(isPromptActive);
  
  
  useEffect(() => {
    const needsMigration = events.some(e => e && typeof (e as any).color !== 'undefined' && typeof e.category === 'undefined');

    if (needsMigration) {
        console.log("Migrating timetable events to use categories...");
        const migratedEvents = events.map(e => {
            const eventObj = e as any;
            if (eventObj && typeof eventObj.color !== 'undefined' && typeof eventObj.category === 'undefined') {
                const { color, ...rest } = eventObj;
                const matchedCategory = eventCategories.find(c => c.color === color)?.name || eventCategories[0]?.name || 'Study';
                return { ...rest, category: matchedCategory };
            }
            return e;
        });
        setEvents(migratedEvents);
    }
    
  }, []); 


  useEffect(() => {
    
    if (prevIsPromptActive.current && !isPromptActive && wasModalOpenedByTutorial.current) {
        setIsModalOpen(false);
        wasModalOpenedByTutorial.current = false;
    }
    prevIsPromptActive.current = isPromptActive;
  }, [isPromptActive]);

  const handleOpenModal = (event: TimetableSlot | null) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      wasModalOpenedByTutorial.current = false;
  };

  const handleAddNewEvent = () => {
    const newEvent: TimetableSlot = {
      id: crypto.randomUUID(),
      day: view === 'day' ? selectedDay : DAYS_OF_WEEK[0],
      startTime: '09:00',
      endTime: '10:00',
      title: '',
      category: eventCategories[0]?.name || 'Study',
      items: [],
    };
    handleOpenModal(newEvent);
  };
  
  const handleAddNewEventForTutorial = () => {
      if (!isModalOpen) {
          wasModalOpenedByTutorial.current = true;
          handleAddNewEvent();
      }
  };
  
  const handleSaveAndProceedTutorial = () => {
    
    
    if (editingEvent) {
        
        const eventToSave = {
            ...editingEvent, 
            title: editingEvent.title || "My First Event",
            id: editingEvent.id || crypto.randomUUID(),
        };
        handleSaveEvent(eventToSave);
    }
    nextStep();
  };

  const timetableTutorialSteps: TutorialStepConfig[] = [
    {
        selector: '#timetable-view-controls',
        title: 'Your Visual Schedule',
        content: "Here you can visually plan your week. Use the buttons to switch between a full week view and a focused day view.",
        placement: 'bottom',
    },
    {
        selector: '#new-event-button',
        title: 'Add a New Event',
        content: "Click this to add a class, study session, or appointment. Let's create one now.",
        placement: 'bottom',
    },
    {
        selector: '#event-modal-title',
        title: 'Name Your Event',
        content: 'Give your event a descriptive title, like "Chem 101 Lecture" or "Study for Midterm".',
        placement: 'bottom',
        action: handleAddNewEventForTutorial,
    },
    {
        selector: '#event-modal-time-controls',
        title: 'Schedule Date & Time',
        content: 'Set the day of the week and the start/end times for your event here.',
        placement: 'bottom',
    },
    {
        selector: '#event-modal-category-section',
        title: 'Categorize Your Event',
        content: 'Select a category for your event. The color helps you keep your schedule organized at a glance.',
        placement: 'bottom',
    },
    {
        selector: '#event-modal-checklist-header',
        title: 'AI-Powered Checklists',
        content: "Or, let StudySync do the work! Click 'AI Suggest' to automatically generate a helpful checklist based on your event title.",
        placement: 'top',
    },
    {
        selector: '#event-modal-checklist-form',
        title: 'Add Manual Tasks',
        content: 'You can manually add your own sub-tasks or to-do items for this event right here.',
        placement: 'top',
    },
    {
        selector: '#event-modal-save',
        title: 'Save Your Event',
        content: "Once you're done, save the event, and it will appear on your timetable.",
        placement: 'top',
        action: () => {
            
        },
    },
    {
        selector: '#nav-link-todo',
        title: 'Manage Your Tasks',
        content: "Great! Now that you've scheduled your events, let's head over to the To-Do list to manage your assignments.",
        placement: 'right',
        desktopOnly: true,
        nextPath: '/app/todo',
        action: () => {
            
            if (wasModalOpenedByTutorial.current) {
                
                const event = editingEvent ?? {
                    id: crypto.randomUUID(),
                    day: view === 'day' ? selectedDay : DAYS_OF_WEEK[0],
                    startTime: '09:00', endTime: '10:00', title: '', category: eventCategories[0]?.name || 'Study', items: [],
                };
                 const eventToSave = {
                    ...event, 
                    title: event.title || "My First Event",
                };
                handleSaveEvent(eventToSave);
            }
        },
    },
];

  useEffect(() => {
    if (tutorialProgress.timetable === 'unseen') {
        const timer = setTimeout(() => {
            startTutorial('timetable', timetableTutorialSteps);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [tutorialProgress, startTutorial]);

  const TIMETABLE_HOURS = useMemo(() => {
    const hours = [];
    for (let i = timetableConfig.startHour; i <= timetableConfig.endHour; i++) {
        hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
  }, [timetableConfig]);

  const colorMap = useMemo(() => {
      return Object.fromEntries(eventCategories.map(cat => [cat.name, cat.color]));
  }, [eventCategories]);

  const getEventPosition = (event: TimetableSlot) => {
    try {
        const start = new Date(`1970-01-01T${event.startTime}`);
        const end = new Date(`1970-01-01T${event.endTime}`);
        if(isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return null;

        const startMinutes = (start.getHours() - timetableConfig.startHour) * 60 + start.getMinutes();
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;
        
        const top = (startMinutes / 60) * ROW_HEIGHT_PER_HOUR;
        const height = (durationMinutes / 60) * ROW_HEIGHT_PER_HOUR;

        if (top < 0 || top > ((timetableConfig.endHour - timetableConfig.startHour + 1) * ROW_HEIGHT_PER_HOUR)) return null;

        return { top: `${top}px`, height: `${height}px` };
    } catch {
        return null;
    }
  };

  const handleSaveEvent = (eventToSave: TimetableSlot) => {
    const index = events.findIndex(e => e.id === eventToSave.id);
    if (index > -1) {
      const updatedEvents = [...events];
      updatedEvents[index] = eventToSave;
      setEvents(updatedEvents);
    } else {
      setEvents([...events, eventToSave]);
    }
    handleCloseModal();
  };
  
  const handleDeleteEvent = (eventId: string) => {
      setEventsToAnimateOut(prev => [...prev, eventId]);
      handleCloseModal();
      setTimeout(() => {
          setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
          setEventsToAnimateOut(prev => prev.filter(id => id !== eventId));
      }, 300); 
  };

  const eventsByDay = useMemo(() => {
    const grouped: { [key: string]: TimetableSlot[] } = {};
    DAYS_OF_WEEK.forEach(day => {
      grouped[day] = events.filter(event => event.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [events]);

  return (
    <div className="w-full animate-fade-in">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight">Timetable</h1>
                <div id="timetable-view-controls" className="mt-4 inline-flex items-center bg-surface-hover p-1 rounded-lg">
                    <button onClick={() => setView('week')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'week' ? 'bg-primary-accent text-white' : 'text-text-secondary hover:text-white'}`}>Week</button>
                    <button onClick={() => setView('day')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'day' ? 'bg-primary-accent text-white' : 'text-text-secondary hover:text-white'}`}>Day</button>
                </div>
            </div>
            <button id="new-event-button" onClick={handleAddNewEvent} className="btn btn-primary flex items-center gap-2">
                <PlusIcon className="w-5 h-5"/>
                <span>New Event</span>
            </button>
        </div>

      {view === 'week' ? (
        <div key="week-view" className="glass-pane p-4 sm:p-6 animate-view-switch-in">
            <div className="flex">
                <div className="w-16 flex-shrink-0 pr-4">
                    <div className="h-10"></div>
                    {TIMETABLE_HOURS.map((hour) => (
                        <div key={hour} className="h-24 relative">
                            <span className="absolute -top-3 left-0 text-xs text-text-tertiary">
                                {hour}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="overflow-x-auto flex-grow">
                    <div className="grid grid-cols-7 min-w-[1050px] xl:min-w-[1200px]">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="relative border-l border-border-color-light">
                                <div className="sticky top-0 z-10 py-2 h-10 flex items-center justify-center">
                                    <div className="text-center font-semibold text-text-primary text-xs sm:text-sm">
                                        {day}
                                    </div>
                                </div>
                                <div className="relative">
                                    {TIMETABLE_HOURS.map((hour) => (
                                        <div key={hour} className="h-24 relative border-t border-dashed border-border-color-light"></div>
                                    ))}
                                    {eventsByDay[day].map(event => {
                                        const position = getEventPosition(event);
                                        if (!position) return null;
                                        const completedItems = event.items.filter(i => i.completed).length;
                                        const progress = event.items.length > 0 ? (completedItems / event.items.length) * 100 : 0;
                                        const bgColor = colorMap[event.category] || EVENT_COLORS[0];

                                        return (
                                            <div key={event.id} className={`absolute w-full px-1 transition-all duration-300 ease-in-out ${eventsToAnimateOut.includes(event.id) ? 'opacity-0 scale-95' : ''}`} style={{...position}} onClick={() => !eventsToAnimateOut.includes(event.id) && handleOpenModal(event)}>
                                                <div className="h-full rounded-lg p-1.5 md:p-2 flex flex-col cursor-pointer overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-offset-bg-color hover:ring-white/50 z-20" style={{backgroundColor: bgColor}}>
                                                    <div className="h-full w-full bg-black/30 backdrop-blur-sm rounded p-1.5 md:p-2 flex flex-col">
                                                        <p className="font-bold text-xs md:text-sm text-white truncate mb-1 pb-px">{event.title}</p>
                                                        <p className="text-[11px] md:text-xs text-white/80">{event.startTime} - {event.endTime}</p>
                                                        {event.items.length > 0 && (
                                                        <div className="mt-auto pt-1">
                                                            <div className="w-full bg-white/20 rounded-full h-1">
                                                                <div className="bg-white h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                                                            </div>
                                                        </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      ) : (
         <div key="day-view" className="glass-pane p-4 sm:p-6 animate-view-switch-in">
            <div className="flex justify-center flex-wrap gap-2 mb-4">
                {DAYS_OF_WEEK.map(day => (
                    <button key={day} onClick={() => setSelectedDay(day)} className={`px-4 py-2 text-sm font-semibold rounded-lg btn ${selectedDay === day ? 'btn-primary' : 'btn-secondary'}`}>
                        {day}
                    </button>
                ))}
            </div>
            <div key={selectedDay} className="flex pt-4 animate-view-switch-in">
                <div className="w-16 flex-shrink-0">
                    {TIMETABLE_HOURS.map((hour) => (
                        <div key={hour} className="h-24 relative">
                            <span className="absolute -top-3 left-2 text-xs text-text-tertiary">
                                {hour}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="relative flex-grow border-l border-border-color-light">
                    {TIMETABLE_HOURS.map((hour) => (
                        <div key={hour} className="h-24 relative border-t border-dashed border-border-color-light" />
                    ))}
                    {eventsByDay[selectedDay].map(event => {
                        const position = getEventPosition(event);
                        if (!position) return null;
                        const completedItems = event.items.filter(i => i.completed).length;
                        const progress = event.items.length > 0 ? (completedItems / event.items.length) * 100 : 0;
                        const bgColor = colorMap[event.category] || EVENT_COLORS[0];
                        
                        return (
                            <div key={event.id} className={`absolute w-full px-2 left-0 transition-all duration-300 ease-in-out ${eventsToAnimateOut.includes(event.id) ? 'opacity-0 scale-95' : ''}`} style={{...position}} onClick={() => !eventsToAnimateOut.includes(event.id) && handleOpenModal(event)}>
                                <div className="h-full rounded-lg p-2 flex flex-col cursor-pointer overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-offset-bg-color hover:ring-white/50 z-20" style={{backgroundColor: bgColor}}>
                                    <div className="h-full w-full bg-black/30 backdrop-blur-sm rounded-md p-3 flex flex-col">
                                        <p className="font-bold text-white truncate mb-1 pb-px">{event.title}</p>
                                        <p className="text-sm text-white/80">{event.startTime} - {event.endTime}</p>
                                        {event.items.length > 0 && (
                                        <div className="mt-auto pt-2">
                                            <div className="flex items-center text-sm text-white/80 mb-1">
                                                <CheckCircleIcon className="w-4 h-4 mr-1.5"/>
                                                <span>{completedItems}/{event.items.length} done</span>
                                            </div>
                                            <div className="w-full bg-white/20 rounded-full h-1.5">
                                                <div className="bg-white h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
         </div>
      )}
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEvent?.title && editingEvent.title !== '' ? "Edit Event" : "Add New Event"}>
        {editingEvent && (
            <EventForm
                event={editingEvent}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                eventCategories={eventCategories}
            />
        )}
      </Modal>

    </div>
  );
};

export default TimetablePage;
