import type { Keyword, Topic, Draft, Tone, LengthOption } from '../../types';

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

    async generateDrafts(apiKey: string, topic: string, context: string, tone: Tone, length: LengthOption): Promise<Draft[]> {
        const prompt = `
      Topic: "${topic}"
      Context: "${context}"
      Tone: ${tone}
      Length: ${length} lines
      Target: 40-60s.
      Write 3 versions: 1.Concern, 2.Process, 3.Routine.
      
      Structure:
      - Start with a Hook (Title) at the top.
      - Add two newlines (\n\n).
      - Then write the body with clear styling and line breaks.
      
      Return ONLY a JSON array of objects with keys: type, title, content.
      The "content" field MUST include the Hook/Title at the start.
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
