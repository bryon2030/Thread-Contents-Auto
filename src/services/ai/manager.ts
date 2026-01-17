import { DemoService } from './demo';
import { OpenAIService } from './openai';
import { GeminiService } from './gemini';
import type { AppSettings, Keyword, Topic, Draft } from '../../types';

export const AIManager = {
    async generateKeywords(settings: AppSettings, target: string): Promise<Keyword[]> {
        if (!settings.apiKey || settings.apiKey.trim() === '') {
            // console.log('Using Demo Service (No Key)');
            // return DemoService.generateKeywords(target);
            throw new Error('API Key Required (체험판 모드가 비활성화되었습니다)');
        }

        try {
            if (settings.provider === 'openai') {
                return await OpenAIService.generateKeywords(settings.apiKey, target);
            } else {
                return await GeminiService.generateKeywords(settings.apiKey, target);
            }
        } catch (error) {
            console.error('API Call Failed', error);
            throw error;
        }
    },

    async generateTopics(settings: AppSettings, keywords: string[]): Promise<Topic[]> {
        if (!settings.apiKey) throw new Error('API Key Required');

        try {
            if (settings.provider === 'openai') {
                return await OpenAIService.generateTopics(settings.apiKey, keywords);
            } else {
                return await GeminiService.generateTopics(settings.apiKey, keywords);
            }
        } catch (error) {
            console.error('API Call Failed', error);
            throw error;
        }
    },

    async generateDrafts(settings: AppSettings, topic: string, context: string): Promise<Draft[]> {
        if (!settings.apiKey) throw new Error('API Key Required');

        try {
            if (settings.provider === 'openai') {
                return await OpenAIService.generateDrafts(settings.apiKey, topic, context, settings.tone, settings.length);
            } else {
                return await GeminiService.generateDrafts(settings.apiKey, topic, context, settings.tone, settings.length);
            }
        } catch (error) {
            console.error('API Call Failed', error);
            throw error;
        }
    }
};
