// File: script.js
// Handles interactivity for the main index.html page.

document.addEventListener('DOMContentLoaded', () => {

    // --- Get References to Elements ---
    const authLinksContainer = document.getElementById('auth-links');
    const commentsSection = document.getElementById('comments'); // *** Get reference to comments section ***
    const yearSpan = document.getElementById('year');

    // --- Authentication Link Management & Comment Section Visibility ---

    /**
     * Asynchronously checks the user's login status via the backend
     * and updates the navigation links AND comment section visibility accordingly.
     */
    async function initializeAuthUI() {
        if (!authLinksContainer) {
            console.warn('Auth links container (#auth-links) not found. Cannot initialize auth UI.');
        }

        let isLoggedIn = false;
        try {
            const response = await fetch('/api/check-session'); // Call the backend check
            if (response.ok) {
                const data = await response.json();
                isLoggedIn = data.loggedIn;
            } else {
                console.error('Failed to check session status:', response.status);
                 // Assume logged out if check fails
            }
        } catch (error) {
            console.error('Error fetching session status:', error);
             // Assume logged out on network failure etc.
        }

        // --- Update Auth Links ---
        if (authLinksContainer) { // Update if container exists
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

        // --- Update Comment Section Visibility ---
        // *** Toggle 'hidden' class based on login status ***
        if (commentsSection) {
            commentsSection.classList.toggle('hidden', isLoggedIn);
            // If isLoggedIn is true, add 'hidden'; if false, remove 'hidden'
            console.log(`Comments section visibility set: ${isLoggedIn ? 'Hidden' : 'Visible'}`);
        } else {
            console.warn('Comments section (#comments) not found. Cannot control visibility.');
        }
        // *** END Comment Section Update ***
    }

    /**
     * Handles the logout process when the logout button is clicked.
     * Also ensures the comment section becomes visible upon logout.
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
                // Update Auth UI immediately after successful API call
                if (authLinksContainer) {
                    authLinksContainer.innerHTML = `
                        <a href="/login.html">Login</a>
                        <span class="separator">|</span>
                        <a href="/register.html">Register</a>
                    `;
                }
                // *** Ensure comments section is shown on logout ***
                if (commentsSection) {
                    commentsSection.classList.remove('hidden');
                     console.log('Comments section visibility set: Visible (after logout)');
                }

            } else {
                console.error('Logout request failed:', response.status, await response.text());
                alert('Logout failed. Please try again.');
                // Re-enable button only if it still exists
                 if (document.getElementById('logout-button')) {
                    logoutButton.disabled = false;
                    logoutButton.textContent = 'Logout';
                }
            }
        } catch (error) {
            console.error('Error during logout fetch:', error);
            alert('An error occurred during logout. Please check your connection.');
             // Re-enable button only if it still exists
             if (document.getElementById('logout-button')) {
                 logoutButton.disabled = false;
                 logoutButton.textContent = 'Logout';
             }
        }
    }

    // Initialize the auth UI and comment visibility when the page loads
    initializeAuthUI();

    // --- End Authentication Link Management ---


    // --- Footer Year ---
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
    // NOTE: This logic will only effectively run if the #comments section is visible.
    // Getting elements might work even if hidden, but event listeners might not fire as expected or be relevant.
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

    // Check if all required comment elements exist before adding listeners
    // This check might pass even if the section is hidden initially.
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
            // Assumes isValidEmailFormat from common.js exists
            if (typeof isValidEmailFormat === 'function') {
                 if (emailValue === '' || isValidEmailFormat(emailValue)) {
                    hideCommentEmailError();
                } else {
                    showCommentEmailError('Please enter a valid email address.');
                }
            }
        });

        // --- Comment Form Submission Handler ---
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearTimeout(emailErrorTimeoutComment);
            // Assumes hideStatusMessage from common.js exists
            if (typeof hideStatusMessage === 'function') {
                hideStatusMessage(formStatusComment);
            }


            // --- Client-side Validation ---
            const email = emailInputComment.value.trim();
            let isEmailValid = false;
            if (typeof isValidEmailFormat === 'function') {
                isEmailValid = isValidEmailFormat(email);
            }
            if (!email || !isEmailValid) {
                showCommentEmailError('Valid email required.');
                emailInputComment.focus();
                return;
            }
            hideCommentEmailError();

            const comment = commentTextarea.value.trim();
            let recaptchaResponse = null;
            let recaptchaWidgetId = recaptchaContainerComment.dataset.widgetId;

            try {
                 if (typeof grecaptcha === 'undefined') {
                     throw new Error("reCAPTCHA script not loaded.");
                 }
                recaptchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
                 if (!recaptchaResponse) {
                     if (typeof showStatusMessage === 'function') {
                        showStatusMessage(formStatusComment, 'Please complete reCAPTCHA.', 'error', true);
                     }
                    return;
                }
            } catch (e) {
                console.error("reCAPTCHA error:", e);
                 if (typeof showStatusMessage === 'function') {
                     showStatusMessage(formStatusComment, 'reCAPTCHA error. Refresh page.', 'error', true);
                 }
                return;
            }

            if (!comment) {
                 if (typeof showStatusMessage === 'function') {
                     showStatusMessage(formStatusComment, 'Comment cannot be empty.', 'error', true);
                 }
                commentTextarea.focus();
                return;
            }
            if (comment.length > maxChars) {
                 if (typeof showStatusMessage === 'function') {
                     showStatusMessage(formStatusComment, `Comment exceeds ${maxChars} characters.`, 'error', true);
                 }
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

                if (response.ok && result.success && typeof showStatusMessage === 'function') {
                    showStatusMessage(formStatusComment, 'Thank you for your comment!', 'success');
                    commentForm.reset();
                    charCount.textContent = `0 / ${maxChars}`;
                    charCount.classList.remove('error');
                    hideCommentEmailError();
                    if (typeof grecaptcha !== 'undefined') {
                         grecaptcha.reset(recaptchaWidgetId);
                    }
                } else if (typeof showStatusMessage === 'function') {
                    showStatusMessage(formStatusComment, result.message, 'error', true);
                     if (typeof grecaptcha !== 'undefined') {
                        grecaptcha.reset(recaptchaWidgetId);
                     }
                }

            } catch (error) {
                console.error('Network or fetch error submitting comment:', error);
                if (typeof showStatusMessage === 'function') {
                    showStatusMessage(formStatusComment, 'Network error. Check connection.', 'error', true);
                }
            } finally {
                submitButtonComment.disabled = false;
                submitButtonComment.textContent = 'Submit Comment';
            }
        });

        // Optional: Explicitly render reCAPTCHA for comment form
        if (recaptchaContainerComment) {
            // We don't need a typeof check here because grecaptcha.ready 
            // is designed to handle the wait for the script.
            const runRender = () => {
                try {
                    const siteKeyMeta = document.querySelector('meta[name="recaptcha-site-key"]');
                    const siteKey = recaptchaContainerComment.dataset.sitekey || siteKeyMeta?.content;

                    if (siteKey) {
                        // Ensure we only render once
                        if (recaptchaContainerComment.innerHTML.trim() === "") {
                            const widgetId = grecaptcha.render('recaptcha-container-comment', {
                                'sitekey': siteKey
                            });
                            recaptchaContainerComment.dataset.widgetId = widgetId;
                        }
                    } else {
                        console.error("reCAPTCHA site key not found.");
                    }
                } catch (e) {
                    console.error("Error rendering reCAPTCHA:", e);
                }
            };

            // If the script is loaded, use ready(). If not, the script's 
            // onload parameter (see below) will handle it.
            if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
                grecaptcha.ready(runRender);
            }

    } else {
        // This warning is expected if the section is hidden initially for logged-in users.
        // console.warn("Comment form elements not fully found. Comment functionality potentially disabled or deferred.");
    }
    // --- End Comment Form Logic ---


    // --- Final Console Message ---
    console.log("Software Stable: Index page initialized. All systems nominal.");
    // --- End Console Message ---

}); // End DOMContentLoaded