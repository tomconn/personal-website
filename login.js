// File: functions/api/login.js

import { isValidEmail, verifyRecaptcha } from '../utils/validation.js';
// Import generateSecureToken as well
import { verifyPassword, createSessionCookie, generateSecureToken } from '../utils/auth.js';

const SESSION_DURATION_SECONDS = 3 * 60 * 60; // 3 hours - Make sure this matches cookie duration logic if separate

export async function onRequestPost({ request, env }) {
    try {
        // --- Basic Setup & Input Parsing ---
        if (!env.DB) {
             console.error("D1 Database binding (DB) is not configured.");
             return new Response(JSON.stringify({ success: false, message: 'Server configuration error [db].' }), { status: 500 });
        }

        const body = await request.json();
        const email = body.email?.trim();
        const password = body.password; // Don't trim
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP');

        // --- Input Validation ---
        if (!email || !isValidEmail(email) || !password || !recaptchaToken) {
             return new Response(JSON.stringify({ success: false, message: 'Email, password, and reCAPTCHA are required.' }), {
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

        // --- Find User ---
        const user = await env.DB.prepare(
            "SELECT id, email, password_hash, salt, is_active FROM users WHERE email = ?"
            )
            .bind(email)
            .first();

        if (!user) {
            console.warn(`Login attempt failed: User not found (${email})`);
            // Generic error message for security
            return new Response(JSON.stringify({ success: false, message: 'Invalid credentials or inactive account.' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Check if Active ---
        if (user.is_active !== 1) {
             console.warn(`Login attempt failed: User inactive (${email})`);
             return new Response(JSON.stringify({ success: false, message: 'Invalid credentials or inactive account.' }), {
                status: 401, headers: { 'Content-Type': 'application/json' } // Use 401 for inactive as well
            });
        }

        // --- Verify Password ---
        const isPasswordValid = await verifyPassword(user.password_hash, user.salt, password);

        if (!isPasswordValid) {
            console.warn(`Login attempt failed: Invalid password (${email})`);
             return new Response(JSON.stringify({ success: false, message: 'Invalid credentials or inactive account.' }), { // Keep message generic
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Login Success: Generate Session Token & Store in D1 ---
        const sessionToken = generateSecureToken(32); // Create a new secure token
        const expires = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
        const expiresISO = expires.toISOString(); // Format for D1 DATETIME

        // Store the session in the database
        try {
            await env.DB.prepare(
                "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
            )
            .bind(sessionToken, user.id, expiresISO)
            .run();
             console.log(`Session stored in D1 for user ${user.id}`);
        } catch (dbError) {
            console.error(`Failed to store session in D1 for user ${user.id}:`, dbError);
            // If we can't store the session, the user can't be considered logged in reliably
             return new Response(JSON.stringify({ success: false, message: 'Failed to create session. Please try again.' }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Set Session Cookie ---
        const cookieHeader = createSessionCookie(sessionToken); // Use the token we just stored

        console.log(`Login successful: User ${user.id} (${email})`);

        return new Response(JSON.stringify({ success: true, message: 'Login successful.' }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': cookieHeader, // Set the session cookie in the browser
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        if (error instanceof SyntaxError) { // Bad JSON body
            return new Response(JSON.stringify({ success: false, message: 'Invalid request format.' }), { status: 400 });
        }
        return new Response(JSON.stringify({ success: false, message: 'An unexpected server error occurred during login.' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}