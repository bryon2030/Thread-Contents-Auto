import type { Keyword, Topic, Draft, Tone, LengthOption } from '../../types';

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

    async generateDrafts(apiKey: string, topic: string, context: string, tone: Tone, length: LengthOption): Promise<Draft[]> {
        const prompt = `
      Topic: "${topic}"
      User Context: "${context}"
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
      IMPORTANT: The "content" field MUST start with the Hook/Title, followed by two newlines (\n\n), and then the body text.
      Language: Korean.
      Do not include hashtags unless necessary.
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
