// File: functions/api/check-session.js

const SESSION_COOKIE_NAME = 'session_token'; // Ensure this matches utils/auth.js

export async function onRequestGet({ request, env }) {
    try {
        if (!env.DB) {
             console.error("D1 Database binding (DB) is not configured for check-session.");
             // Assume not logged in if DB isn't available
             return new Response(JSON.stringify({ loggedIn: false, error: 'Server configuration error.' }), { status: 500 });
        }

        const cookieHeader = request.headers.get('Cookie') || '';
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));

        let isLoggedIn = false;
        let sessionTokenValue = null;

        if (sessionCookie) {
            sessionTokenValue = sessionCookie.split('=')[1];
        }

        if (sessionTokenValue) {
            // Token exists in cookie, now validate against D1
            const nowISO = new Date().toISOString();
            try {
                const session = await env.DB.prepare(
                    // Check if token exists AND hasn't expired
                    "SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?"
                 )
                 .bind(sessionTokenValue, nowISO)
                 .first(); // Use first() to get the result row or null

                if (session) {
                    // Session found in D1 and is not expired
                    isLoggedIn = true;
                    // console.log(`Check Session: Valid session found for user ${session.user_id}`); // Debug log
                } else {
                     // console.log("Check Session: Token found in cookie but invalid/expired in D1."); // Debug log
                     // Consider clearing the invalid cookie here? Optional.
                     // If the session isn't in D1, definitely not logged in.
                     isLoggedIn = false;
                }
            } catch (dbError) {
                 console.error("D1 error checking session:", dbError);
                 // Assume not logged in if there's a DB error during check
                 isLoggedIn = false;
            }
        } else {
             // console.log("Check Session: No session token found in cookies."); // Debug log
             isLoggedIn = false;
        }

        // Return the result
        return new Response(JSON.stringify({ loggedIn: isLoggedIn }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in /api/check-session:', error);
        // Default to not logged in on unexpected errors
        return new Response(JSON.stringify({ loggedIn: false, error: 'Server error checking session' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}