// File: functions/api/submit-comment.js

// Basic HTML entity escaping function
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    // A slightly safer version, though still basic. Consider a library for production.
    return unsafe
         .replace(/&/g, "&") // Escape ampersands first
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, '"')
         .replace(/'/g, "'"); // Use HTML entity for single quote
}

// *** NEW: Email validation function (backend) ***
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    // Use a common, reasonably robust regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// *** END NEW ***

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        // *** NEW: Extract email from body ***
        const email = body.email;
        const comment = body.comment;
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP'); // Get user's IP

        // --- Backend Validation ---

        // *** NEW: Validate Email Format ***
        if (!email) {
             return new Response(JSON.stringify({ success: false, message: 'Email is required.' }), {
                status: 400, // Bad Request
                headers: { 'Content-Type': 'application/json' },
            });
        }
         if (!isValidEmail(email)) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid email format provided.' }), {
                status: 400, // Bad Request
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // *** END NEW: Email Validation ***

        // Validate Comment
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

        // Validate reCAPTCHA Token presence (verification happens below)
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
        const sanitizedComment = escapeHtml(comment.trim());
        // *** NEW: Sanitize email as well (though format validation already did most work) ***
        // Typically, just ensure it's treated as a plain string, escaping not strictly needed unless embedding in HTML context later.
        // The isValidEmail check is the main security for format.
        const sanitizedEmail = email.trim(); // Already validated format

        // *** NEW: Console Log Email and Comment ***
        console.log(`Comment Submission Received:`);
        console.log(`  Email: ${sanitizedEmail}`);
        console.log(`  Comment: ${sanitizedComment}`);
        console.log(`  IP Address: ${ip || 'Unknown'}`);
        // *** END NEW ***

        // --- Email Sending (using MailChannels) ---
        // NOTE: Ensure your domain is set up for MailChannels via Cloudflare for this to work easily.
        const emailTo = 'tcwebsite@softwarestable.com';
        const emailFrom = 'no-reply@softwarestable.com'; // IMPORTANT: Use a valid sender for your domain configured with Cloudflare/MailChannels
        const emailSubject = 'New Comment on thomasconnolly.com';

        // *** MODIFIED: Include email in the notification body ***
        const emailBody = `
New comment received:
---------------------
Email: ${sanitizedEmail}
Comment: ${sanitizedComment}
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

       // *** Commenting out email sending temporarily as per original code ***
       /*
       const emailResponse = await fetch(send_request);

       if (emailResponse.status === 202) { // 202 Accepted is success for MailChannels
             console.log(`Successfully sent comment notification for: ${sanitizedEmail}`);
             return new Response(JSON.stringify({ success: true, message: 'Comment submitted successfully.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            const errorBody = await emailResponse.text();
            console.error(`Failed to send email via MailChannels. Status: ${emailResponse.status}, Body: ${errorBody}`);
            // Still return success to the user, but log the backend error
            return new Response(JSON.stringify({ success: true, message: 'Comment submitted, but notification failed.' }), {
                status: 200, // Return 200 OK to user, as their comment *was* processed
                headers: { 'Content-Type': 'application/json' },
            });
            // OR return 500 if notification is critical
            // return new Response(JSON.stringify({ success: false, message: 'Failed to process comment fully. Please try again later.' }), {
            //     status: 500, // Internal server error (email sending failed)
            //     headers: { 'Content-Type': 'application/json' },
            // });
        }
       */

        // *** Using the temporary success response ***
         console.log(`Comment processed successfully (email sending skipped) for: ${sanitizedEmail}`);
         return new Response(JSON.stringify({ success: true, message: 'Comment submitted successfully.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
        // *** End temporary response ***


    } catch (error) {
        console.error('Error processing comment request:', error);
        // Avoid leaking internal error details to the client
        return new Response(JSON.stringify({ success: false, message: 'An unexpected server error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}