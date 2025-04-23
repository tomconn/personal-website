// File: functions/api/activate-account.js

export async function onRequestPost({ request, env }) {
    try {
       const body = await request.json();
       const token = body.token;

       if (!token || typeof token !== 'string' || token.length === 0) {
           return new Response(JSON.stringify({ success: false, message: 'Activation token is missing or invalid.' }), {
               status: 400, headers: { 'Content-Type': 'application/json' }
           });
       }

       if (!env.DB) {
           console.error("D1 Database binding (DB) is not configured.");
           return new Response(JSON.stringify({ success: false, message: 'Server configuration error [db].' }), { status: 500 });
       }

       // --- Find user by token and check expiry ---
       const now = new Date().toISOString();
       const user = await env.DB.prepare(
           "SELECT id, email, is_active FROM users WHERE activation_token = ? AND activation_expires > ?"
           )
           .bind(token, now) // Check if token matches AND hasn't expired
           .first();

       if (!user) {
           // Could be expired token or invalid token
           console.warn(`Account activation failed: Token not found or expired (${token.substring(0, 10)}...)`);
            // Check if token exists but is expired
            const expiredCheck = await env.DB.prepare("SELECT id FROM users WHERE activation_token = ?").bind(token).first();
            if (expiredCheck) {
                return new Response(JSON.stringify({ success: false, message: 'Activation link has expired. Please register again or request a new link.' }), { status: 410 }); // Gone
            } else {
                return new Response(JSON.stringify({ success: false, message: 'Invalid activation link.' }), { status: 404 }); // Not Found
            }
       }

       // --- Activate User ---
       if (user.is_active === 1) {
            console.log(`Account already active: User ${user.id} (${user.email})`);
            return new Response(JSON.stringify({ success: true, message: 'Account is already active.' }), { status: 200 });
       }

       // Update user status and clear token fields
       const stmt = env.DB.prepare(
           "UPDATE users SET is_active = 1, activation_token = NULL, activation_expires = NULL WHERE id = ?"
           );
       await stmt.bind(user.id).run();

       console.log(`Account activated: User ${user.id} (${user.email})`);

       return new Response(JSON.stringify({ success: true, message: 'Account activated successfully!' }), {
           status: 200,
           headers: { 'Content-Type': 'application/json' }
       });


    } catch (error) {
       console.error('Activation Error:', error);
       if (error instanceof SyntaxError) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid request format.' }), { status: 400 });
        }
       return new Response(JSON.stringify({ success: false, message: 'An unexpected server error occurred during activation.' }), {
           status: 500, headers: { 'Content-Type': 'application/json' }
       });
   }
}