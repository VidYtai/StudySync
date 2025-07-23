import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChatMessage, StudyRoom, User, AIPersona } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, TrashIcon, SparklesIcon, XIcon, UsersIcon } from '../components/icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { hashString } from '../utils/security';
import { DEFAULT_AI_PERSONAS } from '../constants';
import { generateAIChatResponse, generateAIPersonaSuggestion } from '../services/geminiService';
import Modal from '../components/Modal';
import { useTutorial, TutorialStepConfig } from '../contexts/TutorialContext';
import { defaultAvatarImage } from '../assets/images';

const joinRoomTutorialSteps: TutorialStepConfig[] = [
    {
        selector: '#lobby-main-box',
        title: 'Welcome to the Study Room!',
        content: "This is the lobby. From here you can join or create a private space to study with friends and AI partners.",
        placement: 'bottom',
    },
    {
        selector: '#join-room-form',
        title: 'Join an Existing Room',
        content: "If you know the name of a room, you can enter it here to join directly. No password is needed to join, only to create.",
        placement: 'bottom',
    },
    {
        selector: '#my-created-rooms-section',
        title: 'Your Created Rooms',
        content: "Rooms you create will be listed here for easy access. You can quickly join or delete them.",
        placement: 'top',
    },
    {
        selector: '#create-room-tab',
        title: 'Create Your Own Room',
        content: "You're currently on the 'Join' view. To continue the tour, please switch over to the 'Create Room' tab.",
        placement: 'bottom',
    },
];

const createRoomTutorialSteps: TutorialStepConfig[] = [
    {
        selector: '#create-room-form',
        title: 'Create Your Room',
        content: "Give your room a unique name and a password to keep it private. After you click 'Create', we'll give you a tour of the room itself!",
        placement: 'bottom',
    }
];

