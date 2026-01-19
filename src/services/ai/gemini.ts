import type { Keyword, Topic, Draft, Tone, LengthOption, Article } from '../../types';

export const GeminiService = {
    async generateKeywords(apiKey: string, target: string): Promise<Keyword[]> {
        const prompt = `
      Extract 10 core interest keywords relevant to this target audience: "${target}".
      Audience is 40-60 age group.
      Return ONLY a JSON array of strings.
      Example: ["Health", "Retirement"]
      Language: Korean.
    `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error('Gemini API Call Failed');

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;

            const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

            return parsed.map((text: string, idx: number) => ({
                id: `gk${idx}`,
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
       Generate 20 topic sentences for social media (Threads) for 40-60s.
       Return ONLY a JSON array of strings.
       Language: Korean.
    `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error('Gemini API Call Failed');
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

            return parsed.map((text: string, idx: number) => ({
                id: `gt${idx}`,
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error('Gemini API Call Failed');
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

            return parsed.map((item: any, idx: number) => ({
                id: `ga${idx}`,
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error('Gemini API Call Failed');
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
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
      Tone: ${tone}
      Length: ${length} lines
      Target: 40-60s.
      Write 3 versions: 1.Concern, 2.Process, 3.Routine.
      
      Structure:
      - Start with a Hook (Title) at the top.
      - Add two newlines (\n\n).
      - Then write the body with clear styling and line breaks.
      
      Return ONLY a JSON array of objects with keys: type, title, content.
      Structure:
      - Start with a Hook (Title) at the top.
      - Add two newlines (\n\n).
      - Then write the body.
      - **CRITICAL:** Insert a line break (\n) after EVERY period/sentence to maximize readability on mobile.
      - Use impactful, short sentences.
      - End with 3-5 relevant hashtags.

      Return ONLY a JSON array of objects with keys: type, title, content.
      The "content" field MUST include the Hook/Title at the start, followed by \n\n and then the formatted body.
      Language: Korean.
    `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error('Gemini API Call Failed');
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

            return parsed.map((draft: any, idx: number) => ({
                ...draft,
                id: `gd${idx}`
            }));
        } catch (e) {
            throw e;
        }
    }
}
