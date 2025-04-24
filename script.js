// File: script.js
// Handles interactivity for the main index.html page.

document.addEventListener('DOMContentLoaded', () => {

    // --- Authentication Link Management ---
    const authLinksContainer = document.getElementById('auth-links');

    /**
     * Updates the navigation links (Login/Register vs Logout) based on cookie presence.
     */
    function updateAuthLinks() {
        if (!authLinksContainer) {
            console.warn('Auth links container (#auth-links) not found.');
            return;
        }

        // Check for the session cookie name defined in functions/utils/auth.js
        const SESSION_COOKIE_NAME = 'session_token';
        const isLoggedIn = document.cookie.split(';').some((item) => item.trim().startsWith(`${SESSION_COOKIE_NAME}=`));

        if (isLoggedIn) {
            // User is logged in - Show Logout button
            authLinksContainer.innerHTML = `
                <button id="logout-button" class="button-link-style">Logout</button>
            `;
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', handleLogout);
            } else {
                 console.error('Failed to find dynamically added logout button.');
            }
        } else {
            // User is logged out - Show Login/Register links
            authLinksContainer.innerHTML = `
                <a href="/login.html">Login</a>
                <span class="separator">|</span>
                <a href="/register.html">Register</a>
            `;
        }
    }

    /**
     * Handles the logout process when the logout button is clicked.
     * @param {Event} event - The click event.
     */
    async function handleLogout(event) {
        event.preventDefault();
        const logoutButton = event.target;
        logoutButton.disabled = true;
        logoutButton.textContent = 'Logging out...';

        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            // Check if the request itself was successful (status 2xx)
            if (response.ok) {
                 // Server successfully processed the logout (cleared cookie via Set-Cookie header)
                console.log('Logout successful.');
                // Update UI immediately to reflect logged-out state
                updateAuthLinks();
                 // Optional: Show a brief success message or redirect
                 // showStatusMessage(someGlobalStatusElement, 'Logged out successfully.', 'success');
                 // window.location.reload(); // Or just reload to clear state
            } else {
                 // Server returned an error status
                console.error('Logout request failed:', response.status, await response.text());
                 alert('Logout failed. Please try again.'); // Simple feedback for the user
                 logoutButton.disabled = false; // Re-enable button on failure
                 logoutButton.textContent = 'Logout';
            }
        } catch (error) {
            // Network error or other exception during fetch
            console.error('Error during logout fetch:', error);
            alert('An error occurred during logout. Please check your connection.');
             logoutButton.disabled = false;
             logoutButton.textContent = 'Logout';
        }
    }

    // Initial check and setup of auth links when the page loads
    updateAuthLinks();

    // --- End Authentication Link Management ---


    // --- Footer Year ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    } else {
        console.warn('Footer year span (#year) not found.');
    }
    // --- End Footer Year ---


    // --- Fade-in Animation on Scroll ---
    const fadeElems = document.querySelectorAll('.fade-in');
    if (typeof IntersectionObserver !== 'undefined') {
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
    } else {
        // Fallback for older browsers: just make elements visible immediately
        console.warn('IntersectionObserver not supported. Fade-in animations disabled.');
        fadeElems.forEach(elem => elem.classList.add('visible'));
    }
    // --- End Fade-in Animation ---


    // --- Comment Form Logic ---
    const commentForm = document.getElementById('comment-form');
    const commentTextarea = document.getElementById('comment-text');
    const charCount = document.getElementById('char-count');
    const formStatusComment = document.getElementById('form-status-comment'); // Specific ID for comment status
    const submitButtonComment = document.getElementById('submit-comment');
    const recaptchaContainerComment = document.getElementById('recaptcha-container-comment'); // Specific ID
    const emailInputComment = document.getElementById('comment-email');
    const emailErrorComment = document.getElementById('email-error'); // Specific ID for comment email error

    const maxChars = 256;
    let emailErrorTimeoutComment; // Timeout specifically for comment email error

    // Check if all required comment elements exist before adding listeners
    if (commentForm && emailInputComment && emailErrorComment && commentTextarea && charCount && formStatusComment && submitButtonComment && recaptchaContainerComment) {

        // --- Character Counter Update ---
        commentTextarea.addEventListener('input', () => {
            const currentLength = commentTextarea.value.length;
            charCount.textContent = `${currentLength} / ${maxChars}`;
            // Add/remove error class based on length
            charCount.classList.toggle('error', currentLength > maxChars);
        });
        // Initial count update on page load
        charCount.textContent = `${commentTextarea.value.length} / ${maxChars}`;


        // --- Email Validation Feedback (using local functions for specificity) ---
        // Helper to show the email-specific error message for the comment form
        function showCommentEmailError(message) {
            if (emailErrorComment) {
                emailErrorComment.textContent = message;
                emailErrorComment.classList.add('visible');
                emailInputComment.setAttribute('aria-invalid', 'true'); // Accessibility
                // Clear existing timeout before setting a new one
                clearTimeout(emailErrorTimeoutComment);
                // Set timeout to hide the error message after 20 seconds
                emailErrorTimeoutComment = setTimeout(hideCommentEmailError, 20000); // 20 seconds
            }
        }

        // Helper to hide the email-specific error message for the comment form
        function hideCommentEmailError() {
            if (emailErrorComment) {
                 clearTimeout(emailErrorTimeoutComment); // Clear timeout if hidden manually/by validation
                 emailErrorComment.classList.remove('visible');
                 emailInputComment.removeAttribute('aria-invalid'); // Accessibility
            }
        }

        // Add input listener for real-time email validation feedback
        emailInputComment.addEventListener('input', () => {
            const emailValue = emailInputComment.value.trim();
            // Use the shared validation function from common.js
            if (emailValue === '' || isValidEmailFormat(emailValue)) {
                hideCommentEmailError(); // Hide error if valid or empty
            } else {
                // Only show error if the field is not empty and invalid
                showCommentEmailError('Please enter a valid email address.');
            }
        });


        // --- Comment Form Submission Handler ---
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default browser submission
            clearTimeout(emailErrorTimeoutComment); // Clear email error timer
            hideStatusMessage(formStatusComment); // Clear previous general status messages (using common.js helper)

            // --- Client-side Validation ---
            const email = emailInputComment.value.trim();
            if (!email) {
                showCommentEmailError('Email address is required.');
                emailInputComment.focus();
                return;
            }
            if (!isValidEmailFormat(email)) { // Use common validation function
                showCommentEmailError('Please enter a valid email address.');
                emailInputComment.focus();
                return;
            }
            hideCommentEmailError(); // Hide email error if validation passes here

            const comment = commentTextarea.value.trim();
            let recaptchaResponse = null;
            let recaptchaWidgetId = recaptchaContainerComment.dataset.widgetId; // Check if widget ID was stored

            // Ensure grecaptcha is loaded and get response
            try {
                // Use widget ID if available, otherwise use default index 0
                recaptchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
                 if (!recaptchaResponse) {
                    showStatusMessage(formStatusComment, 'Please complete the reCAPTCHA verification.', 'error', true);
                    // Try to focus the reCAPTCHA iframe, though direct focus might be blocked
                    const iframe = recaptchaContainerComment.querySelector('iframe');
                    if (iframe) iframe.focus();
                    return;
                }
            } catch (e) {
                console.error("reCAPTCHA not ready or error getting response:", e);
                showStatusMessage(formStatusComment, 'reCAPTCHA error. Please try refreshing the page.', 'error', true); // Keep error shown
                return;
            }

            if (!comment) {
                showStatusMessage(formStatusComment, 'Comment cannot be empty.', 'error', true);
                commentTextarea.focus();
                return;
            }
            if (comment.length > maxChars) {
                showStatusMessage(formStatusComment, `Comment exceeds the maximum length of ${maxChars} characters.`, 'error', true);
                commentTextarea.focus();
                return;
            }
            // --- End Client-side Validation ---


            // Disable button and show loading state
            submitButtonComment.disabled = true;
            submitButtonComment.textContent = 'Submitting...';

            try {
                const response = await fetch('/api/submit-comment', { // Your Function endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        comment: comment, // Send the trimmed comment
                        'g-recaptcha-response': recaptchaResponse,
                    }),
                });

                // Try parsing JSON, but handle cases where response might not be JSON
                let result;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    result = await response.json();
                } else {
                    // Handle non-JSON responses (e.g., server error pages)
                    const errorText = await response.text();
                    console.error("Non-JSON response received:", response.status, errorText);
                    result = { success: false, message: `Server error (${response.status}). Please try again.` };
                }

                if (response.ok && result.success) {
                    // Success!
                    showStatusMessage(formStatusComment, 'Thank you for your comment!', 'success');
                    commentForm.reset(); // Clear the form fields (includes email and comment)
                    charCount.textContent = `0 / ${maxChars}`; // Reset char count display
                    charCount.classList.remove('error');
                    hideCommentEmailError(); // Explicitly hide email error on success
                    grecaptcha.reset(recaptchaWidgetId); // Reset reCAPTCHA widget using its ID

                } else {
                    // Handle errors reported by the server function (e.g., validation, backend reCAPTCHA fail)
                    const errorMessage = result.message || 'An unknown error occurred. Please try again.';
                    showStatusMessage(formStatusComment, errorMessage, 'error', true); // Persist error message
                    grecaptcha.reset(recaptchaWidgetId); // Reset reCAPTCHA on error so user can retry
                }

            } catch (error) {
                // Handle network errors or exceptions during the fetch itself
                console.error('Network or fetch error submitting comment:', error);
                showStatusMessage(formStatusComment, 'A network error occurred. Please check your connection and try again.', 'error', true); // Persist error
                // Don't reset reCAPTCHA here as it might be a network issue, not verification fail
            } finally {
                // Re-enable button AFTER processing, regardless of outcome
                submitButtonComment.disabled = false;
                submitButtonComment.textContent = 'Submit Comment';
            }
        });

        // Optional: Explicitly render reCAPTCHA if needed, storing widget ID
        // This is useful if you have multiple captchas or need finer control
        if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
             try {
                 const widgetId = grecaptcha.render(recaptchaContainerComment, {
                     'sitekey' : recaptchaContainerComment.dataset.sitekey || document.querySelector('meta[name="recaptcha-site-key"]')?.content
                     // Add other parameters like theme, size if needed
                 });
                 recaptchaContainerComment.dataset.widgetId = widgetId; // Store the ID
             } catch (e) {
                 console.error("Error rendering reCAPTCHA for comment form:", e);
             }
        }


    } else {
        console.warn("One or more comment form elements not found. Comment functionality disabled.");
    }
    // --- End Comment Form Logic ---


    // --- Final Console Message ---
    console.log("Software Stable: Index page initialized. All systems nominal.");
    // --- End Console Message ---

}); // End DOMContentLoaded