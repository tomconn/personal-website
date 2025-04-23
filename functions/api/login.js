// File: functions/api/login.js

import { isValidEmail, verifyRecaptcha } from '../utils/validation.js';
import { verifyPassword, createSessionCookie, generateSecureToken } from '../utils/auth.js'; // Removed generateSecureToken if not needed for simple cookie value

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const email = body.email?.trim();
        const password = body.password; // Don't trim
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP');

        // --- Validation ---
        if (!email || !isValidEmail(email)) {
            return new Response(JSON.stringify({ success: false, message: 'Please provide a valid email address.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }
        if (!password) {
             return new Response(JSON.stringify({ success: false, message: 'Password is required.' }), {
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

        // --- Check D1 ---
        if (!env.DB) {
             console.error("D1 Database binding (DB) is not configured.");
             return new Response(JSON.stringify({ success: false, message: 'Server configuration error [db].' }), { status: 500 });
        }

        // --- Find User ---
        const user = await env.DB.prepare(
            "SELECT id, email, password_hash, salt, is_active FROM users WHERE email = ?"
            )
            .bind(email)
            .first();

        if (!user) {
            console.warn(`Login attempt failed: User not found (${email})`);
            return new Response(JSON.stringify({ success: false, message: 'Username and/or password is not found!' }), {
                status: 401, // Unauthorized
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Check if Active ---
        if (user.is_active !== 1) {
             console.warn(`Login attempt failed: User inactive (${email})`);
              return new Response(JSON.stringify({ success: false, message: 'Account is not activated. Please check your email.' }), {
                status: 403, // Forbidden
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Verify Password ---
        const isPasswordValid = await verifyPassword(user.password_hash, user.salt, password);

        if (!isPasswordValid) {
            console.warn(`Login attempt failed: Invalid password (${email})`);
             return new Response(JSON.stringify({ success: false, message: 'Username and/or password is not found!' }), { // Keep message generic
                status: 401, // Unauthorized
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Login Success: Generate Session Token & Set Cookie ---
        // Simple approach: Use a secure random token as the cookie value directly.
        // More complex: Use JWT containing user ID, expiry etc. (requires JWT library/implementation)
        const sessionToken = generateSecureToken(32); // Generate a new random token for the session

        // Store session in D1? Optional, makes logout easier/more robust but adds DB load.
        // For stateless: just set the cookie.

        const cookieHeader = createSessionCookie(sessionToken);

        console.log(`Login successful: User ${user.id} (${email})`);

        return new Response(JSON.stringify({ success: true, message: 'Login successful.' }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': cookieHeader, // Set the session cookie
            }
        });


    } catch (error) {
        console.error('Login Error:', error);
        if (error instanceof SyntaxError) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid request format.' }), { status: 400 });
        }
        return new Response(JSON.stringify({ success: false, message: 'An unexpected server error occurred during login.' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}