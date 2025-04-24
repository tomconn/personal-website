// File: functions/api/login.js

import { isValidEmail, verifyRecaptcha } from '../utils/validation.js';
import { verifyPassword, createSessionCookie, generateSecureToken } from '../utils/auth.js';

const SESSION_DURATION_SECONDS = 3 * 60 * 60; // 3 hours

export async function onRequestPost({ request, env }) {
    console.log("--- /api/login: Request received ---"); // Log start

    try {
        // --- Basic Setup & Input Parsing ---
        if (!env.DB) {
             console.error("/api/login: FATAL - D1 Database binding (DB) is not configured.");
             return new Response(JSON.stringify({ success: false, message: 'Server configuration error [db].' }), { status: 500 });
        }
        console.log("/api/login: DB binding found.");

        const body = await request.json();
        const email = body.email?.trim();
        const password = body.password;
        const recaptchaToken = body['g-recaptcha-response'];
        const ip = request.headers.get('CF-Connecting-IP');
        console.log(`/api/login: Attempting login for email: ${email}`);

        // --- Input Validation ---
        if (!email || !isValidEmail(email) || !password || !recaptchaToken) {
            console.warn(`/api/login: Validation failed - Missing fields. Email: ${!!email}, Pwd: ${!!password}, ReCap: ${!!recaptchaToken}`);
             return new Response(JSON.stringify({ success: false, message: 'Email, password, and reCAPTCHA are required.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- reCAPTCHA Verification ---
        console.log("/api/login: Verifying reCAPTCHA...");
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, env.RECAPTCHA_SECRET_KEY, ip);
        if (!recaptchaResult.success) {
            console.warn("/api/login: reCAPTCHA verification failed.", recaptchaResult);
            return new Response(JSON.stringify({ success: false, message: recaptchaResult.message || 'reCAPTCHA verification failed.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log("/api/login: reCAPTCHA verified.");

        // --- Find User ---
        console.log(`/api/login: Finding user by email: ${email}...`);
        const user = await env.DB.prepare(
            "SELECT id, email, password_hash, salt, is_active FROM users WHERE email = ?"
            )
            .bind(email)
            .first();

        if (!user) {
            console.warn(`/api/login: Login failed - User not found (${email})`);
            return new Response(JSON.stringify({ success: false, message: 'Invalid credentials or inactive account.' }), { // Generic error
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
        // Log user ID *if* user is found
        console.log(`/api/login: User found. ID: ${user.id}, Active: ${user.is_active}`);

        // --- Check if Active ---
        if (user.is_active !== 1) {
             console.warn(`/api/login: Login failed - User inactive (ID: ${user.id})`);
             return new Response(JSON.stringify({ success: false, message: 'Invalid credentials or inactive account.' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Verify Password ---
        console.log(`/api/login: Verifying password for user ID: ${user.id}...`);
        const isPasswordValid = await verifyPassword(user.password_hash, user.salt, password);

        if (!isPasswordValid) {
            console.warn(`/api/login: Login failed - Invalid password (ID: ${user.id})`);
             return new Response(JSON.stringify({ success: false, message: 'Invalid credentials or inactive account.' }), { // Generic error
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log(`/api/login: Password verified for user ID: ${user.id}.`);

        // --- Login Success: Generate Session Token & Store in D1 ---
        console.log(`/api/login: Generating session token for user ID: ${user.id}...`);
        const sessionToken = generateSecureToken(32);
        const expires = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
        const expiresISO = expires.toISOString();
        console.log(`/api/login: Generated Token: ${sessionToken.substring(0,8)}..., UserID: ${user.id}, Expires: ${expiresISO}`);

        // Store the session in the database
        console.log(`/api/login: Attempting to store session in D1...`);
        try {
            // Ensure user.id exists and is valid before binding
            if (!user || typeof user.id !== 'number') {
                 console.error(`/api/login: CRITICAL - Invalid user.id (${user?.id}) before D1 session insert.`);
                 throw new Error("Invalid user ID for session storage.");
            }

            const stmt = env.DB.prepare(
                "INSERT INTO sessions (token, user_id, expires_at) VALUES (?1, ?2, ?3)" // Use numbered params for clarity
            );
            const info = await stmt.bind(sessionToken, user.id, expiresISO).run(); // Await the run() call

            console.log(`/api/login: D1 session insert result: ${JSON.stringify(info)}`); // Log the result meta
            if (!info.success) {
                 // D1 itself reported an issue (though errors usually throw)
                 console.error(`/api/login: D1 insert reported failure: ${JSON.stringify(info.error || 'Unknown D1 failure')}`);
                 throw new Error("D1 session insert reported failure."); // Force into catch block
            }
             console.log(`/api/login: Session stored successfully in D1 for user ${user.id}.`);

        } catch (dbError) {
            console.error(`/api/login: CRITICAL - Failed to store session in D1 for user ${user.id}. Token: ${sessionToken.substring(0,8)}... Error:`, dbError);
            // Provide a more specific error message if possible
             let clientMessage = 'Failed to create session. Please try again.';
             if (dbError.message?.includes("FOREIGN KEY constraint failed")) {
                 clientMessage = 'Session creation failed due to data inconsistency.';
             } else if (dbError.message?.includes("UNIQUE constraint failed")) {
                 // This shouldn't happen if token generation is good, but handle anyway
                 clientMessage = 'Session creation conflict. Please try again.';
             }
             return new Response(JSON.stringify({ success: false, message: clientMessage }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Set Session Cookie ---
        console.log(`/api/login: Creating session cookie...`);
        const cookieHeader = createSessionCookie(sessionToken); // Use the token we just stored
        console.log(`/api/login: Cookie header generated: ${cookieHeader.substring(0, 50)}...`);


        console.log(`--- /api/login: Login successful for User ${user.id} (${email}) ---`);

        return new Response(JSON.stringify({ success: true, message: 'Login successful.' }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': cookieHeader, // Set the session cookie in the browser
            }
        });

    } catch (error) {
        // Catch errors *outside* the specific D1 try-catch or other general errors
        console.error('--- /api/login: UNHANDLED Error ---:', error);
        if (error instanceof SyntaxError) { // Bad JSON body
            return new Response(JSON.stringify({ success: false, message: 'Invalid request format.' }), { status: 400 });
        }
        return new Response(JSON.stringify({ success: false, message: 'An unexpected server error occurred during login.' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}