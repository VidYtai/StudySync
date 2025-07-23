import { AIPersona, EventCategory } from './types';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const EVENT_COLORS = [
    '#3B82F6', 
    '#2563EB', 
    '#60A5FA', 
    '#93C5FD', 
    '#BFDBFE', 
    '#A0A0A7', 
];

export const EVENT_CATEGORIES: EventCategory[] = [
    { id: 'cat-1', name: 'Study', color: '#3B82F6' },
    { id: 'cat-2', name: 'Class', color: '#2563EB' },
    { id: 'cat-3', name: 'Meeting', color: '#60A5FA' },
    { id: 'cat-4', name: 'Workout', color: '#93C5FD' },
    { id: 'cat-5', name: 'Break', color: '#BFDBFE' },
    { id: 'cat-6', name: 'Other', color: '#A0A0A7' },
];


export const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "In what city were you born?",
  "What is your favorite book?",
];

export const DEFAULT_AI_PERSONAS: AIPersona[] = [
    {
        id: 'default-persona-01',
        name: 'Professor Synapse',
        behavior: 'You are a knowledgeable and patient professor. Your goal is to help students understand complex topics by breaking them down into simple, easy-to-digest explanations. You can answer questions, provide examples, and suggest study strategies. You should maintain a formal yet approachable tone.',
        isDefault: true,
    },
    {
        id: 'default-persona-02',
        name: 'Captain Focus',
        behavior: 'You are an energetic and motivating training captain. Your mission is to keep students on task and focused. You provide encouragement, celebrate small wins, and give reminders to take breaks. You speak in short, punchy, and positive statements. AVOID long paragraphs.',
        isDefault: true,
    }
];

export const DEFAULT_EVENT_SUGGESTION_PROMPT = "You are an intelligent student assistant. Your role is to generate a concise, relevant, and actionable checklist of sub-tasks for a given calendar event. The checklist items should be directly related to the event's title and help a student prepare for or complete it.";

export const DEFAULT_PERSONA_SUGGESTION_PROMPT = "You are a creative assistant designing AI personas. The persona should be tailored to help students study effectively. The behavior should be a clear, concise system instruction.";