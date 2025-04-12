// File: functions/api/submit-comment.js (for reCAPTCHA v3)

// --- Configuration ---
// IMPORTANT: Set this threshold based on your tolerance for potential bots vs. false positives.
// 0.5 is a common starting point. Higher values are stricter.
const SCORE_THRESHOLD = 0.5;
// This MUST match the action string used in the grecaptcha.execute() call in script.js
const EXPECTED_ACTION = 'submit_comment';
// Recipient email address
const EMAIL_TO = 'tcwebsite@softwarestable.com';
// IMPORTANT: Sender email - MUST be a verified sender for your domain in Cloudflare/MailChannels
// (e.g., using Email Routing or a verified domain)
const EMAIL_FROM = 'no-reply@ysoftwarestable.com'; // <-- CHANGE THIS TO YOUR VERIFIED SENDER
const EMAIL_SUBJECT = 'New Comment on softwarestable.com';
// --- End Configuration ---

// Basic HTML entity escaping function
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/'/g, "'");
}

// Helper to create consistent JSON responses
function createJsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status: status,
        headers: { 'Content-Type': 'application/json' },
    });
}

// Main function triggered by POST requests to /api/submit-comment
export async function onRequestPost({ request, env }) {
    try {
        // 1. Parse Request Body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return createJsonResponse({ success: false, message: 'Invalid JSON request body.' }, 400);
        }

        const comment = body.comment;
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP'); // Get user's IP from Cloudflare header
        const requestUrl = new URL(request.url);
        const requestHostname = requestUrl.hostname; // Hostname the request was made to


        // 2. Basic Input Validation
        if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
            return createJsonResponse({ success: false, message: 'Comment is required.' }, 400);
        }
        if (comment.length > 256) {
             return createJsonResponse({ success: false, message: 'Comment exceeds 256 characters.' }, 400);
        }
        if (!recaptchaToken) {
            return createJsonResponse({ success: false, message: 'reCAPTCHA token is missing.' }, 400);
        }


        // 3. reCAPTCHA V3 Verification
        const recaptchaSecret = env.RECAPTCHA_SECRET_KEY; // Get secret key from environment variable
        if (!recaptchaSecret) {
             console.error('FATAL: RECAPTCHA_SECRET_KEY environment variable not set.');
             // Don't reveal specific server issues to the client
             return createJsonResponse({ success: false, message: 'Server configuration error.' }, 500);
        }

        const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const formData = new FormData();
        formData.append('secret', recaptchaSecret);
        formData.append('response', recaptchaToken);
        if (ip) { // Send user's IP if available (recommended by Google)
            formData.append('remoteip', ip);
        }

        const recaptchaRes = await fetch(recaptchaUrl, {
            method: 'POST',
            body: formData,
        });

        const recaptchaJson = await recaptchaRes.json();

        // Log the full response for debugging if needed (consider privacy implications)
        // console.log("reCAPTCHA verification response:", JSON.stringify(recaptchaJson));

        // --- V3 Specific Checks ---
        if (!recaptchaJson.success) {
            console.error('reCAPTCHA verification failed:', recaptchaJson['error-codes']);
            return createJsonResponse({ success: false, message: 'reCAPTCHA check failed. Please try again.' }, 400);
        }

        if (recaptchaJson.score < SCORE_THRESHOLD) {
             console.log(`reCAPTCHA score too low: ${recaptchaJson.score} (Threshold: ${SCORE_THRESHOLD}) from IP: ${ip}`);
             // You might want a slightly different message for low score vs. outright failure
             return createJsonResponse({ success: false, message: 'Verification check failed (low score). Are you a robot?' }, 400);
        }

        if (recaptchaJson.action !== EXPECTED_ACTION) {
             console.warn(`reCAPTCHA action mismatch: Expected '${EXPECTED_ACTION}', Got '${recaptchaJson.action}' from IP: ${ip}`);
             // This could indicate token reuse or misconfiguration
             return createJsonResponse({ success: false, message: 'Verification check failed (action mismatch).' }, 400);
        }

        // Optional but recommended: Check hostname
        if (recaptchaJson.hostname !== requestHostname) {
             console.warn(`reCAPTCHA hostname mismatch: Expected '${requestHostname}', Got '${recaptchaJson.hostname}' from IP: ${ip}`);
             // This could indicate the token was generated on a different site
             // Be careful with www vs non-www or staging domains if not configured correctly in reCAPTCHA admin
             // return createJsonResponse({ success: false, message: 'Verification check failed (hostname mismatch).' }, 400);
             // Consider if you strictly need this check based on your setup. Comment out the return if causing issues.
        }
        // --- End V3 Specific Checks ---


        // 4. Sanitize Comment (if verification passed)
        // Basic HTML escaping. For production, consider a more robust library if needed.
        const sanitizedComment = escapeHtml(comment.trim());


        // 5. Send Email via MailChannels
        const emailBody = `
New comment received on ${requestHostname}:
-----------------------------------------
${sanitizedComment}
-----------------------------------------

Submitted by IP: ${ip || 'Unknown'}
reCAPTCHA Score: ${recaptchaJson.score.toFixed(2)}
Timestamp: ${new Date().toISOString()}
        `;

        const mailChannelsRequest = new Request("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: EMAIL_TO }] }],
                from: {
                    email: EMAIL_FROM,
                    name: "Website Comment Bot", // Optional: Sender name
                },
                subject: EMAIL_SUBJECT,
                content: [{ type: "text/plain", value: emailBody }],
            }),
        });

        const emailResponse = await fetch(mailChannelsRequest);

        if (emailResponse.status === 202) { // 202 Accepted is success for MailChannels
             console.log(`Comment successfully submitted and email sent to ${EMAIL_TO}. Score: ${recaptchaJson.score.toFixed(2)}`);
             return createJsonResponse({ success: true, message: 'Comment submitted successfully.' }, 200);
        } else {
            // Log MailChannels failure details
            const errorBody = await emailResponse.text();
            console.error(`MailChannels Error: Status ${emailResponse.status}, Body: ${errorBody}`);
            // Return a generic server error to the client
            return createJsonResponse({ success: false, message: 'Failed to process comment submission.' }, 500);
        }

    } catch (error) {
        // Catch unexpected errors during processing
        console.error('Unexpected error processing comment request:', error);
        return createJsonResponse({ success: false, message: 'An unexpected server error occurred.' }, 500);
    }
}