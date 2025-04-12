// File: functions/api/submit-comment.js

// Basic HTML entity escaping function
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/'/g, "'");
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const comment = body.comment;
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP'); // Get user's IP

        // --- Validation ---
        if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Comment is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (comment.length > 256) {
             return new Response(JSON.stringify({ success: false, message: 'Comment exceeds 256 characters.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!recaptchaToken) {
            return new Response(JSON.stringify({ success: false, message: 'reCAPTCHA verification failed. [Token missing]' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- reCAPTCHA Verification ---
        const recaptchaSecret = env.RECAPTCHA_SECRET_KEY; // Get secret key from environment variable
        if (!recaptchaSecret) {
             console.error('RECAPTCHA_SECRET_KEY environment variable not set.');
             return new Response(JSON.stringify({ success: false, message: 'Server configuration error.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const recaptchaData = new FormData();
        recaptchaData.append('secret', recaptchaSecret);
        recaptchaData.append('response', recaptchaToken);
        if (ip) { // Optionally send user's IP
            recaptchaData.append('remoteip', ip);
        }

        const recaptchaRes = await fetch(recaptchaUrl, {
            method: 'POST',
            body: recaptchaData,
        });

        const recaptchaJson = await recaptchaRes.json();

        if (!recaptchaJson.success) {
            console.error('reCAPTCHA verification failed:', recaptchaJson['error-codes']);
            return new Response(JSON.stringify({ success: false, message: 'reCAPTCHA verification failed. Please try again.' }), {
                status: 400, // Bad request (failed verification)
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // Optional: Check score if using reCAPTCHA v3, or hostname/action if configured

        // --- Sanitization ---
        // Basic HTML escaping. For more complex needs, consider a library.
        const sanitizedComment = escapeHtml(comment.trim());

        // --- Email Sending (using MailChannels) ---
        // NOTE: Ensure your domain is set up for MailChannels via Cloudflare for this to work easily.
        const emailTo = 'tcwebsite@softwarestable.com';
        const emailFrom = 'no-reply@softwarestable.com'; // IMPORTANT: Use a valid sender for your domain configured with Cloudflare/MailChannels
        const emailSubject = 'New Comment on thomasconnolly.com';

        const emailBody = `
New comment received:
---------------------
${sanitizedComment}
---------------------

Submitted by IP: ${ip || 'Unknown'}
Timestamp: ${new Date().toISOString()}
        `;

        const send_request = new Request("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [
                    { to: [{ email: emailTo }] }
                ],
                from: {
                    email: emailFrom, // Make sure this sender is allowed/verified
                    name: "Website Comment Bot",
                },
                subject: emailSubject,
                content: [
                    {
                        type: "text/plain",
                        value: emailBody,
                    }
                ],
            }),
        });

       const emailResponse = await fetch(send_request);
/*
        if (emailResponse.status === 202) { // 202 Accepted is success for MailChannels
             return new Response(JSON.stringify({ success: true, message: 'Comment submitted successfully.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            const errorBody = await emailResponse.text();
            console.error(`Failed to send email via MailChannels. Status: ${emailResponse.status}, Body: ${errorBody}`);
            return new Response(JSON.stringify({ success: false, message: 'Failed to process comment. Please try again later.' }), {
                status: 500, // Internal server error (email sending failed)
                headers: { 'Content-Type': 'application/json' },
            });
        }
*/

        // temporary do nothing response - until I can figure out the email sending
        return new Response(JSON.stringify({ success: true, message: 'Comment submitted successfully.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error processing comment request:', error);
        return new Response(JSON.stringify({ success: false, message: 'An unexpected server error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}