const formatTimestamp = (isoString: string | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const ChatBubble: React.FC<{ message: ChatMessage; isCurrentUser: boolean, senderAvatar?: string; }> = ({ message, isCurrentUser, senderAvatar }) => {
    const bubbleClasses = isCurrentUser
        ? 'bg-primary-accent text-white rounded-br-none'
        : 'bg-surface-hover text-text-primary rounded-bl-none';
    
    const senderIsAI = message.senderName.includes('(AI)');

    return (
        <div className={`flex w-full mt-2 space-x-3 max-w-lg animate-slide-up-in transform-gpu ${isCurrentUser ? 'ml-auto justify-end' : ''}`}>
             {!isCurrentUser && (
                 <div className="w-10 h-10 rounded-full bg-surface-hover flex-shrink-0 flex items-center justify-center font-bold overflow-hidden">
                    {senderAvatar ? (
                        <img src={senderAvatar} alt="" className="w-full h-full object-cover"/>
                    ) : senderIsAI ? (
                        <SparklesIcon className="w-5 h-5 text-blue-400" /> 
                    ) : (
                        message.senderName.charAt(0).toUpperCase()
                    )}
                 </div>
             )}
            <div>
                 <div className={`p-3 rounded-xl ${bubbleClasses}`}>
                    {!isCurrentUser && <p className="text-sm font-semibold mb-1" style={{color: senderIsAI ? '#60A5FA' : 'var(--primary-accent)'}}>{message.senderName}</p>}
                    <p className="text-sm leading-relaxed break-words">{message.text}</p>
                </div>
                <span className={`text-xs text-text-tertiary leading-none ${isCurrentUser ? 'float-right mr-1 mt-1' : 'ml-1 mt-1'}`}>
                    {formatTimestamp(message.timestamp)}
                </span>
            </div>
        </div>
    );
};

const LobbyView: React.FC<{
  roomNameInput: string;
  setRoomNameInput: (value: string) => void;
  passwordInput: string;
  setPasswordInput: (value: string) => void;
  error: string;
  handleJoinRoom: (e: React.FormEvent) => Promise<void>;
  handleCreateRoom: (e: React.FormEvent) => Promise<void>;
  createdRooms: StudyRoom[];
  onJoinCreatedRoom: (room: StudyRoom) => void;
  onDeleteRoomClick: (room: StudyRoom) => void;
  view: 'join' | 'create';
  setView: (view: 'join' | 'create') => void;
}> = ({
    roomNameInput, setRoomNameInput, passwordInput, setPasswordInput, error, handleJoinRoom, handleCreateRoom, createdRooms, onJoinCreatedRoom, onDeleteRoomClick, view, setView
}) => {
    return (
    <div id="study-room-lobby" className="w-full max-w-md mx-auto animate-fade-in pt-12 pb-12">
        <div id="lobby-main-box" className="glass-pane p-8">
            <div id="create-room-tab" className="flex justify-center border-b border-border-color mb-6 relative">
                <button onClick={() => setView('join')} className={`w-1/2 py-3 font-semibold transition-colors text-center ${view === 'join' ? 'text-white' : 'text-text-secondary hover:text-text-primary'}`}>Join Room</button>
                <button onClick={() => setView('create')} className={`w-1/2 py-3 font-semibold transition-colors text-center ${view === 'create' ? 'text-white' : 'text-text-secondary hover:text-text-primary'}`}>Create Room</button>
                <div className="absolute bottom-[-1px] left-0 h-0.5 bg-white transition-transform duration-300 ease-in-out" style={{ width: '50%', transform: view === 'join' ? 'translateX(0%)' : 'translateX(100%)' }} />
            </div>
            
            <div key={view} className="animate-fade-in" style={{animationDuration: '0.5s'}}>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-2">{view === 'join' ? 'Join a Study Room' : 'Create a New Room'}</h1>
                <p className="text-text-secondary text-center mb-8">{view === 'join' ? 'Enter the room name to join.' : 'Set a name and password for your new room.'}</p>
                
                <form id={view === 'join' ? 'join-room-form' : 'create-room-form'} onSubmit={view === 'join' ? handleJoinRoom : handleCreateRoom} className="space-y-6">
                    <input
                        type="text" value={roomNameInput} onChange={e => setRoomNameInput(e.target.value)}
                        placeholder="Room Name" required className="form-input"
                    />
                    {view === 'create' && (
                        <input
                            type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
                            placeholder="Password" required className="form-input"
                        />
                    )}
                    {error && <p className="text-sm font-medium text-red-400">{error}</p>}
                    <button type="submit" className="w-full btn btn-primary">
                        {view === 'join' ? 'Join' : 'Create'}
                    </button>
                </form>

                 {view === 'join' && (
                    <div id="my-created-rooms-section" className="mt-8 pt-6 border-t border-border-color">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">My Created Rooms</h2>
                        {createdRooms.length > 0 ? (
                            <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {createdRooms.map(room => (
                                    <li key={room.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors group">
                                        <span className="font-medium text-text-primary truncate pr-2">{room.name}</span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => onJoinCreatedRoom(room)} className="btn btn-secondary text-xs !py-1 !px-2">Join</button>
                                            <button onClick={() => onDeleteRoomClick(room)} className="p-2 text-text-tertiary hover:text-red-400 rounded-full hover:bg-red-500/20 transition-colors" aria-label={`Delete room ${room.name}`}>
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary italic text-center py-4">You haven't created any rooms yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
    );
};

const AIManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    allAIPersonas: AIPersona[];
    setAllAIPersonas: React.Dispatch<React.SetStateAction<AIPersona[]>>;
    onDeleteAI: (idToDelete: string) => boolean;
    defaultAIId: string | null;
    setDefaultAIId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ isOpen, onClose, allAIPersonas, setAllAIPersonas, onDeleteAI, defaultAIId, setDefaultAIId }) => {
    const { user } = useAuth();
    const [editingAI, setEditingAI] = useState<AIPersona | null>(null);
    const [aiName, setAIName] = useState('');
    const [aiBehavior, setAIBehavior] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [modalError, setModalError] = useState('');

    const handleEdit = (ai: AIPersona) => {
        setModalError('');
        setEditingAI(ai);
        setAIName(ai.name);
        setAIBehavior(ai.behavior);
    };

    const handleNew = () => {
        setEditingAI(null);
        setAIName('');
        setAIBehavior('');
    };

    const handleSuggestAI = async () => {
        setIsSuggesting(true);
        try {
            const storedPrompts = localStorage.getItem('studysync-ai-prompts');
            const customPrompts = storedPrompts ? JSON.parse(storedPrompts) : {};
            const suggestion = await generateAIPersonaSuggestion(customPrompts.persona);
            if (suggestion) {
                setAIName(suggestion.name);
                setAIBehavior(suggestion.behavior);
            }
        } catch (error) {
            console.error("Failed to suggest AI persona", error);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSave = () => {
        if (!aiName.trim() || !aiBehavior.trim()) return;
        setModalError('');
        if (editingAI) {
            setAllAIPersonas(allAIPersonas.map(p => p.id === editingAI.id ? { ...p, name: aiName.trim(), behavior: aiBehavior.trim() } : p));
        } else {
            const newAI: AIPersona = {
                id: crypto.randomUUID(),
                name: aiName.trim(),
                behavior: aiBehavior.trim(),
                ownerId: user!.id,
                isDefault: false
            };
            setAllAIPersonas([...allAIPersonas, newAI]);
        }
        handleNew();
    };
    
    const handleDelete = (idToDelete: string) => {
        setModalError('');
        const success = onDeleteAI(idToDelete);
        if (!success) {
            setModalError("You must keep at least one AI persona.");
            setTimeout(() => setModalError(''), 3000);
            return;
        }
        
        
        if (editingAI?.id === idToDelete) {
            handleNew();
        }
    };

    const isFormEmpty = !aiName.trim() && !aiBehavior.trim();

    useEffect(() => {
        if (!isOpen) {
            handleNew();
            setModalError('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage AI Personas">
            <div className="space-y-6">
                 {modalError && (
                    <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-400/20 rounded-lg animate-fade-in" role="alert">
                        {modalError}
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">AIs</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {allAIPersonas.map(ai => (
                            <div key={ai.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img src={ai.avatar || defaultAvatarImage} alt={`${ai.name} avatar`} className="w-8 h-8 rounded-full bg-surface-color object-cover"/>
                                    <span className="font-medium text-text-primary">{ai.name}</span>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => handleEdit(ai)} className="text-sm text-blue-400 hover:text-blue-300">Edit</button>
                                    <button onClick={() => handleDelete(ai.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                                </div>
                            </div>
                        ))}
                        {allAIPersonas.length === 0 && (
                            <p className="text-sm text-text-secondary italic text-center py-4">No AI personas available.</p>
                        )}
                    </div>
                </div>
                
                <div className="border-t border-border-color pt-4" id="create-new-ai-form">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="text-lg font-semibold text-text-primary">{editingAI ? `Edit: ${editingAI.name}` : 'Create New AI'}</h3>
                         {!editingAI && (
                            <button id="suggest-ai-button" onClick={handleSuggestAI} disabled={isSuggesting} className="btn btn-secondary text-xs !py-1 !px-2 flex items-center gap-1.5">
                                {isSuggesting ? 'Generating...' : <><SparklesIcon className="w-4 h-4" /> Suggest AI</>}
                            </button>
                         )}
                     </div>
                     <div className="space-y-3">
                         <input type="text" value={aiName} onChange={e => setAIName(e.target.value)} placeholder="AI Name (e.g., 'Study Buddy')" className="form-input" />
                         <textarea value={aiBehavior} onChange={e => setAIBehavior(e.target.value)} placeholder="AI Behavior (e.g., 'You are a helpful and friendly study partner...')" rows={3} className="form-input" />
                         <div className="flex justify-end gap-2">
                            <button
                                onClick={handleNew}
                                className="btn btn-secondary text-sm"
                                disabled={!editingAI && isFormEmpty}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary text-sm"
                                disabled={!aiName.trim() || !aiBehavior.trim()}
                            >
                                {editingAI ? 'Save Changes' : 'Create AI'}
                            </button>
                         </div>
                     </div>
                </div>
            </div>
        </Modal>
    );
};

const ParticipantsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Details">
        <div className="space-y-6">{children}</div>
    </Modal>
);

const StudyRoomPage: React.FC = () => {
  const { user, findUserById } = useAuth();
  const { tutorialProgress, startTutorial, isPromptActive, isDesktop } = useTutorial();
  const [rooms, setRooms] = useLocalStorage<StudyRoom[]>('studysync-rooms', []);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('studysync-messages', []);
  const [allAIPersonas, setAllAIPersonas] = useLocalStorage<AIPersona[]>('studysync-aiPersonas', DEFAULT_AI_PERSONAS);
  const [currentRoom, setCurrentRoom] = useLocalStorage<StudyRoom | null>('studysync-currentRoom', null);
  const [defaultAIId, setDefaultAI] = useLocalStorage<string | null>(`studysync-defaultAI-${user!.id}`, null);

  const [roomNameInput, setRoomNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [lobbyView, setLobbyView] = useState<'join' | 'create'>('join');
  
  const [isAIManagementOpen, setIsAIManagementOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<StudyRoom | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [participants, setParticipants] = useState<(User | AIPersona)[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [participantsError, setParticipantsError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  const participantsModalOpenedByTutorial = useRef(false);
  const aiManagementModalOpenedByTutorial = useRef(false);
  const prevIsPromptActive = useRef(isPromptActive);

  const inRoomTutorialSteps: TutorialStepConfig[] = useMemo(() => {
    const firstAiInRoom = currentRoom ? allAIPersonas.find(p => currentRoom.aiMemberIds.includes(p.id)) : null;
    
    let steps: TutorialStepConfig[] = [];

    
    steps.push({
        selector: '#chat-window',
        title: 'Your Private Study Room',
        content: "This is your private space to chat. You can talk with friends or get help from an AI partner by mentioning them (e.g., '@ProfessorSynapse').",
        placement: 'right'
    });

    
    if (firstAiInRoom) {
        
        steps.push({
            selector: `#participant-${firstAiInRoom.id}`,
            title: 'Your AI Assistant',
            content: `Meet ${firstAiInRoom.name}! We've automatically added this AI to the room to help you get started. Try asking it a question!`,
            placement: 'left',
            desktopOnly: true,
        });
        
        steps.push({
             selector: `#invite-ais-button`,
             title: 'Your AI Assistant',
             content: `Meet ${firstAiInRoom.name}! Tap here to see the participant list, where you'll find your new AI partner. The tour will open it for you.`,
             placement: 'bottom',
             mobileOnly: true,
        });
        steps.push({
             selector: `#participant-${firstAiInRoom.id}`,
             title: 'Say Hello!',
             content: `${firstAiInRoom.name} is here to help you study. Try asking it a question or for some motivation later!`,
             placement: 'bottom',
             mobileOnly: true,
             action: () => {
                 if (!isParticipantsModalOpen) {
                     participantsModalOpenedByTutorial.current = true;
                     setIsParticipantsModalOpen(true);
                 }
             },
        });
    }

    
    steps.push({
        selector: '#invite-ai-section',
        title: 'Invite More AIs',
        content: 'You can add other specialized AIs to your room. They can answer questions, provide motivation, and help you study.',
        placement: 'left',
        desktopOnly: true,
    },
     {
        selector: '#manage-ai-button',
        title: 'Manage Custom AIs',
        content: "Don't see an AI you like? Click here to create your own with custom personalities. The tour will open this for you.",
        placement: 'left',
        desktopOnly: true,
    },
    
    {
        selector: '#invite-ai-section',
        title: 'Invite More AIs',
        content: 'You can add other specialized AIs to your room from this list.',
        placement: 'top',
        mobileOnly: true,
    },
     {
        selector: '#manage-ai-button',
        title: 'Manage Custom AIs',
        content: "Don't see an AI you like? Click here to create your own with custom personalities. The tour will open this for you.",
        placement: 'top',
        mobileOnly: true,
    },
    
    {
        selector: '#create-new-ai-form',
        title: 'Create a Persona',
        content: "Define a name and behavior for your AI. The behavior acts as its core instructions, shaping its personality and purpose.",
        placement: 'bottom',
        action: () => {
            if (!isAIManagementOpen) {
                if (window.innerWidth < 1024 && isParticipantsModalOpen && participantsModalOpenedByTutorial.current) {
                    setIsParticipantsModalOpen(false);
                    participantsModalOpenedByTutorial.current = false;
                }
                aiManagementModalOpenedByTutorial.current = true;
                setIsAIManagementOpen(true);
            }
        }
    },
    {
        selector: '#suggest-ai-button',
        title: 'Get Suggestions',
        content: "Feeling uninspired? Click here and StudySync will generate a creative AI persona for you!",
        placement: 'bottom'
    },
    {
        selector: '#nav-link-settings',
        title: "Customize Your Experience",
        content: "You've now seen all the core features of StudySync! You can access settings anytime from this user menu. Happy studying!",
        placement: 'bottom',
        desktopOnly: true,
        action: () => {
            const userMenuButton = document.getElementById('user-menu-button');
            const settingsLink = document.getElementById('nav-link-settings');
            
            if (userMenuButton && !settingsLink) {
                userMenuButton.click();
            }
        },
        nextPath: '/app/settings',
    });

    return steps;
  }, [isAIManagementOpen, isParticipantsModalOpen, currentRoom, allAIPersonas]);
  
  useEffect(() => {
    if (prevIsPromptActive.current && !isPromptActive) {
      if (participantsModalOpenedByTutorial.current) {
        setIsParticipantsModalOpen(false);
        participantsModalOpenedByTutorial.current = false;
      }
      if (aiManagementModalOpenedByTutorial.current) {
        setIsAIManagementOpen(false);
        aiManagementModalOpenedByTutorial.current = false;
      }
    }
    prevIsPromptActive.current = isPromptActive;
  }, [isPromptActive]);

  useEffect(() => {
    if (tutorialProgress.studyRoomJoin === 'unseen' && !currentRoom) {
        const timer = setTimeout(() => {
            startTutorial('studyRoomJoin', joinRoomTutorialSteps);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [tutorialProgress, startTutorial, currentRoom]);

  useEffect(() => {
    if (lobbyView === 'create' && tutorialProgress.studyRoomCreate === 'unseen' && tutorialProgress.studyRoomJoin === 'seen' && !currentRoom) {
      const timer = setTimeout(() => {
          startTutorial('studyRoomCreate', createRoomTutorialSteps);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lobbyView, tutorialProgress, startTutorial, currentRoom]);

  useEffect(() => {
    if (tutorialProgress.studyRoomInRoom === 'unseen' && currentRoom) {
      const timer = setTimeout(() => {
        startTutorial('studyRoomInRoom', inRoomTutorialSteps);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [tutorialProgress, startTutorial, currentRoom, inRoomTutorialSteps]);

  const roomMessages = useMemo(() => {
    return messages
        .filter(m => m.roomId === currentRoom?.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentRoom]);

  const createdRooms = useMemo(() => rooms.filter(r => r.ownerId === user!.id), [rooms, user]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  useEffect(() => {
      if (!currentRoom) return;
      
      const fetchParticipants = async () => {
          const userPromises = currentRoom.memberIds.map(id => findUserById(id));
          const users = (await Promise.all(userPromises)).filter((u): u is User => u !== null);
          const aiMembers = allAIPersonas.filter(p => currentRoom.aiMemberIds.includes(p.id));
          setParticipants([...users, ...aiMembers]);
      };

      fetchParticipants();
  }, [currentRoom, findUserById, allAIPersonas]);


  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const roomToJoin = rooms.find(r => r.name.toLowerCase() === roomNameInput.toLowerCase());
    if (!roomToJoin) {
      setError('Room not found.');
      return;
    }

    

    let roomWithCurrentUser = roomToJoin;
    if (!roomToJoin.memberIds.includes(user!.id)) {
      const updatedRooms = rooms.map(r => {
        if (r.id === roomToJoin.id) {
          roomWithCurrentUser = { ...r, memberIds: [...r.memberIds, user!.id] };
          return roomWithCurrentUser;
        }
        return r;
      });
      setRooms(updatedRooms);
    }

    setCurrentRoom(roomWithCurrentUser);
    setPasswordInput(''); 
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (rooms.some(r => r.name.toLowerCase() === roomNameInput.toLowerCase())) {
        setError('A room with this name already exists.'); return;
    }
    
    const hashedPassword = await hashString(passwordInput);
    
    let initialAiMemberIds: string[] = [];
    
    
    if (defaultAIId && allAIPersonas.some(p => p.id === defaultAIId)) {
        initialAiMemberIds.push(defaultAIId);
    } 
    
    else if (allAIPersonas.length === 1) {
        initialAiMemberIds.push(allAIPersonas[0].id);
    }
    
    else {
        const firstOriginalDefault = allAIPersonas.find(p => p.id === DEFAULT_AI_PERSONAS[0]?.id);
        if (firstOriginalDefault) {
            initialAiMemberIds.push(firstOriginalDefault.id);
        } 
        
        else if (allAIPersonas.length > 0) {
             initialAiMemberIds.push(allAIPersonas[0].id);
        }
    }
    
    const newRoom: StudyRoom = {
        id: crypto.randomUUID(),
        name: roomNameInput,
        password: hashedPassword,
        ownerId: user!.id,
        memberIds: [user!.id],
        aiMemberIds: initialAiMemberIds,
    };
    setRooms([...rooms, newRoom]);
    setCurrentRoom(newRoom);
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    
    const updatedRooms = rooms.map(room => {
        if (room.id === currentRoom.id) {
            return { ...room, memberIds: room.memberIds.filter(id => id !== user!.id) };
        }
        return room;
    }).filter(room => room.memberIds.length > 0 || room.ownerId === user?.id); 

    setRooms(updatedRooms);
    setCurrentRoom(null);
  };

  const handleJoinCreatedRoom = (room: StudyRoom) => {
    setCurrentRoom(room);
  };

  const handleOpenDeleteModal = (room: StudyRoom) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setDeleteError('');

    const hashedPassword = await hashString(deletePassword);
    if (hashedPassword !== roomToDelete.password) {
        setDeleteError('Incorrect password.');
        return;
    }
    
    setRooms(prev => prev.filter(r => r.id !== roomToDelete.id));
    setMessages(prev => prev.filter(m => m.roomId !== roomToDelete.id));

    setIsDeleteModalOpen(false);
    setRoomToDelete(null);
  };
  
  const triggerAIResponses = async (lastMessage: ChatMessage) => {
    if (!currentRoom) return;
    const aiMembers = allAIPersonas.filter(p => currentRoom.aiMemberIds.includes(p.id));
    if (aiMembers.length === 0) return;

    const mentionRegex = /^@([\w-]+)/;
    const match = lastMessage.text.match(mentionRegex);
    let triggeredAIs: AIPersona[] = [];
    let messageForAI = lastMessage.text;

    if (match) {
        const mentionedName = match[1].toLowerCase();
        const mentionedAI = aiMembers.find(ai => ai.name.toLowerCase().replace(/\s/g, '') === mentionedName);
        if (mentionedAI) {
            triggeredAIs.push(mentionedAI);
            messageForAI = lastMessage.text.replace(mentionRegex, '').trim();
        }
    }
    
    if (triggeredAIs.length === 0) triggeredAIs = aiMembers;

    const chatHistoryForAI = [...roomMessages, lastMessage].slice(-10);

    const responsePromises = triggeredAIs.map(ai => {
        return new Promise<void>(resolve => {
            setTimeout(async () => {
                const isDirectMention = !!match && triggeredAIs.some(t => t.id === ai.id);
                try {
                    const aiResponseText = await generateAIChatResponse(ai, chatHistoryForAI, { ...lastMessage, text: messageForAI }, isDirectMention);
                    
                    if (aiResponseText) {
                        const aiMessage: ChatMessage = {
                            id: crypto.randomUUID(), roomId: currentRoom.id, text: aiResponseText,
                            senderId: ai.id, senderName: `${ai.name} (AI)`, timestamp: new Date().toISOString()
                        };
                        setMessages(prev => [...prev, aiMessage]);
                    }
                } catch (error) {
                    console.error(`Error generating AI response for ${ai.name}:`, error);
                } finally {
                    resolve();
                }
            }, Math.random() * 1500 + 500);
        });
    });

    await Promise.all(responsePromises);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentRoom || isSending) return;

    
    setIsSending(true);

    const textToSend = newMessage;
    setNewMessage(''); 

    const message: ChatMessage = {
        id: crypto.randomUUID(),
        roomId: currentRoom.id,
        text: textToSend,
        senderId: user!.id,
        senderName: user!.name,
        timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, message]);
    
    
    messageInputRef.current?.focus();

    
    triggerAIResponses(message).finally(() => {
        
        setIsSending(false);
    });
  };

  const addAIToRoom = (aiId: string) => {
      if (!currentRoom || currentRoom.aiMemberIds.includes(aiId)) return;
      const updatedRoom = { ...currentRoom, aiMemberIds: [...currentRoom.aiMemberIds, aiId] };
      setCurrentRoom(updatedRoom);
      setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
  };
  
  const removeAIFromRoom = (aiId: string) => {
      if (!currentRoom) return;
      
      
      setParticipantsError('');
  
      if (currentRoom.aiMemberIds.length > 1) {
          const updatedRoom = { ...currentRoom, aiMemberIds: currentRoom.aiMemberIds.filter(id => id !== aiId) };
          setCurrentRoom(updatedRoom);
          setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
          return;
      }
      
      
      const replacementCandidates = allAIPersonas.filter(p => p.id !== aiId);
      if (replacementCandidates.length === 0) {
          
          
          setParticipantsError("You must keep at least one AI in the room. No replacements are available.");
          setTimeout(() => setParticipantsError(''), 4000);
          return;
      }
  
      let replacementAI: AIPersona | undefined;
  
      if (defaultAIId) {
          replacementAI = replacementCandidates.find(p => p.id === defaultAIId);
      }
      if (!replacementAI) {
          replacementAI = replacementCandidates.find(p => p.isDefault);
      }
      if (!replacementAI) {
          replacementAI = replacementCandidates[0];
      }
      
      if (replacementAI) {
          const updatedRoom = { ...currentRoom, aiMemberIds: [replacementAI.id] };
          setCurrentRoom(updatedRoom);
          setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      } else {
        
        setParticipantsError("Could not find a suitable AI to replace the last one.");
        setTimeout(() => setParticipantsError(''), 4000);
      }
  };

  const handleDeleteAIPersona = (idToDelete: string): boolean => {
    if (allAIPersonas.length <= 1) {
        return false; 
    }

    const remainingPersonas = allAIPersonas.filter(p => p.id !== idToDelete);
    
    const updatedRooms = rooms.map(room => {
        if (!room.aiMemberIds.includes(idToDelete)) {
            return room;
        }

        const updatedAiMemberIds = room.aiMemberIds.filter(id => id !== idToDelete);

        if (updatedAiMemberIds.length > 0) {
            return { ...room, aiMemberIds: updatedAiMemberIds };
        } else {
            const replacementCandidates = remainingPersonas;
            
            let replacementAI: AIPersona | undefined;
            
            if (defaultAIId) {
                replacementAI = replacementCandidates.find(p => p.id === defaultAIId);
            }
            if (!replacementAI) {
                replacementAI = replacementCandidates.find(p => p.isDefault);
            }
            if (!replacementAI) {
                replacementAI = replacementCandidates[0];
            }

            if (replacementAI) {
                return { ...room, aiMemberIds: [replacementAI.id] };
            } else {
                return { ...room, aiMemberIds: [] };
            }
        }
    });

    setRooms(updatedRooms);

    const updatedCurrentRoom = updatedRooms.find(r => r.id === currentRoom?.id);
    if (updatedCurrentRoom && JSON.stringify(updatedCurrentRoom) !== JSON.stringify(currentRoom)) {
        setCurrentRoom(updatedCurrentRoom);
    }
    
    setAllAIPersonas(remainingPersonas);

    if (idToDelete === defaultAIId) {
        setDefaultAI(remainingPersonas.length === 1 ? remainingPersonas[0].id : null);
    }
    
    return true; 
  };
  
  const defaultAIsFromState = allAIPersonas.filter(ai => ai.isDefault);
  const customUserAIs = allAIPersonas.filter(ai => ai.ownerId === user!.id && !ai.isDefault);
  const availableAIsToAdd = [...defaultAIsFromState, ...customUserAIs].filter(ai => currentRoom && !currentRoom.aiMemberIds.includes(ai.id));

  const participantAvatars = useMemo(() => {
    return new Map(participants.map(p => [p.id, ('avatar' in p && p.avatar) ? p.avatar : undefined]));
  }, [participants]);

  const SidebarContent: React.FC = () => (
    <>
        <div id="participants-list" className="glass-pane p-4 flex-grow flex flex-col min-h-0">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0">Participants ({participants.length})</h2>
            {participantsError && (
                <div className="p-2 mb-2 text-xs text-red-400 bg-red-500/10 border border-red-400/20 rounded-lg animate-fade-in" role="alert">
                    {participantsError}
                </div>
            )}
            <ul className="space-y-2 overflow-y-auto flex-grow">
                {participants.map(p => {
                    const isAI = 'behavior' in p;
                    const canRemove = isAI && currentRoom?.ownerId === user?.id;

                    return (
                       <li key={p.id} id={`participant-${p.id}`} className="flex items-center justify-between text-text-primary p-2 rounded-md bg-white/5 group">
                           <div className="flex items-center gap-3 overflow-hidden">
                             <div className="w-8 h-8 rounded-full bg-surface-hover flex-shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden">
                               {isAI && p.avatar ? (
                                   <img src={p.avatar} alt={`${p.name} avatar`} className="w-full h-full object-cover"/>
                               ) : isAI ? (
                                   <SparklesIcon className="w-4 h-4 text-blue-400"/>
                               ) : (
                                   p.name.charAt(0)
                               )}
                             </div>
                             <span className="truncate">{p.name}{isAI && ' (AI)'}</span>
                           </div>
                           {canRemove && (
                             <button
                                onClick={() => removeAIFromRoom(p.id)}
                                aria-label={`Remove ${p.name}`}
                                title={`Remove ${p.name}`}
                                className="text-text-tertiary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <XIcon className="w-4 h-4" />
                             </button>
                           )}
                       </li>
                    );
                })}
            </ul>
        </div>
        <div id="invite-ai-section" className="glass-pane p-4 flex-shrink-0">
            <h2 className="text-lg font-semibold mb-3">Invite AI</h2>
             <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-4">
                {availableAIsToAdd.map(ai => (
                    <div
                        key={ai.id}
                        onClick={() => addAIToRoom(ai.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addAIToRoom(ai.id); } }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Add ${ai.name}`}
                        className="flex items-center justify-between p-2 rounded-md bg-white/5 hover:bg-white/10 group cursor-pointer transition-colors"
                    >
                        <span className="text-text-primary">{ai.name}</span>
                        <div className="p-1 rounded-full text-text-tertiary group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" aria-hidden="true">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
                 {availableAIsToAdd.length === 0 && <p className="text-sm text-text-secondary italic">All available AIs are in the room.</p>}
            </div>
             <button id="manage-ai-button" onClick={() => setIsAIManagementOpen(true)} className="w-full btn btn-secondary text-sm">
               Manage My AIs
            </button>
        </div>
    </>
  );

  if (!currentRoom) {
    return (
      <>
        <LobbyView
          roomNameInput={roomNameInput} setRoomNameInput={setRoomNameInput}
          passwordInput={passwordInput} setPasswordInput={setPasswordInput}
          error={error}
          handleJoinRoom={handleJoinRoom} handleCreateRoom={handleCreateRoom}
          createdRooms={createdRooms}
          onJoinCreatedRoom={handleJoinCreatedRoom}
          onDeleteRoomClick={handleOpenDeleteModal}
          view={lobbyView}
          setView={setLobbyView}
        />
        <Modal 
            isOpen={isDeleteModalOpen} 
            onClose={() => setIsDeleteModalOpen(false)}
            title={`Delete Room: "${roomToDelete?.name}"`}
        >
            <form onSubmit={(e) => { e.preventDefault(); handleDeleteRoom(); }} className="space-y-4">
                <p>To confirm, please enter the password for this room. This action cannot be undone.</p>
                <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                    placeholder="Room Password"
                    className="form-input"
                    autoFocus
                />
                {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-danger">Confirm Delete</button>
                </div>
            </form>
        </Modal>
      </>
    );
  }

  return (
    <div className={`w-full animate-fade-in ${currentRoom ? 'h-full' : ''}`}>
        <div className="flex h-full gap-6">
            {/* Main Chat Area */}
            <div id="chat-window" className="flex-grow flex flex-col glass-pane p-0 overflow-hidden">
                <div className="p-4 border-b border-border-color flex justify-between items-center flex-shrink-0">
                    <h1 className="text-xl font-bold text-text-primary truncate pr-4">{currentRoom.name}</h1>
                    <div className="flex items-center gap-2">
                        <button id="invite-ais-button" onClick={() => setIsParticipantsModalOpen(true)} className="btn btn-secondary lg:hidden !py-1.5 !px-3 text-sm flex items-center gap-2">
                            <UsersIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">Participants</span>
                        </button>
                        <button onClick={handleLeaveRoom} className="btn btn-danger !py-1.5 !px-3 text-sm">Leave Room</button>
                    </div>
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {roomMessages.map((msg) => (
                        <ChatBubble 
                          key={msg.id} 
                          message={msg} 
                          isCurrentUser={msg.senderId === user!.id}
                          senderAvatar={participantAvatars.get(msg.senderId)}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border-color flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                            ref={messageInputRef}
                            type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message... (@AIName to mention)" className="form-input"
                        />
                        <button type="submit" disabled={!newMessage.trim() || isSending} className="btn btn-primary">
                            Send
                        </button>
                    </form>
                </div>
            </div>

            {/* Sidebar */}
            {isDesktop && (
              <div className="w-72 flex-shrink-0 space-y-6 flex flex-col">
                  <SidebarContent />
              </div>
            )}
        </div>
      <AIManagementModal
        isOpen={isAIManagementOpen}
        onClose={() => setIsAIManagementOpen(false)}
        allAIPersonas={allAIPersonas}
        setAllAIPersonas={setAllAIPersonas}
        onDeleteAI={handleDeleteAIPersona}
        defaultAIId={defaultAIId}
        setDefaultAIId={setDefaultAI}
      />
      {!isDesktop && (
        <ParticipantsModal isOpen={isParticipantsModalOpen} onClose={() => { setIsParticipantsModalOpen(false); setParticipantsError(''); }}>
           <SidebarContent />
        </ParticipantsModal>
      )}
    </div>
  );
};

export default StudyRoomPage;
