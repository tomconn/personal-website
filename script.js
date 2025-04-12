
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


    // --- Comment Form Logic (Modified for v3) ---
    const commentForm = document.getElementById('comment-form');
    const commentTextarea = document.getElementById('comment-text');
    const charCount = document.getElementById('char-count');
    const formStatus = document.getElementById('form-status');
    const submitButton = document.getElementById('submit-comment');
    const maxChars = 256;
    let statusTimeout; // To manage the success message timeout

    // Get Site Key passed from HTML (Ensure the script block in HTML exists before this script)
    // Provide a fallback, but strongly recommend setting it in HTML.
    const recaptchaV3SiteKey = '6Lf5mxUrAAAAANJsh5-Q4DnqggkDWK-dci9QzPF1';

    // Check if all required comment elements exist before adding listeners
    if (commentForm && commentTextarea && charCount && formStatus && submitButton && recaptchaV3SiteKey) {

        // Character Counter Update
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


        // Form Submission Handler (Major changes for v3)
        commentForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default browser submission
            clearTimeout(statusTimeout); // Clear any existing status message timeout

            // --- Client-side Validation (Before reCAPTCHA execution) ---
            const comment = commentTextarea.value.trim();

            if (!comment) {
                showStatus('Comment cannot be empty.', 'error');
                commentTextarea.focus();
                return; // Stop submission
            }
            if (comment.length > maxChars) {
                showStatus(`Comment exceeds the maximum length of ${maxChars} characters.`, 'error');
                commentTextarea.focus();
                return; // Stop submission
            }
            // --- End Validation ---


            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            hideStatus(); // Clear previous status message immediately

            // Use grecaptcha.ready to ensure API is loaded, then execute
            grecaptcha.ready(async () => { // Use async function for await inside
                try {
                    // Execute reCAPTCHA V3 - get a token
                    const token = await grecaptcha.execute(recaptchaV3SiteKey, { action: 'submit_comment' });
                    console.log('reCAPTCHA v3 Token:', token); // For debugging purposes

                    // Proceed with form submission using the obtained token
                    await submitFormData(comment, token);

                } catch (error) {
                    // Handle errors during reCAPTCHA execution itself
                    console.error('reCAPTCHA execution failed:', error);
                    showStatus('Could not get verification token. Please try again.', 'error');
                    // Re-enable button if reCAPTCHA fails before fetch
                    resetSubmitButton();
                }
            }); // End grecaptcha.ready
        }); // End form submit listener


        // Separate async function to handle the actual fetch/submission logic
        // This is called after the reCAPTCHA token is successfully obtained
        async function submitFormData(comment, recaptchaToken) {
             try {
                const response = await fetch('/api/submit-comment', { // Your Cloudflare Function endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        comment: comment, // Send the trimmed comment
                        'g-recaptcha-response': recaptchaToken, // Send the token obtained from execute()
                    }),
                });

                // Try parsing JSON, but handle cases where response might not be JSON (e.g., 500 error page)
                let result;
                try {
                     result = await response.json();
                } catch(e) {
                    // If response is not JSON
                    console.error("Failed to parse JSON response:", e);
                    // Create a generic error object based on status
                    result = { success: false, message: `Server error (Status: ${response.status}). Please try again later.` };
                }


                if (response.ok && result.success) {
                    // Handle success
                    showStatus('Thank you for your comment!', 'success');
                    commentForm.reset(); // Clear the form fields
                    charCount.textContent = `0 / ${maxChars}`; // Reset char count display
                    charCount.classList.remove('error'); // Ensure error class is removed

                    // Set timeout to hide success message after 20 seconds
                    statusTimeout = setTimeout(hideStatus, 20000); // 20 seconds

                } else {
                    // Handle errors from the function (including reCAPTCHA low score or validation failure)
                    const errorMessage = result.message || 'An unknown error occurred. Please try again.';
                    showStatus(errorMessage, 'error');
                }

            } catch (error) {
                // Handle network errors during fetch
                console.error('Network or fetch error submitting comment:', error);
                showStatus('A network error occurred. Please check your connection and try again.', 'error');
            } finally {
                // Re-enable button AFTER fetch processing is complete (success or fail)
                resetSubmitButton();
            }
        } // End submitFormData function


    } else {
        // Log a warning if the form or necessary components aren't found
        if (!recaptchaV3SiteKey) {
             console.warn("reCAPTCHA V3 Site Key is missing. Comment form disabled.");
        } else {
             console.warn("One or more comment form elements not found. Comment functionality disabled.");
        }
    }


    // Helper function to show status messages
    function showStatus(message, type = 'info') { // type can be 'success' or 'error'
        if (formStatus) {
            formStatus.textContent = message;
            // Reset classes, then add the correct ones for styling and visibility
            formStatus.className = 'form-status'; // Base class
            if (type === 'success' || type === 'error') {
                formStatus.classList.add(type); // Add 'success' or 'error' class
            }
            formStatus.classList.add('visible'); // Make it visible using CSS transition
            // Set aria-invalid for errors for accessibility
            if (type === 'error') {
                formStatus.setAttribute('aria-invalid', 'true');
            } else {
                formStatus.removeAttribute('aria-invalid');
            }
        }
    }

     // Helper function to hide the status message
    function hideStatus() {
        if (formStatus) {
            formStatus.classList.remove('visible');
             // Optional: clear text after transition ends for cleaner DOM,
             // but ensure it doesn't clear a rapidly appearing new message.
            // setTimeout(() => {
            //     if (!formStatus.classList.contains('visible')) {
            //         formStatus.textContent = '';
            //         formStatus.className = 'form-status';
            //         formStatus.removeAttribute('aria-invalid');
            //     }
            // }, 500); // Should match CSS transition duration
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

}); // End DOMContentLoaded listener