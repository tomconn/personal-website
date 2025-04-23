// File: common.js

/**
 * Toggles password visibility for a given password input field.
 * @param {HTMLInputElement} passwordInput - The password input element.
 * @param {HTMLButtonElement} toggleButton - The button used to toggle visibility.
 */
function togglePasswordVisibility(passwordInput, toggleButton) {
    if (!passwordInput || !toggleButton) return;

    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Update button aria-label and icon (basic example using text)
    const ariaLabel = type === 'password' ? 'Show password' : 'Hide password';
    toggleButton.setAttribute('aria-label', ariaLabel);

    // Optional: Change icon - replace with SVG manipulation or class swapping if using icons
    const eyeIconShown = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
    const eyeIconHidden = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

    toggleButton.innerHTML = type === 'password' ? eyeIconShown : eyeIconHidden;
}

// Add event listeners for any password toggles on the page
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.password-toggle').forEach(button => {
        const inputId = button.previousElementSibling.id; // Assumes button is directly after input
        const passwordInput = document.getElementById(inputId);
        if (passwordInput) {
            button.addEventListener('click', () => togglePasswordVisibility(passwordInput, button));
        }
    });

     // Dynamically set reCAPTCHA site key for all containers if meta tag exists
    const siteKeyMeta = document.querySelector('meta[name="recaptcha-site-key"]');
    if (siteKeyMeta && siteKeyMeta.content) {
        document.querySelectorAll('.g-recaptcha').forEach(container => {
             // Check if sitekey is already set (e.g., by specific page script), otherwise set it
             if (!container.dataset.sitekey) {
                 container.dataset.sitekey = siteKeyMeta.content;
             }
        });
    } else {
        console.warn("reCAPTCHA site key meta tag not found. reCAPTCHA might not render.");
    }
});


/**
 * Displays a status message in a designated element.
 * @param {HTMLElement} statusElement - The element to display the message in.
 * @param {string} message - The message text.
 * @param {'success' | 'error' | 'info'} type - The type of message.
 * @param {boolean} persist - If true, the message won't auto-hide (for errors).
 * @returns {number | null} Timeout ID if auto-hide is set, otherwise null.
 */
function showStatusMessage(statusElement, message, type = 'info', persist = false) {
    if (!statusElement) return null;

    // Clear existing timeout if exists (use a custom attribute to store it)
    const existingTimeout = statusElement.dataset.statusTimeoutId;
    if (existingTimeout) {
        clearTimeout(parseInt(existingTimeout, 10));
    }

    statusElement.textContent = message;
    // Reset classes, then add the correct ones
    statusElement.className = 'form-status'; // Base class
    if (type === 'success' || type === 'error' || type === 'info') {
        statusElement.classList.add(type);
    }
    statusElement.classList.add('visible'); // Make it visible

    // Set ARIA attributes for accessibility
    statusElement.setAttribute('role', 'alert');
    statusElement.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    if (type === 'error') {
        statusElement.setAttribute('aria-invalid', 'true');
    } else {
        statusElement.removeAttribute('aria-invalid');
    }

    // Auto-hide logic
    let timeoutId = null;
    if (!persist) {
        timeoutId = setTimeout(() => {
            hideStatusMessage(statusElement);
        }, type === 'success' ? 10000 : 20000); // Longer timeout for errors if not persisted
        statusElement.dataset.statusTimeoutId = timeoutId.toString();
    } else {
         delete statusElement.dataset.statusTimeoutId; // Remove attribute if persisted
    }
    return timeoutId;
}

/**
 * Hides a status message element.
 * @param {HTMLElement} statusElement - The status message element.
 */
function hideStatusMessage(statusElement) {
    if (!statusElement) return;

    const existingTimeout = statusElement.dataset.statusTimeoutId;
    if (existingTimeout) {
        clearTimeout(parseInt(existingTimeout, 10));
        delete statusElement.dataset.statusTimeoutId;
    }

    statusElement.classList.remove('visible');
    // Optional: Clear text and classes after transition for cleaner DOM
    // setTimeout(() => {
    //     if (!statusElement.classList.contains('visible')) { // Check if it wasn't shown again quickly
    //         statusElement.textContent = '';
    //         statusElement.className = 'form-status';
    //         statusElement.removeAttribute('role');
    //         statusElement.removeAttribute('aria-live');
    //         statusElement.removeAttribute('aria-invalid');
    //     }
    // }, 500); // Match CSS transition duration
}

/**
 * Basic email validation.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmailFormat(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Password validation based on criteria.
 * @param {string} password
 * @returns {{isValid: boolean, message: string}}
 */
function validatePassword(password) {
    if (!password) return { isValid: false, message: "Password cannot be empty." };
    if (password.length < 8) return { isValid: false, message: "Password must be at least 8 characters long." };
    if (password.length > 256) return { isValid: false, message: "Password cannot exceed 256 characters." };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: "Password must contain at least one uppercase letter." };
    if (!/[a-z]/.test(password)) return { isValid: false, message: "Password must contain at least one lowercase letter." };
    // Basic special character check - adjust regex as needed for stricter rules
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) return { isValid: false, message: "Password must contain at least one special character." };
    // Check for numbers
    if (!/\d/.test(password)) return { isValid: false, message: "Password must contain at least one number." };

    return { isValid: true, message: "Password meets criteria." };
}