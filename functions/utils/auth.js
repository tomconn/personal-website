// File: functions/utils/auth.js

// --- Password Hashing & Verification (using Web Crypto API) ---

/**
 * Generates a salt and hashes a password using SHA-256.
 * @param {string} password - The password to hash.
 * @returns {Promise<{hash: string, salt: string}>} - Base64 encoded hash and salt.
 */
export async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16)); // 16-byte salt
    const encodedPassword = new TextEncoder().encode(password);

    // Combine salt and password for hashing (or use PBKDF2/Argon2 if available/needed)
    // Simple approach: concatenate salt and password
    const saltedPassword = new Uint8Array(salt.length + encodedPassword.length);
    saltedPassword.set(salt);
    saltedPassword.set(encodedPassword, salt.length);

    const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);

    // Convert salt and hash to Base64 strings for storage
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    return { hash: hashBase64, salt: saltBase64 };
}

/**
 * Verifies a provided password against a stored hash and salt.
 * @param {string} storedHashBase64 - Base64 encoded stored hash.
 * @param {string} storedSaltBase64 - Base64 encoded stored salt.
 * @param {string} providedPassword - The password attempt to verify.
 * @returns {Promise<boolean>} - True if the password matches, false otherwise.
 */
export async function verifyPassword(storedHashBase64, storedSaltBase64, providedPassword) {
    try {
        // Decode Base64 salt and hash back to Uint8Arrays
        const salt = Uint8Array.from(atob(storedSaltBase64), c => c.charCodeAt(0));
        const storedHash = Uint8Array.from(atob(storedHashBase64), c => c.charCodeAt(0));
        const encodedPassword = new TextEncoder().encode(providedPassword);

        // Combine salt and provided password
        const saltedPassword = new Uint8Array(salt.length + encodedPassword.length);
        saltedPassword.set(salt);
        saltedPassword.set(encodedPassword, salt.length);

        // Hash the provided password with the stored salt
        const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);
        const providedHash = new Uint8Array(hashBuffer);

        // Compare the generated hash with the stored hash (timing-safe comparison is ideal but complex here)
        // Basic comparison: length check first
        if (providedHash.length !== storedHash.length) {
            return false;
        }
        // Simple element-by-element comparison (not strictly timing-safe)
        for (let i = 0; i < storedHash.length; i++) {
            if (providedHash[i] !== storedHash[i]) {
                return false;
            }
        }
        return true; // Hashes match
    } catch (error) {
        console.error("Error during password verification:", error);
        return false; // Treat errors as verification failure
    }
}

// --- Token Generation ---

/**
 * Generates a cryptographically secure random token.
 * @param {number} byteLength - The number of random bytes to generate (default 32).
 * @returns {string} - A hex-encoded random token.
 */
export function generateSecureToken(byteLength = 32) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(byteLength));
    // Convert bytes to hex string
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}


// --- Cookie Management ---
// Note: Cloudflare Workers modify headers directly on the Response object.

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION_SECONDS = 3 * 60 * 60; // 3 hours

/**
 * Creates the Set-Cookie header string for the session token.
 * @param {string} token - The session token value.
 * @returns {string} - The Set-Cookie header value.
 */
export function createSessionCookie(token) {
    const expires = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toUTCString();
    // Secure; HttpOnly; SameSite=Lax are important security attributes
    return `${SESSION_COOKIE_NAME}=${token}; Path=/; Expires=${expires}; HttpOnly; Secure; SameSite=Lax`;
}

/**
 * Creates the Set-Cookie header string to clear the session cookie.
 * @returns {string} - The Set-Cookie header value to expire the cookie.
 */
export function clearSessionCookie() {
    // Set expiry date in the past
    return `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`;
}