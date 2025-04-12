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
    const maxChars = 256;
    let statusTimeout; // To manage the success message timeout

    // Check if all required comment elements exist before adding listeners
    if (commentForm && commentTextarea && charCount && formStatus && submitButton && recaptchaContainer) {

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


        // Form Submission Handler
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default browser submission
            clearTimeout(statusTimeout); // Clear any existing status message timeout

            // --- Client-side Validation ---
            const comment = commentTextarea.value.trim();
            let recaptchaResponse = null;

            // Ensure grecaptcha is loaded and get response
            try {
                recaptchaResponse = grecaptcha.getResponse();
            } catch (e) {
                console.error("reCAPTCHA not ready or error getting response:", e);
                showStatus('reCAPTCHA is not ready. Please wait or refresh.', 'error');
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
            hideStatus(); // Clear previous status message immediately

            try {
                const response = await fetch('/api/submit-comment', { // Your Function endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
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
                    commentForm.reset(); // Clear the form fields
                    charCount.textContent = `0 / ${maxChars}`; // Reset char count display
                    charCount.classList.remove('error');
                    grecaptcha.reset(); // Reset reCAPTCHA widget

                    // Set timeout to hide success message after 20 seconds
                    statusTimeout = setTimeout(() => {
                        hideStatus();
                    }, 20000); // 20 seconds

                } else {
                    // Handle errors from the function (including reCAPTCHA failure)
                    const errorMessage = result.message || 'An unknown error occurred. Please try again.';
                    showStatus(errorMessage, 'error');
                    grecaptcha.reset(); // Reset reCAPTCHA on error so user can retry
                }

            } catch (error) {
                console.error('Network or fetch error submitting comment:', error);
                showStatus('A network error occurred. Please check your connection and try again.', 'error');
                // Don't reset reCAPTCHA here as it might be a network issue, not verification fail
            } finally {
                // Re-enable button AFTER processing, regardless of outcome
                resetSubmitButton();
            }
        });

    } else {
        console.warn("Comment form elements not found. Comment functionality disabled.");
    }


    // Helper function to show status messages
    function showStatus(message, type = 'info') { // type can be 'success' or 'error'
        if (formStatus) {
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
            } else {
                formStatus.removeAttribute('aria-invalid');
            }
        }
    }

     // Helper function to hide the status message
    function hideStatus() {
        if (formStatus) {
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