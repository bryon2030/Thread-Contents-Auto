export type AIProvider = 'openai' | 'gemini';
export type Tone = 'dry' | 'warm' | 'firm';
export type LengthOption = '3' | '5' | '7';

export const PROVIDERS: AIProvider[] = ['openai', 'gemini'];

export interface AppSettings {
    provider: AIProvider;
    apiKey: string;
    storageOption: 'none' | 'session' | 'local';
    tone: Tone;
    length: LengthOption;
    googleSheetUrl?: string; // Webhook URL
}

export interface Keyword {
    id: string;
    text: string;
    selected: boolean;
}

export interface Topic {
    id: string;
    text: string; // The situation/problem description
    selected: boolean;
    userContext?: string; // Optional user Situation
}

export type DrafterType = 'concern' | 'process' | 'routine';

export interface Draft {
    id: string;
    type: DrafterType;
    title: string;
    content: string;
}

export interface Article {
    id: string;
    title: string;
    url: string;
    source?: string; // e.g. "Google News", "TechCrunch"
    selected: boolean;
    summary?: string; // Individual article summary (optional)
}
export interface AppState {
    step: number; // 0=Settings, 1=Target, 2=Keywords, 3=Topics, 4=Drafts
    mode: 'DEMO' | 'LIVE';
    targetInput: string;
    keywords: Keyword[];
    topics: Topic[];
    drafts: Draft[];
    // New fields for Article Step
    articles: Article[];
    articleSummary: string; // Combined summary
    userThoughts: string;
}
