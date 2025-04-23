// File: functions/utils/validation.js

// Basic HTML entity escaping (can be shared if needed elsewhere)
export function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&") // Must be first
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, '"')
         .replace(/'/g, "'");
}

// Server-side email format validation
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Server-side password complexity validation
export function validatePasswordComplexity(password) {
     if (!password || typeof password !== 'string') return { isValid: false, message: "Password missing or invalid type." };
     if (password.length < 8) return { isValid: false, message: "Password must be at least 8 characters." };
     if (password.length > 256) return { isValid: false, message: "Password exceeds maximum length of 256." };
     if (!/[A-Z]/.test(password)) return { isValid: false, message: "Password requires an uppercase letter." };
     if (!/[a-z]/.test(password)) return { isValid: false, message: "Password requires a lowercase letter." };
     if (!/\d/.test(password)) return { isValid: false, message: "Password requires a number." };
     // Updated special character regex to be more inclusive and match common ones
     if (!/[^A-Za-z0-9]/.test(password)) return { isValid: false, message: "Password requires a special character." };
     // Add more checks if needed (e.g., no sequential characters, dictionary words - more complex)
     return { isValid: true, message: "Password meets complexity requirements." };
}


// Server-side reCAPTCHA Verification
export async function verifyRecaptcha(token, secretKey, ip = null) {
     if (!token) return { success: false, message: "reCAPTCHA token missing." };
     if (!secretKey) {
         console.error("RECAPTCHA_SECRET_KEY not configured.");
         return { success: false, message: "Server configuration error [recaptcha]." };
     }

     const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
     const formData = new URLSearchParams();
     formData.append('secret', secretKey);
     formData.append('response', token);
     if (ip) {
         formData.append('remoteip', ip);
     }

     try {
         const response = await fetch(verifyUrl, {
             method: 'POST',
             body: formData,
             headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
         });

         if (!response.ok) {
             console.error(`reCAPTCHA verification request failed: ${response.status}`);
             return { success: false, message: `reCAPTCHA server error (${response.status})` };
         }

         const data = await response.json();

         if (!data.success) {
             console.warn('reCAPTCHA verification failed:', data['error-codes']);
             return { success: false, message: 'reCAPTCHA verification failed.', errors: data['error-codes'] };
         }

         // Optional: Check score if using v3, or hostname if needed
         // if (data.score < 0.5) { ... }
         // if (data.hostname !== expectedHostname) { ... }

         return { success: true, message: 'reCAPTCHA verified.' };

     } catch (error) {
         console.error("Error verifying reCAPTCHA:", error);
         return { success: false, message: "Network error during reCAPTCHA verification." };
     }
}