const SESSION_COOKIE_NAME = 'session_token'; // Ensure this matches utils/auth.js

export async function onRequestGet({ request, env }) { // Use GET, no body needed
    try {
        const cookieHeader = request.headers.get('Cookie') || '';
        const cookies = cookieHeader.split(';').map(c => c.trim());

        const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));

        let isLoggedIn = false;
        if (sessionCookie) {
            const tokenValue = sessionCookie.split('=')[1];
            // Basic check: Does a token with the correct name exist?
            // More robust check (optional): Validate the token against a session store in D1 if you implement that.
            if (tokenValue) {
                isLoggedIn = true;
                 // console.log("Check Session: Found valid session token."); // Optional debug log
            }
        } else {
             // console.log("Check Session: No session token found in cookies."); // Optional debug log
        }

        return new Response(JSON.stringify({ loggedIn: isLoggedIn }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in /api/check-session:', error);
        // Don't assume logged in if there's an error
        return new Response(JSON.stringify({ loggedIn: false, error: 'Server error checking session' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}