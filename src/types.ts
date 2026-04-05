export interface User {
  id: number;
  username: string;
  current_level: number;
  stars: number;
}

export interface Message {
  id?: number;
  role: 'user' | 'model';
  content: string;
  level: number;
  timestamp?: string;
}

export interface Level {
  id: number;
  title: string;
  description: string;
  instruction: string;
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  speed: number;
  icon: string;
}
