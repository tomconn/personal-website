// File: login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitButton = document.getElementById('submit-login');
    const formStatus = document.getElementById('form-status-login');
    const recaptchaContainer = document.getElementById('recaptcha-container-login'); // Needed for check

    if (!loginForm || !emailInput || !passwordInput || !submitButton || !formStatus || !recaptchaContainer) {
        console.error('Login form elements missing!');
        if (formStatus) showStatusMessage(formStatus, 'Error loading login form.', 'error', true);
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideStatusMessage(formStatus); // Clear previous messages

        const email = emailInput.value.trim();
        const password = passwordInput.value; // Don't trim password
        let recaptchaResponse = null;

        // --- Client-side Validation ---
        if (!email || !isValidEmailFormat(email)) {
             showStatusMessage(formStatus, 'Please enter a valid email address.', 'error', true);
             emailInput.focus();
            return;
        }
        if (!password) {
            showStatusMessage(formStatus, 'Please enter your password.', 'error', true);
            passwordInput.focus();
            return;
        }

        try {
            recaptchaResponse = grecaptcha.getResponse();
             if (!recaptchaResponse) {
                showStatusMessage(formStatus, 'Please complete the reCAPTCHA.', 'error', true);
                return;
            }
        } catch (e) {
            console.error("reCAPTCHA error:", e);
            showStatusMessage(formStatus, 'reCAPTCHA error. Please refresh.', 'error', true);
            return;
        }
        // --- End Validation ---


        submitButton.disabled = true;
        submitButton.textContent = 'Logging In...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    'g-recaptcha-response': recaptchaResponse,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success! Redirect to homepage. The cookie is set by the server.
                 showStatusMessage(formStatus, 'Login successful! Redirecting...', 'success');
                window.location.href = '/'; // Redirect to home page
            } else {
                // Use the specific error message from the server
                 const errorMessage = result.message || 'Login failed. Please check your credentials.';
                 showStatusMessage(formStatus, errorMessage, 'error', true);
                 grecaptcha.reset(); // Reset captcha on failure
                 passwordInput.value = ''; // Clear password field on failure
                 passwordInput.focus();
            }

        } catch (error) {
            console.error('Login fetch error:', error);
            showStatusMessage(formStatus, 'A network error occurred. Please try again.', 'error', true);
            grecaptcha.reset(); // Reset captcha on network error too
        } finally {
            // Re-enable button unless redirecting
            if (!window.location.pathname.endsWith('/')) { // Avoid re-enabling if redirect started
                 submitButton.disabled = false;
                 submitButton.textContent = 'Login';
            }
        }
    });
});