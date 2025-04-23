// File: functions/api/submit-comment.js

// Import shared utilities
import { sendEmailWithBrevo } from '../utils/email.js';
import { escapeHtml, isValidEmail, verifyRecaptcha } from '../utils/validation.js';

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const email = body.email;
        const comment = body.comment;
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP');

        // --- Backend Validation ---
        if (!email || !isValidEmail(email)) {
            return new Response(JSON.stringify({ success: false, message: 'Valid email is required.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
        }
        if (!comment || typeof comment !== 'string' || comment.trim().length === 0 || comment.length > 256) {
            return new Response(JSON.stringify({ success: false, message: 'Valid comment (1-256 chars) is required.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
        }
         if (!recaptchaToken) {
            return new Response(JSON.stringify({ success: false, message: 'reCAPTCHA token missing.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- reCAPTCHA Verification ---
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, env.RECAPTCHA_SECRET_KEY, ip);
        if (!recaptchaResult.success) {
            return new Response(JSON.stringify({ success: false, message: recaptchaResult.message || 'reCAPTCHA verification failed.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Sanitization ---
        const sanitizedComment = escapeHtml(comment.trim());
        const sanitizedEmail = email.trim(); // Already validated format

        console.log(`Comment Submission: Email=${sanitizedEmail}, IP=${ip || 'Unknown'}`);

        // --- Email Sending ---
        const emailSubject = 'New Comment on softwarestable.com';
        const emailBody = `
New comment received:
---------------------
Email: ${sanitizedEmail}
Comment: ${sanitizedComment}
---------------------
IP: ${ip || 'Unknown'} | Timestamp: ${new Date().toISOString()}
        `;

        // Ensure required env vars for email exist
        if (!env.BREVO_API_KEY || !env.NOTIFICATION_EMAIL_TO || !env.NOTIFICATION_EMAIL_FROM) {
             console.error("Missing Brevo/Notification email environment variables.");
             // Decide if this is fatal or just prevents notification
              return new Response(JSON.stringify({ success: true, message: 'Comment submitted, but notification setup is incomplete.' }), {
                 status: 200, // Still success for user
                 headers: { 'Content-Type': 'application/json' },
             });
        }

        const emailResult = await sendEmailWithBrevo({
            apiKey: env.BREVO_API_KEY,
            toEmail: env.NOTIFICATION_EMAIL_TO,
            fromEmail: env.NOTIFICATION_EMAIL_FROM,
            fromName: "SoftwareStable Website Comment",
            subject: emailSubject,
            textContent: emailBody,
        });

        if (emailResult.success) {
            console.log(`Successfully processed comment and sent notification for: ${sanitizedEmail}`);
            return new Response(JSON.stringify({ success: true, message: 'Comment submitted successfully!' }), {
                status: 200, headers: { 'Content-Type': 'application/json' },
            });
        } else {
            console.error(`Comment processed, but Brevo notification failed for ${sanitizedEmail}. Status: ${emailResult.status}, Error: ${emailResult.error}`);
            return new Response(JSON.stringify({ success: true, message: 'Comment submitted, but notification failed.' }), {
                status: 200, // Success for user, failure logged internally
                headers: { 'Content-Type': 'application/json' },
            });
        }

    } catch (error) {
        console.error('Error processing comment request:', error);
        // Check if it's a JSON parsing error from bad request body
        if (error instanceof SyntaxError) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid request format.' }), {
                 status: 400, headers: { 'Content-Type': 'application/json' },
             });
        }
        // Generic server error
        return new Response(JSON.stringify({ success: false, message: 'An unexpected server error occurred.' }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        });
    }
}