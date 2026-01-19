export const GoogleSheetService = {
    async saveToSheet(webhookUrl: string, data: any): Promise<boolean> {
        if (!webhookUrl) throw new Error('Google Sheet Webhook URL is missing');

        // Prepare data as simple JSON
        // The Google Apps Script should handle JSON parsing (e.POST)
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors', // Important for Google Script Webhook to avoid CORS error usually (opaque)
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // With no-cors, we get an opaque response, so we can't check .ok
            // We assume success if no network error thrown.
            return true;
        } catch (error) {
            console.error('Google Sheet Save Failed', error);
            throw error;
        }
    }
};
