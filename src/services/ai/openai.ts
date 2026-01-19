import type { Keyword, Topic, Draft, Tone, LengthOption, Article } from '../../types';

export const OpenAIService = {
    async generateKeywords(apiKey: string, target: string): Promise<Keyword[]> {
        const prompt = `
      User Target: "${target}"
      Task: Extract 10 core interest keywords relevant to this target audience (40-60 age group).
      Output Format: JSON array of strings only. Example: ["Health", "Retirement", ...]
      Language: Korean.
    `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error('OpenAI API Call Failed');

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Basic parsing, assuming clean JSON
            const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());

            return parsed.map((text: string, idx: number) => ({
                id: `ok${idx}`,
                text,
                selected: true
            }));
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async generateTopics(apiKey: string, keywords: string[]): Promise<Topic[]> {
        const prompt = `
       Keywords: ${keywords.join(', ')}
       Task: Generate 20 topic sentences for a social media thread.
       Audience: 40-60s.
       Tone: Relatable, Question-based, or Problem-based.
       Output Format: JSON array of strings only.
       Language: Korean.
    `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // or gpt-3.5-turbo
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error('OpenAI API Call Failed');
            const data = await response.json();
            const content = data.choices[0].message.content;
            const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());

            return parsed.map((text: string, idx: number) => ({
                id: `ot${idx}`,
                text,
                selected: false
            }));

        } catch (e) {
            throw e;
        }
    },

    async generateArticles(apiKey: string, topic: string): Promise<Article[]> {
        const prompt = `
      Topic: "${topic}"
      Task: Recommend 5 high-quality, professional articles or reputable sources relevant to this topic.
      Target Audience: 40-60s professionals.
      Return ONLY a JSON array of objects with keys: "title", "url", "source".
      Note: Since you cannot browse the live web, provide the most likely reputable permanent links or well-known resource pages.
      Language: Korean (for title/source), URL can be English/Korean.
    `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error('OpenAI API Call Failed');
            const data = await response.json();
            const content = data.choices[0].message.content;
            const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());

            return parsed.map((item: any, idx: number) => ({
                id: `oa${idx}`,
                title: item.title,
                url: item.url,
                source: item.source,
                selected: false
            }));
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async summarizeArticles(apiKey: string, articles: Article[]): Promise<string> {
        const input = articles.map(a => `- ${a.title} (${a.source}): ${a.url}`).join('\n');
        const prompt = `
      Selected Articles:
      ${input}

      Task: Synthesize a professional summary based on the topics of these articles. 
      Act as if you have read them and are extracting key insights for a 40-60s audience.
      Add a "Professional Insight" section at the end.
      Language: Korean.
    `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error('OpenAI API Call Failed');
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async generateDrafts(apiKey: string, topic: string, context: string, tone: Tone, length: LengthOption, articleSummary: string = '', userThoughts: string = ''): Promise<Draft[]> {
        const prompt = `
      Topic: "${topic}"
      Context: "${context}"
      Reference Summary: "${articleSummary}"
      User's Thoughts: "${userThoughts}"
      Tone: ${tone} (dry, warm, firm)
      Length: approx ${length} lines
      Target Audience: 40-60s.
      Task: Write 3 different versions of a Thread post.
      
      Structure for each post:
      1. Hook (Title): A catchy one-line headline at the very top.
      2. Body: Clear paragraphs with distinct line breaks between ideas. Avoid dense blocks of text.
      3. Conclusion/Call to action.
      
      Version 1 (Concern): Empathize with the problem.
      Version 2 (Process): Share a journey/attempt (Recommended).
      Version 3 (Routine): Suggest a small habit/tool.

      Output Format: JSON array of objects with keys: "type" (concern|process|routine), "title", "content".
      Structure for each post:
      1. Hook (Title): A catchy one-line headline at the very top.
      2. Body:
         - MUST start on a new line after the Hook.
         - Write impactful, concise sentences.
         - **CRITICAL:** Insert a line break (\n) after EVERY period/sentence to maximize readability on mobile.
         - Avoid long paragraphs. Group related sentences but keep them visually distinct.

      Output Format: JSON array of objects with keys: "type" (concern|process|routine), "title", "content".
      IMPORTANT: The "content" field MUST start with the Hook/Title, followed by two newlines (\n\n), and then the body text with line breaks between sentences.
      At the very end, include 3-5 relevant hashtags.
      Language: Korean.
    `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error('OpenAI API Call Failed');
            const data = await response.json();
            const content = data.choices[0].message.content;
            const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());

            // Ensure IDs
            return parsed.map((draft: any, idx: number) => ({
                ...draft,
                id: `od${idx}`
            }));

        } catch (e) {
            throw e;
        }
    }
}
