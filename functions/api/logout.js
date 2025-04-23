// File: functions/api/logout.js

import { clearSessionCookie } from '../utils/auth.js';

export async function onRequestPost({ request, env }) {
    // No complex logic needed, just clear the cookie

    const cookieHeader = clearSessionCookie();

    // You might want to invalidate server-side sessions here if you stored them

    console.log("User logout initiated.");

    // Return success and the header to clear the cookie
    return new Response(JSON.stringify({ success: true, message: 'Logout successful.' }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookieHeader,
        }
    });
}