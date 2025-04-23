// File: functions/api/register.js

import { sendEmailWithBrevo } from '../utils/email.js';
import { isValidEmail, validatePasswordComplexity, verifyRecaptcha } from '../utils/validation.js';
import { hashPassword, generateSecureToken } from '../utils/auth.js';

// Constants
const ACTIVATION_TOKEN_EXPIRY_MINUTES = 60; // 1 hour

export async function onRequestPost({ request, env }) {
    // Basic CSRF check (optional but recommended)
    const origin = request.headers.get('Origin');
    const allowedOrigin = env.ACTIVATION_BASE_URL; // Use the base URL env var
    // Simple check - can be made more robust
    // if (!origin || origin !== allowedOrigin) {
    //     console.warn(`CSRF Warning: Origin mismatch. Got: ${origin}, Expected: ${allowedOrigin}`);
    //     // Return generic error or just log it depending on policy
    //     // return new Response(JSON.stringify({ success: false, message: 'Invalid request origin.' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
    // }

    try {
        const body = await request.json();
        const email = body.email?.trim();
        const password = body.password; // Don't trim password
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP');

        // --- Validation ---
        if (!email || !isValidEmail(email)) {
            return new Response(JSON.stringify({ success: false, message: 'Please provide a valid email address.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        const passwordValidation = validatePasswordComplexity(password);
        if (!passwordValidation.isValid) {
             return new Response(JSON.stringify({ success: false, message: passwordValidation.message }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!recaptchaToken) {
             return new Response(JSON.stringify({ success: false, message: 'reCAPTCHA verification is required.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- reCAPTCHA Verification ---
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, env.RECAPTCHA_SECRET_KEY, ip);
        if (!recaptchaResult.success) {
            return new Response(JSON.stringify({ success: false, message: recaptchaResult.message || 'reCAPTCHA verification failed.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Check Dependencies (D1, Env Vars) ---
        if (!env.DB) {
             console.error("D1 Database binding (DB) is not configured.");
             return new Response(JSON.stringify({ success: false, message: 'Server configuration error [db].' }), { status: 500 });
        }
        if (!env.BREVO_API_KEY || !env.NOTIFICATION_EMAIL_FROM || !env.ACTIVATION_BASE_URL) {
             console.error("Missing required environment variables for registration (BREVO_API_KEY, NOTIFICATION_EMAIL_FROM, ACTIVATION_BASE_URL).");
              return new Response(JSON.stringify({ success: false, message: 'Server configuration error [email/activation].' }), { status: 500 });
        }


        // --- Check if user already exists ---
        const existingUser = await env.DB.prepare("SELECT id, is_active FROM users WHERE email = ?")
                                         .bind(email)
                                         .first();

        if (existingUser) {
            // If inactive, maybe resend activation? For simplicity, just block re-registration for now.
            // if (existingUser.is_active === 0) {
            //     // TODO: Implement resend activation logic if desired
            //     return new Response(JSON.stringify({ success: false, message: 'Account exists but is inactive. Check email or request activation resent.' }), { status: 409 });
            // }
            return new Response(JSON.stringify({ success: false, message: 'An account with this email already exists.' }), {
                status: 409, // Conflict
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Hash Password ---
        const { hash: hashedPassword, salt } = await hashPassword(password);

        // --- Generate Activation Token ---
        const activationToken = generateSecureToken();
        const expiryDate = new Date(Date.now() + ACTIVATION_TOKEN_EXPIRY_MINUTES * 60 * 1000);
        const expiryTimestamp = expiryDate.toISOString(); // Store as ISO string

        // --- Store User in D1 ---
        try {
             const stmt = env.DB.prepare(`
                INSERT INTO users (email, password_hash, salt, is_active, activation_token, activation_expires)
                VALUES (?, ?, ?, 0, ?, ?)
            `);
            await stmt.bind(email, hashedPassword, salt, activationToken, expiryTimestamp).run();
            console.log(`User registered (inactive): ${email}`);
        } catch (dbError) {
             console.error("D1 Insert Error:", dbError);
             // Check for unique constraint violation (just in case the first check missed due to race condition)
              if (dbError.message?.includes('UNIQUE constraint failed: users.email')) {
                  return new Response(JSON.stringify({ success: false, message: 'An account with this email already exists.' }), { status: 409 });
              }
             return new Response(JSON.stringify({ success: false, message: 'Database error during registration.' }), { status: 500 });
        }

        // --- Send Activation Email ---
        const activationLink = `${env.ACTIVATION_BASE_URL}/activate.html?token=${activationToken}`;
        const emailSubject = 'Activate Your Account - softwarestable.com';
        const emailTextContent = `
Hello,

Thank you for registering at softwarestable.com.

Please click the following link to activate your account (link expires in ${ACTIVATION_TOKEN_EXPIRY_MINUTES} minutes):
${activationLink}

If you did not register, please ignore this email.

        `;
         // Optional: Create HTML version
         const emailHtmlContent = `
<p>Hello,</p>
<p>Thank you for registering at softwarestable.com.</p>
<p>Please click the button below to activate your account (link expires in ${ACTIVATION_TOKEN_EXPIRY_MINUTES} minutes):</p>
<p style="margin: 20px 0;">
    <a href="${activationLink}" style="background-color: #0B3D91; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-family: sans-serif;">Activate Account</a>
</p>
<p>If the button doesn't work, copy and paste this link into your browser:<br>${activationLink}</p>
<p>If you did not register, please ignore this email.</p>
        `;


        const emailResult = await sendEmailWithBrevo({
            apiKey: env.BREVO_API_KEY,
            toEmail: email,
            fromEmail: env.NOTIFICATION_EMAIL_FROM, // Must be verified sender in Brevo
            fromName: "Account Activation",
            subject: emailSubject,
            textContent: emailTextContent,
            htmlContent: emailHtmlContent,
        });

        if (!emailResult.success) {
             // Log the error, but registration technically succeeded.
             // Maybe consider rolling back the DB insert or marking user for cleanup? Simpler: just log.
             console.error(`User ${email} registered, but activation email failed. Brevo Status: ${emailResult.status}, Error: ${emailResult.error}`);
              // Inform user, but still return success as they are in the DB
              return new Response(JSON.stringify({ success: true, message: 'Registration complete, but failed to send activation email. Please contact support.' }), { status: 201 });
        }

        // --- Success ---
        return new Response(JSON.stringify({ success: true, message: 'Registration successful. Please check your email for activation link.' }), {
            status: 201, // Created
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Registration Error:', error);
         if (error instanceof SyntaxError) { // Bad JSON body
             return new Response(JSON.stringify({ success: false, message: 'Invalid request format.' }), { status: 400 });
         }
        return new Response(JSON.stringify({ success: false, message: 'An unexpected server error occurred during registration.' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}