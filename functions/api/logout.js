// File: functions/api/logout.js

import { clearSessionCookie } from '../utils/auth.js';

const SESSION_COOKIE_NAME = 'session_token'; // Ensure this matches utils/auth.js

export async function onRequestPost({ request, env }) {

    let sessionTokenValue = null;
    let errorMessage = null; // To potentially capture D1 errors

    // 1. Try to get the token from the cookie to delete from D1
    try {
        const cookieHeader = request.headers.get('Cookie') || '';
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));

        if (sessionCookie) {
            sessionTokenValue = sessionCookie.split('=')[1];
        }
    } catch (parseError) {
        console.error("Error parsing cookies during logout:", parseError);
        // Continue to clear cookie anyway
    }

    // 2. If token found, try to delete it from D1
    if (sessionTokenValue && env.DB) { // Check if DB binding exists
        try {
            const result = await env.DB.prepare(
                "DELETE FROM sessions WHERE token = ?"
            )
            .bind(sessionTokenValue)
            .run();

            if (result.success && result.meta.changes > 0) {
                 console.log(`Logout: Deleted session ${sessionTokenValue.substring(0,8)}... from D1.`);
            } else if (result.success && result.meta.changes === 0) {
                // console.log(`Logout: Session ${sessionTokenValue.substring(0,8)}... not found in D1 (already logged out or expired?).`);
            } else {
                 console.warn(`Logout: D1 delete operation reported failure for token ${sessionTokenValue.substring(0,8)}...`);
                 errorMessage = 'Failed to fully clear session server-side.'; // Non-critical error
            }
        } catch (dbError) {
             console.error(`Logout: D1 error deleting session ${sessionTokenValue.substring(0,8)}... :`, dbError);
             errorMessage = 'Server error during session cleanup.'; // Non-critical error
             // Still proceed to clear the browser cookie
        }
    } else if (sessionTokenValue && !env.DB) {
         console.error("Logout: D1 Database binding (DB) is not configured. Cannot delete session from DB.");
         errorMessage = 'Server configuration error prevents full session cleanup.'; // Non-critical error
    }

    // 3. Always clear the cookie in the browser
    const cookieHeader = clearSessionCookie();

    console.log("User logout processed.");

    // Return success (from user perspective, cookie is cleared) and the header
    return new Response(JSON.stringify({
        success: true,
        message: 'Logout successful.',
        ...(errorMessage && { warning: errorMessage }) // Include warning if D1 delete failed
        }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookieHeader,
        }
    });
}