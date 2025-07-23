import { GoogleGenAI, Type } from "@google/genai";
import { AIPersona, ChatMessage } from "../types";
import { DEFAULT_EVENT_SUGGESTION_PROMPT, DEFAULT_PERSONA_SUGGESTION_PROMPT } from '../constants';

// Using the provided API key for all AI service calls.
// In a production environment, it is strongly recommended to use environment variables for security.
const apiKey = "AIzaSyBxm7c8hlBiaffFlQVGdHezRQseo3R_mrQ";

const ai = new GoogleGenAI({ apiKey: apiKey });

/**
 * Fetches a short, motivational quote for a student.
 * @returns {Promise<string>} A promise that resolves to a motivational quote.
 */
export const fetchMotivationalQuote = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Generate a short, powerful motivational quote for a student. Keep it concise, like a one-liner.",
        config: {
            temperature: 0.9,
            thinkingConfig: { thinkingBudget: 0 } // faster response for this use case
        }
    });

    const quote = response.text.trim();
    // A simple validation to ensure the response is not empty or just punctuation
    if (quote && quote.length > 5) {
        // Remove wrapping quotes and any asterisks from markdown
        return quote.replace(/^"|"$/g, '').replace(/\*/g, '');
    }
    // Fallback quote if Gemini response is invalid
    return "Believe you can and you're halfway there. – Theodore Roosevelt";
  } catch (error) {
    console.error("Error fetching motivational quote from Gemini:", error);
    // Return a fallback quote in case of an API error
    return "The future belongs to those who believe in the beauty of their dreams. – Eleanor Roosevelt";
  }
};

/**
 * Generates a checklist for a given event title using the Gemini API.
 * @param {string} eventTitle The title of the event.
 * @param {string} [customPrompt] An optional custom system prompt.
 * @returns {Promise<string[]>} A promise that resolves to an array of checklist item strings.
 */
export const generateChecklistForEvent = async (eventTitle: string, customPrompt?: string): Promise<string[]> => {
    try {
        const systemInstruction = customPrompt || DEFAULT_EVENT_SUGGESTION_PROMPT;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a checklist of 3 to 7 items for the following student calendar event: "${eventTitle}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        checklist: {
                            type: Type.ARRAY,
                            description: "An array of 3 to 7 strings, where each string is a checklist item related to the event title.",
                            items: {
                                type: Type.STRING,
                                description: "A single sub-task or topic for the student's event."
                            }
                        }
                    },
                    required: ["checklist"],
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text);

        if (jsonResponse.checklist && Array.isArray(jsonResponse.checklist) && jsonResponse.checklist.length > 0) {
            return jsonResponse.checklist;
        }
        // If the model returns an empty list or invalid structure, provide a helpful message.
        return ["Could not generate a relevant checklist. Try using a more descriptive title for your event."];
    } catch (error) {
        console.error("Error generating checklist with Gemini:", error);
        return ["Failed to generate checklist due to an API error."];
    }
};


/**
 * Generates a contextual chat response from an AI persona.
 * @param persona The AI persona that is responding.
 * @param chatHistory The recent messages in the chat for context.
 * @param lastMessage The most recent message that the AI might be responding to.
 * @param isDirectMention Indicates if the AI was mentioned directly in the message.
 * @returns A promise that resolves to the AI's chat message string.
 */
export const generateAIChatResponse = async (persona: AIPersona, chatHistory: ChatMessage[], lastMessage: ChatMessage, isDirectMention: boolean = false): Promise<string> => {
    try {
        const historyText = chatHistory
            .map(msg => `${msg.senderName}: ${msg.text}`)
            .join('\n');

        const prompt = isDirectMention
            ? `You are in a study room chat. The recent conversation is:\n${historyText}\n\n${lastMessage.senderName} just addressed you directly. Their message is: "${lastMessage.text}". Generate a short, in-character response. Be helpful and conversational.`
            : `You are in a study room chat. Here is the recent conversation:\n${historyText}\n\nThe last message was from ${lastMessage.senderName}. Generate a short, in-character response. Your response must be a single, brief chat message, not a long paragraph. Do not just repeat what others said. Add something new, ask a question, or give encouragement.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: persona.behavior,
                temperature: 0.8,
                maxOutputTokens: 60,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        let responseText = response.text.trim().replace(/^"|"$/g, '');

        // Clean up the response to remove potential self-labeling by the AI.
        const aiLabel = `${persona.name}:`;
        const aiLabelWithAIPart = `${persona.name} (AI):`;
        if (responseText.toLowerCase().startsWith(aiLabel.toLowerCase())) {
            responseText = responseText.substring(aiLabel.length).trim();
        } else if (responseText.toLowerCase().startsWith(aiLabelWithAIPart.toLowerCase())) {
            responseText = responseText.substring(aiLabelWithAIPart.length).trim();
        }

        return responseText;

    } catch (error) {
        console.error("Error generating AI chat response:", error);
        return ""; // Return empty string on error
    }
};

/**
 * Generates a suggestion for a new AI persona (name and behavior).
 * @param {string} [customPrompt] An optional custom system prompt.
 * @returns {Promise<{name: string, behavior: string} | null>} A promise that resolves to an object with a name and behavior, or null on failure.
 */
export const generateAIPersonaSuggestion = async (customPrompt?: string): Promise<{name: string; behavior: string} | null> => {
    try {
        const systemInstruction = customPrompt || DEFAULT_PERSONA_SUGGESTION_PROMPT;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a creative and helpful AI persona for a student's study application. Provide a unique name and a detailed behavior description for the system prompt.",
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "A creative and fitting name for the AI persona (e.g., 'The Motivator', 'Professor Synapse')."
                        },
                        behavior: {
                            type: Type.STRING,
                            description: "A detailed system instruction describing the AI's personality and purpose. This will be used as the system prompt for the AI. It should be written in the second person (e.g., 'You are a helpful and enthusiastic study coach...')."
                        }
                    },
                    required: ["name", "behavior"],
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text);

        if (jsonResponse.name && jsonResponse.behavior) {
            return jsonResponse;
        }
        return null;
    } catch (error) {
        console.error("Error generating AI persona suggestion with Gemini:", error);
        return null;
    }
};

/**
 * Generates a unique avatar for an AI persona using the Gemini Image API.
 * @param personaName The name of the AI persona.
 * @param personaBehavior A description of the AI's personality.
 * @returns A promise that resolves to a base64 encoded image string, or an empty string on failure.
 */
export const generateAIAvatar = async (personaName: string, personaBehavior: string): Promise<string> => {
  try {
    const prompt = `Create a minimalist, friendly avatar for an AI assistant named '${personaName}'. The AI's personality is: ${personaBehavior}. The avatar should be a simple, abstract, flat icon, suitable for a user profile picture on a dark background. Style: vector, flat, circular background. Centered icon. No text.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    return ''; // Return empty string on failure
  } catch (error) {
    console.error("Error generating AI avatar:", error);
    return ''; // Return empty on error
  }
};