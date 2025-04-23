// File: register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const passwordConfirmInput = document.getElementById('register-password-confirm');
    const submitButton = document.getElementById('submit-register');
    const formStatus = document.getElementById('form-status-register');
    const emailError = document.getElementById('email-error-register');
    const passwordError = document.getElementById('password-error-register');
    const passwordConfirmError = document.getElementById('password-confirm-error-register');
    const recaptchaContainer = document.getElementById('recaptcha-container-register');

    if (!registerForm || !emailInput || !passwordInput || !passwordConfirmInput || !submitButton || !formStatus || !emailError || !passwordError || !passwordConfirmError || !recaptchaContainer) {
        console.error('Register form elements missing!');
         if(formStatus) showStatusMessage(formStatus, 'Error loading registration form.', 'error', true);
        return;
    }

    // --- Real-time Validation Feedback ---
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        if (!email || isValidEmailFormat(email)) {
             emailError.textContent = '';
             emailError.classList.remove('visible');
        } else {
             emailError.textContent = 'Invalid email format.';
             emailError.classList.add('visible');
        }
    });

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const validation = validatePassword(password); // Use common validator
        if (validation.isValid) {
            passwordError.textContent = '';
            passwordError.classList.remove('visible');
        } else {
            passwordError.textContent = validation.message;
            passwordError.classList.add('visible');
        }
        // Also check confirm password if it has a value
        if(passwordConfirmInput.value) {
            checkPasswordMatch();
        }
    });

    passwordConfirmInput.addEventListener('input', checkPasswordMatch);

    function checkPasswordMatch() {
         const password = passwordInput.value;
         const confirmPassword = passwordConfirmInput.value;
         if (confirmPassword && password !== confirmPassword) {
            passwordConfirmError.textContent = 'Passwords do not match.';
            passwordConfirmError.classList.add('visible');
            return false;
        } else {
            passwordConfirmError.textContent = '';
            passwordConfirmError.classList.remove('visible');
            return true;
        }
    }
    // --- End Real-time Validation ---


    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideStatusMessage(formStatus); // Clear general status
        // Clear specific errors first
        emailError.classList.remove('visible');
        passwordError.classList.remove('visible');
        passwordConfirmError.classList.remove('visible');

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;
        let recaptchaResponse = null;

        // --- Final Client-side Validation ---
        let isValid = true;
        if (!email || !isValidEmailFormat(email)) {
            emailError.textContent = 'Valid email is required.';
            emailError.classList.add('visible');
            isValid = false;
        }
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            passwordError.textContent = passwordValidation.message;
            passwordError.classList.add('visible');
            isValid = false;
        }
        if (!checkPasswordMatch()) {
             isValid = false; // Error message already set by checkPasswordMatch
        }

        try {
            recaptchaResponse = grecaptcha.getResponse();
             if (!recaptchaResponse) {
                showStatusMessage(formStatus, 'Please complete the reCAPTCHA.', 'error', true);
                isValid = false;
            }
        } catch (e) {
            console.error("reCAPTCHA error:", e);
            showStatusMessage(formStatus, 'reCAPTCHA error. Please refresh.', 'error', true);
             isValid = false;
        }

        if (!isValid) {
            // Focus the first invalid field
            if (!email || !isValidEmailFormat(email)) emailInput.focus();
            else if (!passwordValidation.isValid) passwordInput.focus();
            else if (!checkPasswordMatch()) passwordConfirmInput.focus();
            return; // Stop submission
        }
        // --- End Final Validation ---

        submitButton.disabled = true;
        submitButton.textContent = 'Registering...';

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password, // Send raw password, backend hashes
                    'g-recaptcha-response': recaptchaResponse,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                 // Success! Show message about checking email.
                 registerForm.reset(); // Clear the form
                 // Use persist=true for this message
                 showStatusMessage(formStatus, 'Registration successful! Please check your email to activate your account.', 'success', true);
                 // Disable button permanently after successful registration on this page view
                 submitButton.textContent = 'Registered!';
                 // Optionally hide the form or parts of it
                 // registerForm.style.display = 'none';
            } else {
                // Use the specific error message from the server
                 const errorMessage = result.message || 'Registration failed. Please try again.';
                 showStatusMessage(formStatus, errorMessage, 'error', true);
                 grecaptcha.reset(); // Reset captcha on failure
            }

        } catch (error) {
            console.error('Registration fetch error:', error);
            showStatusMessage(formStatus, 'A network error occurred. Please try again.', 'error', true);
             grecaptcha.reset();
        } finally {
             // Only re-enable button if registration wasn't successful
            if (!formStatus.classList.contains('success')) {
                submitButton.disabled = false;
                submitButton.textContent = 'Register';
            }
        }
    });
});