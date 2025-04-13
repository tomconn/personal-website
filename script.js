document.addEventListener('DOMContentLoaded', () => {

    // Set current year in footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Simple fade-in animation for elements on scroll
    const fadeElems = document.querySelectorAll('.fade-in');
    const observerOptions = {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1 // trigger when 10% of the element is visible
    };
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve after animation to save resources
                // observer.unobserve(entry.target);
            }
            // Optional: If you want elements to fade out when scrolling up
            // else {
            //     entry.target.classList.remove('visible');
            // }
        });
    };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    fadeElems.forEach(elem => observer.observe(elem));


    // --- Comment Form Logic ---
    const commentForm = document.getElementById('comment-form');
    const commentTextarea = document.getElementById('comment-text');
    const charCount = document.getElementById('char-count');
    const formStatus = document.getElementById('form-status');
    const submitButton = document.getElementById('submit-comment');
    const recaptchaContainer = document.getElementById('recaptcha-container'); // To check if it exists
    // *** NEW: Get Email elements ***
    const emailInput = document.getElementById('comment-email');
    const emailError = document.getElementById('email-error');
    // *** END NEW ***

    const maxChars = 256;
    let statusTimeout; // To manage the success/error message timeout
    let emailErrorTimeout; // *** NEW: Timeout for email error message ***

    // Check if all required comment elements exist before adding listeners
    // *** MODIFIED: Added emailInput and emailError to the check ***
    if (commentForm && emailInput && emailError && commentTextarea && charCount && formStatus && submitButton && recaptchaContainer) {

        // --- Character Counter Update ---
        commentTextarea.addEventListener('input', () => {
            const currentLength = commentTextarea.value.length;
            charCount.textContent = `${currentLength} / ${maxChars}`;
            // Add visual feedback if exceeding limit
            if (currentLength > maxChars) {
                 charCount.classList.add('error');
            } else {
                 charCount.classList.remove('error');
            }
        });
        // Initial count update on page load
        charCount.textContent = `${commentTextarea.value.length} / ${maxChars}`;


        // *** NEW: Email Validation Logic ***
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format regex

        function isValidEmail(email) {
            return emailRegex.test(email);
        }

        function showEmailError(message) {
            if (emailError) {
                emailError.textContent = message;
                emailError.classList.add('visible');
                emailInput.setAttribute('aria-invalid', 'true'); // Accessibility

                // Clear existing timeout before setting a new one
                clearTimeout(emailErrorTimeout);
                // Set timeout to hide the error message after 20 seconds
                emailErrorTimeout = setTimeout(() => {
                    hideEmailError();
                }, 20000); // 20 seconds
            }
        }

        function hideEmailError() {
            if (emailError) {
                 clearTimeout(emailErrorTimeout); // Clear timeout if hidden manually/by validation
                 emailError.classList.remove('visible');
                 emailInput.removeAttribute('aria-invalid'); // Accessibility
                 // Optional: Clear text after transition
                 // setTimeout(() => { emailError.textContent = ''; }, 300); // Match CSS transition
            }
        }

        // Add input listener for real-time validation feedback
        emailInput.addEventListener('input', () => {
            const emailValue = emailInput.value.trim();
            if (emailValue === '' || isValidEmail(emailValue)) {
                hideEmailError(); // Hide error if valid or empty
            } else {
                // Only show error if the field is not empty and invalid
                showEmailError('Please enter a valid email address.');
            }
        });
        // *** END NEW: Email Validation Logic ***


        // --- Form Submission Handler ---
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default browser submission
            clearTimeout(statusTimeout); // Clear any existing general status message timeout
            // *** NEW: Clear email error timeout on submit attempt ***
            clearTimeout(emailErrorTimeout);

            // --- Client-side Validation ---
            // *** NEW: Get and validate email ***
            const email = emailInput.value.trim();
            if (!email) {
                showEmailError('Email address is required.');
                emailInput.focus();
                return;
            }
            if (!isValidEmail(email)) {
                showEmailError('Please enter a valid email address.');
                emailInput.focus();
                return;
            }
            // Hide email error if validation passes here
            hideEmailError();
            // *** END NEW ***

            const comment = commentTextarea.value.trim();
            let recaptchaResponse = null;

            // Ensure grecaptcha is loaded and get response
            try {
                recaptchaResponse = grecaptcha.getResponse();
            } catch (e) {
                console.error("reCAPTCHA not ready or error getting response:", e);
                showStatus('reCAPTCHA is not ready. Please wait or refresh.', 'error', true); // Keep error shown
                // Don't disable button if reCAPTCHA itself failed to load
                return;
            }

            if (!comment) {
                showStatus('Comment cannot be empty.', 'error');
                commentTextarea.focus();
                return;
            }
            if (comment.length > maxChars) {
                showStatus(`Comment exceeds the maximum length of ${maxChars} characters.`, 'error');
                commentTextarea.focus();
                return;
            }
             if (!recaptchaResponse) {
                showStatus('Please complete the reCAPTCHA verification.', 'error');
                // Try to focus the reCAPTCHA iframe, though direct focus might be blocked
                const iframe = recaptchaContainer.querySelector('iframe');
                if (iframe) iframe.focus();
                return;
            }
            // --- End Validation ---


            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            hideStatus(); // Clear previous general status message immediately

            try {
                const response = await fetch('/api/submit-comment', { // Your Function endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        // *** NEW: Include email in the payload ***
                        email: email,
                        comment: comment, // Send the trimmed comment
                        'g-recaptcha-response': recaptchaResponse,
                    }),
                });

                // Try parsing JSON, but handle cases where response might not be JSON
                let result;
                try {
                     result = await response.json();
                } catch(e) {
                    // If response is not JSON (e.g., server error page)
                    console.error("Failed to parse JSON response:", e);
                    result = { success: false, message: `Server returned status ${response.status}. Please try again.` };
                }


                if (response.ok && result.success) {
                    showStatus('Thank you for your comment!', 'success');
                    commentForm.reset(); // Clear the form fields (includes email and comment)
                    charCount.textContent = `0 / ${maxChars}`; // Reset char count display
                    charCount.classList.remove('error');
                     // *** NEW: Explicitly hide email error on success ***
                    hideEmailError();
                    grecaptcha.reset(); // Reset reCAPTCHA widget

                    // Set timeout to hide success message after 20 seconds (uses existing statusTimeout)
                    statusTimeout = setTimeout(() => {
                        hideStatus();
                    }, 20000); // 20 seconds

                } else {
                    // Handle errors from the function (including reCAPTCHA failure or server-side email validation)
                    const errorMessage = result.message || 'An unknown error occurred. Please try again.';
                    showStatus(errorMessage, 'error', true); // Keep error shown until user interaction
                    grecaptcha.reset(); // Reset reCAPTCHA on error so user can retry
                }

            } catch (error) {
                console.error('Network or fetch error submitting comment:', error);
                showStatus('A network error occurred. Please check your connection and try again.', 'error', true); // Keep error shown
                // Don't reset reCAPTCHA here as it might be a network issue, not verification fail
            } finally {
                // Re-enable button AFTER processing, regardless of outcome
                resetSubmitButton();
            }
        });

    } else {
        console.warn("One or more comment form elements (including email) not found. Comment functionality may be limited or disabled.");
    }


    // Helper function to show general status messages (success/errors below reCAPTCHA)
    // *** MODIFIED: Added 'persist' flag for errors that shouldn't auto-hide ***
    function showStatus(message, type = 'info', persist = false) { // type can be 'success' or 'error'
        if (formStatus) {
            clearTimeout(statusTimeout); // Clear existing timeout first
            formStatus.textContent = message;
            // Reset classes, then add the correct ones
            formStatus.className = 'form-status';
            if (type === 'success' || type === 'error') {
                formStatus.classList.add(type);
            }
            formStatus.classList.add('visible'); // Make it visible with transition

            // Set aria-invalid for errors for accessibility
            if (type === 'error') {
                formStatus.setAttribute('aria-invalid', 'true');
                // If persist is false (default), set a timeout for errors too
                if (!persist) {
                    statusTimeout = setTimeout(hideStatus, 20000); // Hide error after 20s
                }
            } else {
                formStatus.removeAttribute('aria-invalid');
                 // Success messages always get the timeout (handled in submit handler)
            }
        }
    }

     // Helper function to hide the general status message
    function hideStatus() {
        if (formStatus) {
            clearTimeout(statusTimeout); // Clear timeout if hidden manually
            formStatus.classList.remove('visible');
             // Optional: clear text after transition ends for cleaner DOM
             // setTimeout(() => {
             //     if (!formStatus.classList.contains('visible')) { // check if it wasn't shown again quickly
             //         formStatus.textContent = '';
             //         formStatus.className = 'form-status';
             //         formStatus.removeAttribute('aria-invalid');
             //     }
             // }, 500); // Match CSS transition duration
        }
    }

    // Helper function to reset the submit button state
    function resetSubmitButton() {
         if (submitButton) {
             submitButton.disabled = false;
             submitButton.textContent = 'Submit Comment';
         }
    }

    // Console message - a little easter egg
    console.log("Initializing connection to base... Sequence nominal.");
    console.log("Welcome aboard the Software Stable. All systems green.");

});