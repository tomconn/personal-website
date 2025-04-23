// File: script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Authentication Link Management ---
    const authLinksContainer = document.getElementById('auth-links');

    function updateAuthLinks() {
        // Basic check for the presence of the session cookie
        // A more robust check would involve calling a '/api/check-session' endpoint
        const isLoggedIn = document.cookie.split(';').some((item) => item.trim().startsWith('session_token='));

        if (authLinksContainer) {
            if (isLoggedIn) {
                authLinksContainer.innerHTML = `
                    <button id="logout-button">Logout</button>
                `;
                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', handleLogout);
                }
            } else {
                authLinksContainer.innerHTML = `
                    <a href="/login.html">Login</a>
                    <span class="separator">|</span>
                    <a href="/register.html">Register</a>
                `;
            }
        }
    }

    async function handleLogout(event) {
        event.preventDefault();
        const logoutButton = event.target;
        logoutButton.disabled = true;
        logoutButton.textContent = 'Logging out...';

        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            if (response.ok) {
                // Update UI immediately after successful logout
                updateAuthLinks();
                 // Optionally redirect or show a message
                 // window.location.href = '/'; // Redirect home
                 console.log('Logout successful.');
            } else {
                console.error('Logout failed:', response.status);
                 alert('Logout failed. Please try again.'); // Simple feedback
                 logoutButton.disabled = false; // Re-enable button on failure
                 logoutButton.textContent = 'Logout';
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred during logout.');
             logoutButton.disabled = false;
             logoutButton.textContent = 'Logout';
        }
    }

    // Initial check when page loads
    updateAuthLinks();

    // --- End Authentication Link Management ---


    // Set current year in footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Simple fade-in animation for elements on scroll (existing logic)
    const fadeElems = document.querySelectorAll('.fade-in');
    // ... (rest of the IntersectionObserver logic remains the same) ...
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    fadeElems.forEach(elem => observer.observe(elem));


    // --- Comment Form Logic (Adapted) ---
    const commentForm = document.getElementById('comment-form');
    const commentTextarea = document.getElementById('comment-text');
    const charCount = document.getElementById('char-count');
    const formStatusComment = document.getElementById('form-status-comment'); // Unique ID
    const submitButtonComment = document.getElementById('submit-comment'); // Unique ID
    const recaptchaContainerComment = document.getElementById('recaptcha-container-comment'); // Unique ID
    const emailInputComment = document.getElementById('comment-email'); // Unique ID
    const emailErrorComment = document.getElementById('email-error'); // Unique ID (assuming it's specific to comment)

    const maxChars = 256;
    let statusTimeoutComment; // Unique timeout var
    let emailErrorTimeoutComment; // Unique timeout var

    // Use the global show/hideStatusMessage functions from common.js if needed
    // Or keep local ones if they have very specific behavior for this form

    if (commentForm && emailInputComment && emailErrorComment && commentTextarea && charCount && formStatusComment && submitButtonComment && recaptchaContainerComment) {

        // --- Character Counter Update ---
        commentTextarea.addEventListener('input', () => {
            const currentLength = commentTextarea.value.length;
            charCount.textContent = `${currentLength} / ${maxChars}`;
            charCount.classList.toggle('error', currentLength > maxChars);
        });
        charCount.textContent = `${commentTextarea.value.length} / ${maxChars}`;

        // --- Email Validation Feedback (using common.js function) ---
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
             // Use common validation function
            if (emailValue === '' || isValidEmailFormat(emailValue)) {
                hideCommentEmailError();
            } else {
                showCommentEmailError('Please enter a valid email address.');
            }
        });

        // --- Form Submission Handler ---
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearTimeout(statusTimeoutComment);
            clearTimeout(emailErrorTimeoutComment);

            // --- Client-side Validation ---
            const email = emailInputComment.value.trim();
            if (!email) {
                showCommentEmailError('Email address is required.');
                emailInputComment.focus();
                return;
            }
            if (!isValidEmailFormat(email)) { // Use common function
                showCommentEmailError('Please enter a valid email address.');
                emailInputComment.focus();
                return;
            }
            hideCommentEmailError();

            const comment = commentTextarea.value.trim();
            let recaptchaResponse = null;

            try {
                // Ensure you use the correct widget ID if multiple reCAPTCHAs exist
                // If only one is rendered at a time, this might be okay, otherwise, pass the widget ID
                recaptchaResponse = grecaptcha.getResponse(); // May need adjustment if multiple captchas render
            } catch (e) {
                console.error("reCAPTCHA error:", e);
                 // Use the showStatusMessage from common.js
                 showStatusMessage(formStatusComment, 'reCAPTCHA error. Please refresh.', 'error', true);
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
             if (!recaptchaResponse) {
                 showStatusMessage(formStatusComment, 'Please complete the reCAPTCHA.', 'error', true);
                return;
            }
            // --- End Validation ---

            submitButtonComment.disabled = true;
            submitButtonComment.textContent = 'Submitting...';
            hideStatusMessage(formStatusComment); // Hide previous messages

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

                const result = await response.json();

                if (response.ok && result.success) {
                    showStatusMessage(formStatusComment, 'Thank you for your comment!', 'success');
                    commentForm.reset();
                    charCount.textContent = `0 / ${maxChars}`;
                    charCount.classList.remove('error');
                    hideCommentEmailError();
                    grecaptcha.reset(); // Reset the specific widget if possible
                } else {
                    const errorMessage = result.message || 'An error occurred.';
                    showStatusMessage(formStatusComment, errorMessage, 'error', true);
                    grecaptcha.reset();
                }

            } catch (error) {
                console.error('Error submitting comment:', error);
                 showStatusMessage(formStatusComment, 'Network error. Please try again.', 'error', true);
            } finally {
                submitButtonComment.disabled = false;
                submitButtonComment.textContent = 'Submit Comment';
            }
        });

    } else {
        console.warn("Comment form elements not fully found. Comment section disabled.");
    }

    console.log("Software Stable: Systems online. Ready for interaction.");
});