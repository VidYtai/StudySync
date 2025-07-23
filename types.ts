export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  datetime: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
}

export interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  title: string;
  category: string; // The NAME of the category
  items: ChecklistItem[];
}

export interface AIPersona {
  id:string;
  name: string;
  behavior: string; // This will be the system instruction for the AI
  avatar?: string; // Base64 URL for the generated avatar image
  isDefault?: boolean;
  ownerId?: string; // ID of the user who created it
}


export interface StudyRoom {
  id: string;
  name: string;
  password: string;
  ownerId: string;
  memberIds: string[];
  aiMemberIds: string[];
}

export interface ChatMessage {
    id: string;
    roomId: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: string; // ISO 8601 string
}

export interface User {
  id: string;
  name: string;
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}