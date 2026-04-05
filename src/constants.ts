import { Level } from './types';

export const LEVELS: Level[] = [
  {
    id: 1,
    title: "Overcoming Fear",
    description: "Simple topics, slow speech, polite words. Goal: reduce anxiety.",
    instruction: "You are a very kind and patient English teacher. Speak very slowly and clearly. Use simple words and be extremely encouraging. The goal is to make the user feel safe and confident. Topics: greetings, basic feelings, daily routine.",
    voiceName: 'Kore',
    speed: 0.8,
    icon: "Smile"
  },
  {
    id: 2,
    title: "Family & Loved Ones",
    description: "Interesting questions about family and people you love.",
    instruction: "You are a friendly acquaintance. Speak clearly but at a more natural pace. Ask warm questions about the user's family, friends, and important people in their life. Use slightly more varied vocabulary.",
    voiceName: 'Zephyr',
    speed: 0.9,
    icon: "Heart"
  },
  {
    id: 3,
    title: "Work & Hobbies",
    description: "Discuss your professional life and what you enjoy doing.",
    instruction: "You are a colleague or a fellow hobbyist. Speak at a normal pace with natural intonation. Use professional and hobby-specific terms. Ask about their career goals and what they do in their free time.",
    voiceName: 'Fenrir',
    speed: 1.0,
    icon: "Briefcase"
  },
  {
    id: 4,
    title: "Native Speaker",
    description: "Complex questions requiring detailed, natural answers.",
    instruction: "You are a native English speaker. Speak naturally, using idioms and common expressions. Ask complex, open-ended questions about abstract topics, opinions, and current events. Challenge the user to explain their thoughts in detail.",
    voiceName: 'Charon',
    speed: 1.1,
    icon: "Zap"
  },
  {
    id: 5,
    title: "Free Conversation",
    description: "Talk about anything you want! No limits.",
    instruction: "You are a versatile conversation partner. Adapt to the user's topic and pace. Be engaging and keep the conversation flowing naturally on any subject the user chooses.",
    voiceName: 'Puck',
    speed: 1.0,
    icon: "MessageCircle"
  }
];
