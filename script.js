// File: script.js
// Handles interactivity for the main index.html page.

document.addEventListener('DOMContentLoaded', () => {

    // --- Authentication Link Management ---
    const authLinksContainer = document.getElementById('auth-links');

    /**
     * Asynchronously checks the user's login status via the backend
     * and updates the navigation links accordingly.
     */
    async function initializeAuthUI() {
        if (!authLinksContainer) {
            console.warn('Auth links container (#auth-links) not found. Cannot initialize auth UI.');
            return;
        }

        let isLoggedIn = false;
        try {
            const response = await fetch('/api/check-session'); // Call the new endpoint
            if (response.ok) {
                const data = await response.json();
                isLoggedIn = data.loggedIn;
                // console.log('Session check successful:', isLoggedIn); // Debug log
            } else {
                 // Log error but assume logged out if check fails
                console.error('Failed to check session status:', response.status);
            }
        } catch (error) {
            // Log error but assume logged out on network failure etc.
            console.error('Error fetching session status:', error);
        }

        // Now update the UI based on the result from the backend
        if (isLoggedIn) {
            // User is logged in - Show Logout button
            authLinksContainer.innerHTML = `
                <button id="logout-button" class="button-link-style">Logout</button>
            `;
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', handleLogout);
            } else {
                 console.error('Failed to find dynamically added logout button after session check.');
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
            if (response.ok) {
                console.log('Logout successful via API.');
                // Update UI immediately after successful API call confirms cookie cleared
                // No need to re-fetch session status here, just show logged out state
                authLinksContainer.innerHTML = `
                    <a href="/login.html">Login</a>
                    <span class="separator">|</span>
                    <a href="/register.html">Register</a>
                `;
                 // Optional: Show a brief success message
                 // showStatusMessage(someGlobalStatusElement, 'Logged out successfully.', 'success');
            } else {
                console.error('Logout request failed:', response.status, await response.text());
                alert('Logout failed. Please try again.');
                logoutButton.disabled = false;
                logoutButton.textContent = 'Logout';
            }
        } catch (error) {
            console.error('Error during logout fetch:', error);
            alert('An error occurred during logout. Please check your connection.');
             logoutButton.disabled = false;
             logoutButton.textContent = 'Logout';
        }
    }

    // Initialize the auth UI when the page loads
    initializeAuthUI(); // Call the async function

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
            root: null, rootMargin: '0px', threshold: 0.1
        };
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // observer.unobserve(entry.target); // Optional: unobserve after first animation
                }
            });
        };
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        fadeElems.forEach(elem => observer.observe(elem));
    } else {
        console.warn('IntersectionObserver not supported. Fade-in animations disabled.');
        fadeElems.forEach(elem => elem.classList.add('visible'));
    }
    // --- End Fade-in Animation ---


    // --- Comment Form Logic ---
    const commentForm = document.getElementById('comment-form');
    const commentTextarea = document.getElementById('comment-text');
    const charCount = document.getElementById('char-count');
    const formStatusComment = document.getElementById('form-status-comment');
    const submitButtonComment = document.getElementById('submit-comment');
    const recaptchaContainerComment = document.getElementById('recaptcha-container-comment');
    const emailInputComment = document.getElementById('comment-email');
    const emailErrorComment = document.getElementById('email-error');

    const maxChars = 256;
    let emailErrorTimeoutComment;

    if (commentForm && emailInputComment && emailErrorComment && commentTextarea && charCount && formStatusComment && submitButtonComment && recaptchaContainerComment) {

        // --- Character Counter Update ---
        commentTextarea.addEventListener('input', () => {
            const currentLength = commentTextarea.value.length;
            charCount.textContent = `${currentLength} / ${maxChars}`;
            charCount.classList.toggle('error', currentLength > maxChars);
        });
        charCount.textContent = `${commentTextarea.value.length} / ${maxChars}`;

        // --- Email Validation Feedback ---
        function showCommentEmailError(message) {
            if (emailErrorComment) {
                emailErrorComment.textContent = message;
                emailErrorComment.classList.add('visible');
                emailInputComment.setAttribute('aria-invalid', 'true');
                clearTimeout(emailErrorTimeoutComment);
                emailErrorTimeoutComment = setTimeout(hideCommentEmailError, 20000);
            }
        }
        function hideCommentEmailError() {
            if (emailErrorComment) {
                 clearTimeout(emailErrorTimeoutComment);
                 emailErrorComment.classList.remove('visible');
                 emailInputComment.removeAttribute('aria-invalid');
            }
        }
        emailInputComment.addEventListener('input', () => {
            const emailValue = emailInputComment.value.trim();
            if (emailValue === '' || isValidEmailFormat(emailValue)) { // Assumes isValidEmailFormat from common.js
                hideCommentEmailError();
            } else {
                showCommentEmailError('Please enter a valid email address.');
            }
        });

        // --- Comment Form Submission Handler ---
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearTimeout(emailErrorTimeoutComment);
            hideStatusMessage(formStatusComment); // Assumes hideStatusMessage from common.js

            // --- Client-side Validation ---
            const email = emailInputComment.value.trim();
            if (!email || !isValidEmailFormat(email)) {
                showCommentEmailError('Valid email required.');
                emailInputComment.focus();
                return;
            }
            hideCommentEmailError();

            const comment = commentTextarea.value.trim();
            let recaptchaResponse = null;
            let recaptchaWidgetId = recaptchaContainerComment.dataset.widgetId;

            try {
                recaptchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
                 if (!recaptchaResponse) {
                    showStatusMessage(formStatusComment, 'Please complete reCAPTCHA.', 'error', true); // Assumes showStatusMessage from common.js
                    return;
                }
            } catch (e) {
                console.error("reCAPTCHA error:", e);
                showStatusMessage(formStatusComment, 'reCAPTCHA error. Refresh page.', 'error', true);
                return;
            }

            if (!comment) {
                showStatusMessage(formStatusComment, 'Comment cannot be empty.', 'error', true);
                commentTextarea.focus();
                return;
            }
            if (comment.length > maxChars) {
                showStatusMessage(formStatusComment, `Comment exceeds ${maxChars} characters.`, 'error', true);
                commentTextarea.focus();
                return;
            }
            // --- End Client-side Validation ---

            submitButtonComment.disabled = true;
            submitButtonComment.textContent = 'Submitting...';

            try {
                const response = await fetch('/api/submit-comment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        comment: comment,
                        'g-recaptcha-response': recaptchaResponse,
                    }),
                });

                let result = { success: false, message: 'An unknown error occurred.' }; // Default error
                const contentType = response.headers.get("content-type");
                 if (contentType && contentType.indexOf("application/json") !== -1) {
                     try {
                         result = await response.json();
                     } catch (jsonError) {
                         console.error("Failed to parse JSON response:", jsonError);
                         result.message = `Server returned invalid response (${response.status}).`;
                     }
                 } else {
                    const errorText = await response.text();
                    console.error("Non-JSON response received:", response.status, errorText);
                    result.message = `Server error (${response.status}). Please try again.`;
                }

                if (response.ok && result.success) {
                    showStatusMessage(formStatusComment, 'Thank you for your comment!', 'success');
                    commentForm.reset();
                    charCount.textContent = `0 / ${maxChars}`;
                    charCount.classList.remove('error');
                    hideCommentEmailError();
                    grecaptcha.reset(recaptchaWidgetId);
                } else {
                    showStatusMessage(formStatusComment, result.message, 'error', true);
                    grecaptcha.reset(recaptchaWidgetId);
                }

            } catch (error) {
                console.error('Network or fetch error submitting comment:', error);
                showStatusMessage(formStatusComment, 'Network error. Check connection.', 'error', true);
            } finally {
                submitButtonComment.disabled = false;
                submitButtonComment.textContent = 'Submit Comment';
            }
        });

        // Optional: Explicitly render reCAPTCHA
         if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
             try {
                 const siteKey = recaptchaContainerComment.dataset.sitekey || document.querySelector('meta[name="recaptcha-site-key"]')?.content;
                 if (siteKey) {
                     const widgetId = grecaptcha.render(recaptchaContainerComment, { 'sitekey' : siteKey });
                     recaptchaContainerComment.dataset.widgetId = widgetId;
                 } else {
                      console.error("reCAPTCHA site key not found for comment form.");
                 }
             } catch (e) {
                 console.error("Error rendering reCAPTCHA for comment form:", e);
             }
        }

    } else {
        console.warn("Comment form elements not fully found. Comment functionality disabled.");
    }
    // --- End Comment Form Logic ---


    // --- Final Console Message ---
    console.log("Software Stable: Index page initialized. All systems nominal.");
    // --- End Console Message ---

}); // End DOMContentLoaded