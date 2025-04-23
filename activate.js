// File: activate.js

document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('activation-status');
    const resultParagraph = document.getElementById('activation-result');
    const linksDiv = document.getElementById('activation-links');
    const spinner = statusDiv.querySelector('.spinner');

    // 1. Get the token from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        statusDiv.innerHTML = '<p>Activation Error</p>'; // Remove spinner
        resultParagraph.textContent = 'No activation token found in the URL. Please use the link from your email.';
        statusDiv.classList.add('error');
        return;
    }

    // 2. Send the token to the backend API endpoint
    try {
        const response = await fetch('/api/activate-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token }),
        });

        const result = await response.json();

        // Remove spinner regardless of outcome
        if (spinner) spinner.style.display = 'none';
         statusDiv.querySelector('p').style.display = 'none'; // Hide "Activating..." text

        if (response.ok && result.success) {
             statusDiv.innerHTML = '<p>Account Activated!</p>';
             statusDiv.classList.remove('error'); // Ensure no error class
             statusDiv.classList.add('success');
             resultParagraph.textContent = 'Your account has been successfully activated.';
             linksDiv.style.display = 'block'; // Show login link
        } else {
             statusDiv.innerHTML = '<p>Activation Failed</p>';
             statusDiv.classList.remove('success'); // Ensure no success class
             statusDiv.classList.add('error');
             resultParagraph.textContent = result.message || 'Could not activate account. The link may be invalid or expired.';
        }

    } catch (error) {
        console.error('Activation fetch error:', error);
         if (spinner) spinner.style.display = 'none';
         statusDiv.querySelector('p').style.display = 'none';
         statusDiv.innerHTML = '<p>Activation Error</p>';
         statusDiv.classList.add('error');
         resultParagraph.textContent = 'A network error occurred while trying to activate your account. Please try again later.';
    }
});