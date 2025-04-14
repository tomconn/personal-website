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

function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    // Use a common, reasonably robust regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sends an email notification using the Brevo (Sendinblue) API v3.
 * @param {object} params - Parameters for sending email.
 * @param {string} params.apiKey - The Brevo API v3 key.
 * @param {string} params.toEmail - The recipient's email address.
 * @param {string} params.fromEmail - The sender's email address (MUST be validated in Brevo).
 * @param {string} params.fromName - The sender's display name.
 * @param {string} params.subject - The email subject line.
 * @param {string} params.textContent - The plain text content of the email.
 * @returns {Promise<object>} - A promise resolving to an object { success: boolean, status: number, error?: string }.
 */
async function sendEmailWithBrevo({ apiKey, toEmail, fromEmail, fromName, subject, textContent }) {
    const apiUrl = 'https://api.brevo.com/v3/smtp/email';

    // Basic validation of inputs for the function itself
    if (!apiKey) {
        console.error("[sendEmailWithBrevo] Brevo API Key is missing.");
        return { success: false, status: 500, error: "Server configuration error (missing API key)." };
    }
    if (!toEmail || !fromEmail || !subject || !textContent) {
         console.error("[sendEmailWithBrevo] Missing required parameters for sending email.");
         return { success: false, status: 400, error: "Internal error: Missing required email parameters." };
    }

    const payload = {
        sender: { email: fromEmail, name: fromName },
        to: [{ email: toEmail }], // Brevo API expects 'to' as an array of objects
        subject: subject,
        textContent: textContent,
        // You could also add 'htmlContent' for richer HTML emails
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey, // Use 'api-key' header for Brevo auth
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // Check if the request was successful (Brevo typically returns 201 Created for success)
        if (response.ok) {
            console.log(`Brevo email sent successfully to ${toEmail}. Status: ${response.status}`);
            return { success: true, status: response.status };
        } else {
            // Attempt to read error details from Brevo response body
            let errorBody = `Brevo API Error (${response.status})`; // Default error
            try {
               const errorJson = await response.json();
               // Brevo error format might be like: { code: '...', message: '...' }
               if (errorJson && errorJson.message) {
                   errorBody = `Brevo API Error (${response.status}): ${errorJson.code} - ${errorJson.message}`;
               } else {
                   errorBody = `Brevo API Error (${response.status}): ${await response.text()}`; // Fallback to text
               }
            } catch (e) {
               console.warn("[sendEmailWithBrevo] Could not parse Brevo error response body.");
               errorBody = `Brevo API Error (${response.status})`; // Fallback if parsing fails
            }
            console.error(`[sendEmailWithBrevo] Failed to send email. ${errorBody}`);
            return { success: false, status: response.status, error: errorBody };
        }
    } catch (error) {
        console.error('[sendEmailWithBrevo] Network or fetch error:', error);
        return { success: false, status: 500, error: `Network error during email sending: ${error.message}` };
    }
}


export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const email = body.email;
        const comment = body.comment;
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP'); // Get user's IP

        // --- Backend Validation ---
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

        // --- Sanitization ---
        const sanitizedComment = escapeHtml(comment.trim());
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
        const emailSubject = 'New Comment on softwarestable.com';

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

        // Call the Brevo sending function
        const emailResult = await sendEmailWithBrevo({
            apiKey: env.BREVO_API_KEY,
            toEmail: env.NOTIFICATION_EMAIL_TO,
            fromEmail: env.NOTIFICATION_EMAIL_FROM,
            fromName: "SoftwareStable Website", // Or make this configurable via env
            subject: emailSubject,
            textContent: `Email: ${sanitizedEmail} Comment: ${sanitizedComment}`,
        });

        // --- Respond to Client ---
        if (emailResult.success) {
            console.log(`Successfully processed comment and sent notification via Brevo for: ${sanitizedEmail}`);
            return new Response(JSON.stringify({ success: true, message: 'Comment submitted successfully!' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            // Notification failed, but the comment *was* processed up to this point.
            // Log the specific error from Brevo function return
            console.error(`Comment processed for ${sanitizedEmail}, but Brevo notification failed. Status: ${emailResult.status}, Error: ${emailResult.error}`);
            // Return success to the user, as their main action (submitting) was technically handled.
            return new Response(JSON.stringify({ success: true, message: 'Comment submitted, but there was an issue sending the notification.' }), {
                status: 200, // 200 OK because user action succeeded from their perspective.
                headers: { 'Content-Type': 'application/json' },
            });
            // --- Alternative: If notification is CRITICAL ---
            // return new Response(JSON.stringify({ success: false, message: `Failed to process comment fully due to notification error. Please try again later.` }), {
            //     status: 500, // Internal Server Error because a critical step failed
            //     headers: { 'Content-Type': 'application/json' },
            // });
        }


       /*
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