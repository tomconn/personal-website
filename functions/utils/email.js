// File: functions/utils/email.js

/**
 * Sends an email using the Brevo (Sendinblue) API v3.
 * IMPORTANT: Requires BREVO_API_KEY and NOTIFICATION_EMAIL_FROM environment variables.
 * The 'fromEmail' MUST be validated in Brevo.
 */
export async function sendEmailWithBrevo({ apiKey, toEmail, fromEmail, fromName, subject, textContent, htmlContent }) {
    const apiUrl = 'https://api.brevo.com/v3/smtp/email';

    if (!apiKey) {
        console.error("[sendEmailWithBrevo] Brevo API Key (BREVO_API_KEY env) is missing.");
        return { success: false, status: 500, error: "Server configuration error (missing API key)." };
    }
    if (!toEmail || !fromEmail || !subject || (!textContent && !htmlContent)) {
         console.error("[sendEmailWithBrevo] Missing required parameters for sending email.");
         return { success: false, status: 400, error: "Internal error: Missing required email parameters." };
    }

    const payload = {
        sender: { email: fromEmail, name: fromName || "Website Notification" },
        to: [{ email: toEmail }],
        subject: subject,
        ...(textContent && { textContent: textContent }), // Conditionally add textContent
        ...(htmlContent && { htmlContent: htmlContent }), // Conditionally add htmlContent
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) { // Brevo uses 201 Created for success usually
            console.log(`Brevo email sent successfully to ${toEmail}. Status: ${response.status}`);
            return { success: true, status: response.status };
        } else {
            let errorBody = `Brevo API Error (${response.status})`;
            try {
               const errorJson = await response.json();
               if (errorJson && errorJson.message) {
                   errorBody = `Brevo API Error (${response.status}): ${errorJson.code} - ${errorJson.message}`;
               } else {
                   errorBody = `Brevo API Error (${response.status}): ${await response.text()}`;
               }
            } catch (e) { /* Ignore parsing error, use default */ }
            console.error(`[sendEmailWithBrevo] Failed to send email. ${errorBody}`);
            return { success: false, status: response.status, error: errorBody };
        }
    } catch (error) {
        console.error('[sendEmailWithBrevo] Network or fetch error:', error);
        return { success: false, status: 500, error: `Network error during email sending: ${error.message}` };
    }
}