import { AIPersona, EventCategory } from './types';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// A vibrant, cohesive color palette for events based on a blue-to-pink gradient.
export const EVENT_COLORS = [
    '#5033FF', // Vibrant Blue
    '#7A38D4', // Purple
    '#A43CAF', // Magenta
    '#CE4189', // Rose
    '#E545A3', // Hot Pink
    '#94A3B8', // Grey
];

export const EVENT_CATEGORIES: EventCategory[] = [
    { id: 'cat-1', name: 'Study', color: '#5033FF' },
    { id: 'cat-2', name: 'Class', color: '#7A38D4' },
    { id: 'cat-3', name: 'Meeting', color: '#A43CAF' },
    { id: 'cat-4', name: 'Workout', color: '#CE4189' },
    { id: 'cat-5', name: 'Break', color: '#E545A3' },
    { id: 'cat-6', name: 'Other', color: '#94A3B8' },
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