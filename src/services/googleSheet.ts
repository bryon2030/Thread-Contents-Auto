export const GoogleSheetService = {
    async saveToSheet(webhookUrl: string, data: any): Promise<boolean> {
        if (!webhookUrl) throw new Error('Google Sheet Webhook URL is missing');

        // Prepare data with timestamp to avoid potential caching
        const payload = {
            ...data,
            _timestamp: new Date().getTime()
        };

        try {
            console.log('Sending data to Google Sheet:', payload);
            await fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            // With no-cors, we can't verify 200 OK, but if fetch doesn't throw, it was sent.
            console.log('Google Sheet request sent successfully (no-cors mode)');
            return true;
        } catch (error) {
            console.error('Google Sheet Network Error:', error);
            alert('구글 시트 전송 중 오류가 발생했습니다.\nWebhook URL을 확인해주세요.');
            throw error;
        }
    }
};
