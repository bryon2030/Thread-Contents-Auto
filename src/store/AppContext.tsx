import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppSettings, AppState, Keyword, Topic, Draft, Article } from '../types';
import { StorageService } from '../services/storage';

// --- State Definitions ---

const DEFAULT_SETTINGS: AppSettings = {
    provider: 'openai',
    apiKey: '',
    storageOption: 'none',
    tone: 'dry',
    length: '5',
    googleSheetUrl: ''
};

const INITIAL_APP_STATE: AppState = {
    step: 0,
    mode: 'DEMO',
    targetInput: '',
    keywords: [],
    topics: [],
    drafts: [],
    articles: [],
    articleSummary: '',
    userThoughts: ''
};

// --- Actions ---

type Action =
    | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
    | { type: 'LOAD_SETTINGS'; payload: AppSettings }
    | { type: 'SET_MODE'; payload: 'DEMO' | 'LIVE' }
    | { type: 'SET_STEP'; payload: number }
    | { type: 'SET_TARGET'; payload: string }
    | { type: 'SET_KEYWORDS'; payload: Keyword[] }
    | { type: 'UPDATE_KEYWORD'; payload: { id: string; updates: Partial<Keyword> } }
    | { type: 'SET_TOPICS'; payload: Topic[] }
    | { type: 'SELECT_TOPIC'; payload: string }
    | { type: 'SET_TOPIC_CONTEXT'; payload: { id: string; context: string } }
    | { type: 'SET_DRAFTS'; payload: Draft[] }
    | { type: 'SET_ARTICLES'; payload: Article[] }
    | { type: 'TOGGLE_ARTICLE'; payload: string }
    | { type: 'UPDATE_ARTICLE'; payload: { id: string; updates: Partial<Article> } }
    | { type: 'SET_ARTICLE_SUMMARY'; payload: string }
    | { type: 'SET_USER_THOUGHTS'; payload: string }
    | { type: 'RESET_FLOW' };

// --- Reducer ---

function reducer(state: { settings: AppSettings; app: AppState }, action: Action) {
    switch (action.type) {
        case 'SET_SETTINGS': {
            const newSettings = { ...state.settings, ...action.payload };
            // Side effect: Save if option is enabled (handled in effect, but we update state here)
            return { ...state, settings: newSettings };
        }
        case 'LOAD_SETTINGS':
            return { ...state, settings: action.payload };
        case 'SET_MODE':
            return { ...state, app: { ...state.app, mode: action.payload } };
        case 'SET_STEP':
            return { ...state, app: { ...state.app, step: action.payload } };
        case 'SET_TARGET':
            return { ...state, app: { ...state.app, targetInput: action.payload } };
        case 'SET_KEYWORDS':
            return { ...state, app: { ...state.app, keywords: action.payload } };
        case 'UPDATE_KEYWORD': {
            const newKeywords = state.app.keywords.map(k =>
                k.id === action.payload.id ? { ...k, ...action.payload.updates } : k
            );
            return { ...state, app: { ...state.app, keywords: newKeywords } };
        }
        case 'SET_TOPICS':
            return { ...state, app: { ...state.app, topics: action.payload } };
        case 'SELECT_TOPIC': {
            const newTopics = state.app.topics.map(t => ({ ...t, selected: t.id === action.payload }));
            return { ...state, app: { ...state.app, topics: newTopics } };
        }
        case 'SET_TOPIC_CONTEXT': {
            const newTopics = state.app.topics.map(t =>
                t.id === action.payload.id ? { ...t, userContext: action.payload.context } : t
            );
            return { ...state, app: { ...state.app, topics: newTopics } };
        }
        case 'SET_DRAFTS':
            return { ...state, app: { ...state.app, drafts: action.payload } };
        case 'SET_ARTICLES':
            return { ...state, app: { ...state.app, articles: action.payload } };
        case 'TOGGLE_ARTICLE': {
            const newArticles = state.app.articles.map(a =>
                a.id === action.payload ? { ...a, selected: !a.selected } : a
            );
            return { ...state, app: { ...state.app, articles: newArticles } };
        }
        case 'UPDATE_ARTICLE': {
            const newArticles = state.app.articles.map(a =>
                a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
            );
            return { ...state, app: { ...state.app, articles: newArticles } };
        }
        case 'SET_ARTICLE_SUMMARY':
            return { ...state, app: { ...state.app, articleSummary: action.payload } };
        case 'SET_USER_THOUGHTS':
            return { ...state, app: { ...state.app, userThoughts: action.payload } };
        case 'RESET_FLOW':
            return {
                ...state,
                app: {
                    ...INITIAL_APP_STATE,
                    step: 1, // Go back to target input
                    mode: state.app.mode // Keep mode
                }
            };
        default:
            return state;
    }
}

// --- Context ---

interface AppContextType {
    settings: AppSettings;
    app: AppState;
    dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, {
        settings: DEFAULT_SETTINGS,
        app: INITIAL_APP_STATE
    });

    // Load settings on mount
    useEffect(() => {
        const saved = StorageService.loadSettings();
        if (saved) {
            dispatch({ type: 'LOAD_SETTINGS', payload: saved });
            // If we have an API key, check if it works? For now just assume LIVE if key exists
            if (saved.apiKey) {
                dispatch({ type: 'SET_MODE', payload: 'LIVE' });
            }
        }
    }, []);

    // Save settings on change
    useEffect(() => {
        StorageService.saveSettings(state.settings);
    }, [state.settings]);

    // Derived state check: If no API key, force DEMO (unless user is in settings)
    useEffect(() => {
        if (!state.settings.apiKey && state.app.mode === 'LIVE') {
            dispatch({ type: 'SET_MODE', payload: 'DEMO' });
        }
    }, [state.settings.apiKey, state.app.mode]);

    return (
        <AppContext.Provider value={{ settings: state.settings, app: state.app, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
