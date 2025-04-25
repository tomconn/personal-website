# Personal Website - Thomas Connolly

This repository contains the source code for the personal website of Thomas Connolly (www.thomasconnolly.com), hosted on Cloudflare Pages.

## Original Prompt & Generation

*This project structure, code, and documentation were generated based on the following prompt using Google Gemini 2.5 Pro:*

> Using Cloudflare Pages. Implement the following sequence.
> Create a simple reactive webpage, that works on both mobile and desktop browsers and supports the latest chrome, firefox and safari browsers.
> The website will present a personal home page of my name, skills as an IT architect in Platform engineering, links to github and linkedin pages.
> The page includes my name Thomas Connolly, my email address, contact@thomasconnolly.com, a brief bio copied from my linkedin page, see https://www.linkedin.com/in/thomas-connolly-7350742/?originalSubdomain=au and to my github page, https://github.com/tomconn.
> Add my it certifications from linkedin include kubernetes, CKA, CKAD, CKS, kubestronaut, AWS Architect Professional and TOGAF 9 Certified.
> It will also provide links to my linkedin and github pages.
> Split the website into html, css and javascript files.
> Use a 1970's Nasa theme for the website, with emphasis on an optimistic future of innovation and automation where people are content and tolerant.
> I have a domain name www.thomasconnolly.com, I want to use the free Cloudflare pages to only host my personal website.
> My fqdn is managed in www.namecheap.com, provide details on how I can setup Cloudflare pages for the website.
> I use email forwarding in www.namecheap.com, and I want to continue to use www.namecheap.com to forward emails (I do not want to use cloudflare pages email forwarding at this time).
> Instructions to host on the free tier cloudflare pages should follow the above instructions.
> Describe how to setup and use my personal www.github.com/tomconn private repo.
> Document the process of setting up ,all the above, with the directory structure, in a README.md, in markdown.
> Include this prompt in the README.md and indicate the use of Gemini 2.5 pro for the creation and generation of this website using cloudflare pages.

**(Self-Correction during generation):** The LinkedIn bio needs to be manually copied and pasted into `index.html` as automatic scraping is not feasible or appropriate. DNS instructions were adjusted to use CNAME records within Namecheap instead of changing nameservers, ensuring Namecheap email forwarding remains active.

## Additional functionality to add login/registration and logout - Prompt & Generation

> Create a Cloudflare login and registration function, with the following functions. 

> **For the registration function;**
> Create a registration form page with a username, use an email address, and password fields. By default the password text should not be visible but add the option to display or hide. Use a D1 to store the username and password. The page should reuse the recaptcha logic already used for the email and comment box, in submit-comment.js.
> Validate the username, password and recaptcha. The password should be a minimum of 8 characters, a maximum of 256 characters, with a least 1 uppercase, 1 lowercase and 1 special character. Display a warning if the username, password and recaptcha are not valid.
> The password should be hashed with SHA256 and use a salt.
> The username and password uses the D1 database to store the username, an email address, and password.
> Send a confirmation email, to the username, with a link to activate the login. Reuse the function sendEmailWithBrevo in the submit-comment.js, and move it into a comment js file.
> On successful registration, return to the index page.

> **For the login function;**
> Create a login form page with a username and password fields. By default the password text should not be visible but add the option to view the text with an eye icon in the password box. The page should reuse the recaptcha logic already used for the email and comment box.
> Display a warning if the  username, password and recaptcha are not valid.
> Match the login username and password against the D1 database.
> The password should be compared against the D1 database hashed and a salt value.
> On successful login, store the session token in a cookie, the cookie has a ttl of 3 hours. The token is used in the index.html page. Return to the index page.
> Unsuccessful login will represent the login page with the error message, 'Username and/or password is not found!'
> Ensure the registration and login functions are in separate js file.

> **For the index.html page**, show a login/registration links, at the top of the existing page. On pressing the login link navigate to the login page. On pressing registration navigate to the registration page. On successfully login, replace the login/registration link with a logout link. Use the login cookie to check user is logged into the application.  
> Existing Code is as follows. Add the login and registration and update the existing code to support it. Regenerate all the code in full. > Ensure all additional styles are added to the existing style.css.
> For the index.html page, on successfully login, replace the login/registration link with a logout link. Use the login cookie to check user is logged into the application.  Show the differences to the existing code.
> Add Validate the token against a session store in D1
> Modify the index.html to only display the 'Leave a comment' if the user is NOT logged onto the website.
> Describe how to set up a Cloudflare Worker Cron Trigger

## Project Overview

A simple, responsive, single-page personal website featuring:
*   Name and Title
*   Brief Biography
*   Core Skills (Platform Engineering focus)
*   IT Certifications
*   Contact Information (Email)
*   Links to LinkedIn and GitHub profiles
*   A 1970s NASA-inspired visual theme.
*   Basic scroll-based fade-in animations for sections.

## Directory Structure

```text
/
├── functions/                  # Backend Cloudflare Functions
│   ├── api/                    # API endpoint handlers
│   │   ├── submit-comment.js   # Handles comment submissions
│   │   ├── register.js         # Handles user registration POST requests
│   │   ├── login.js            # Handles user login POST requests
│   │   ├── activate-account.js # Handles account activation POST requests
│   │   ├── check-session.js    # Handles session validation GET requests
│   │   └── logout.js           # Handles user logout POST requests
│   └── utils/                  # Shared backend utility functions
│       ├── auth.js             # Password hashing, token generation, cookie helpers
│       └── email.js            # Email sending utility (Brevo)
│       └── validation.js       # Shared validation (email, password, reCAPTCHA)
│
├── index.html                  # Main landing page (homepage)
├── login.html                  # Login form page
├── register.html               # Registration form page
├── activate.html               # Account activation status/landing page
├── style.css                   # Shared CSS styles for all pages
├── script.js                   # JavaScript specific to index.html
├── login.js                    # JavaScript specific to login.html
├── register.js                 # JavaScript specific to register.html
├── activate.js                 # JavaScript specific to activate.html
├── common.js                   # Shared frontend JavaScript utilities
└── README.md                   # Project setup, documentation, etc.
```

*(Note: The `functions` directory structure is conventional for Cloudflare Pages Functions deployment.)*

## Technology Stack

*   **Frontend:**
    *   HTML5
    *   CSS3 (Variables, Flexbox, Animations)
    *   Vanilla JavaScript (ES6+)
    *   Google Fonts (`Orbitron`, `Montserrat`)
    *   Google reCAPTCHA v2
*   **Backend:**
    *   Cloudflare Workers (Serverless JavaScript function for form processing)
*   **Hosting & Deployment:**
    *   Cloudflare Pages (Free Tier)
    *   GitHub (Private Repository for source control & CI/CD trigger)
*   **DNS & Email:**
    *   Namecheap (DNS Management via CNAME, Email Forwarding)

## Setup Instructions

Follow these steps to set up the repository, deploy the website and the backend function to Cloudflare Pages using your custom domain `www.thomasconnolly.com`, while keeping email forwarding active on Namecheap.

### 1. GitHub Repository Setup (Private)

1.  **Create a New Repository on GitHub:**
    *   Go to your GitHub account (`github.com/tomconn`).
    *   Click "+" -> "New repository".
    *   **Repository name:** e.g., `personal-website` or `softwarestable-com`.
    *   **Description:** Optional.
    *   **Select "Private"**.
    *   Initialize with a README (you'll replace it).
    *   Click "Create repository".

2.  **Clone the Repository:**
    *   Click "Code", copy the URL (HTTPS or SSH).
    *   In your terminal: `git clone <repository_url>`
    *   `cd <repository_name>`

3.  **Add Project Files:**
    *   Copy `index.html`, `style.css`, `script.js`, the `functions` directory (and its contents), and this `README.md` file into the cloned repository directory.
    *   **Important:** Open `index.html` and manually paste your bio into the `#about` section.
    *   **Important:** Open `index.html` and replace the placeholder `data-sitekey` in the reCAPTCHA div (`<div class="g-recaptcha" ...>`) with your actual **Google reCAPTCHA v2 Site Key**.

4.  **Commit and Push Files:**
    *   `git add .`
    *   `git commit -m "Initial commit of website files including comment function"`
    *   `git push origin main` (or your default branch)

### 2. Cloudflare Pages Setup (Including Worker Function)

1.  **Sign up/Log in to Cloudflare:** Go to [dash.cloudflare.com](https://dash.cloudflare.com/).
2.  **Navigate to Pages:** Go to `Workers & Pages` -> `Overview`. Click `Create application` -> `Pages` tab.
3.  **Connect to Git:**
    *   Choose `GitHub`. Authorize Cloudflare.
    *   Select "Only select repositories" and pick your private repository. Click "Install & Authorize".
4.  **Select Repository:** Select the authorized repository and click "Begin setup".
5.  **Set up builds and deployments:**
    *   **Project name:** Choose (e.g., `softwarestable`).
    *   **Production branch:** Select `main` (or `master`).
    *   **Framework preset:** Select `None`.
    *   **Build command:** Leave **blank**.
    *   **Build output directory:** Leave as `/` (or blank). Cloudflare Pages will detect the `functions` directory automatically.
    *   **Environment variables (Build & Preview):**
        *   Click `Add variable`.
        *   **Variable name:** `RECAPTCHA_SECRET_KEY`
        *   **Value:** Paste your **Google reCAPTCHA v2 Secret Key**.
        *   Click `Encrypt` if desired (recommended).
        *   Click `Save`.
6.  **Save and Deploy:** Click "Save and Deploy". Cloudflare will deploy both the static site and the function in the `functions` directory. The function will be available at `/api/submit-comment` relative to your site URL.
7. **DB schema**
* The required D1 schema (CREATE TABLE users ...).

### Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_active INTEGER DEFAULT 0 NOT NULL, -- 0 = false, 1 = true
    activation_token TEXT,
    activation_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
-- Index for faster activation token lookups
CREATE INDEX idx_users_activation_token ON users(activation_token);
```

### Sessions Table

A `sessions` table is used to validate user sessions securely on the backend.

```sql
-- Create the sessions table
CREATE TABLE sessions (
    token TEXT PRIMARY KEY NOT NULL,      -- The unique session token
    user_id INTEGER NOT NULL,             -- User ID linked to the session
    expires_at DATETIME NOT NULL,         -- Session expiry timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Session creation timestamp
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- Link to users table
);

-- Index for faster lookup/cleanup of expired sessions
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```
   * **Create D1 Database:** Go to your Cloudflare dashboard -> Workers & Pages -> D1 -> Create database. Note the database ID.
   * **Create Table:** Use the D1 Console tab to run the CREATE TABLE users ... SQL.
   * **Set Environment Variables:** In your Cloudflare Pages project settings -> Environment Variables, add all the required variables listed above for both Production and Preview environments. Make sure DB is bound to your created D1 database. Set ACTIVATION_BASE_URL appropriately (e.g., https://preview-branch.your-project.pages.dev for preview, https://www.softwarestable.com for production).
   * **Replace Placeholders:** Ensure the recaptcha-site-key meta tag value in index.html, login.html, and register.html is your actual site key. Ensure NOTIFICATION_EMAIL_FROM is an email address verified within your Brevo account.
   * **Commit and Push:** Add all the new/modified files to your Git repository and push them to the branch connected to Cloudflare Pages.
   * **Test:**
       *   Use a Cloudflare Pages preview deployment first.
       *   Test registration with a valid email.
       *   Check your email for the activation link (ensure it points to the correct preview URL).
       *   Click the activation link. Verify the success message.
       *   Try logging in with the correct credentials. Verify redirect to index.
       *   Verify the "Logout" link appears on index.html.
       *   Click Logout. Verify the "Login/Register" links reappear.
       *   Test invalid login attempts.
       *   Test registration with an existing email.
       *   Test password complexity rules on the registration form.
       *   Test reCAPTCHA requirement on all forms.
       *   Test expired activation link (wait an hour or manually change expiry in D1).

### Session Cleanup Worker

To prevent the `sessions` table from growing indefinitely with expired sessions, set up a Cloudflare Worker Cron Trigger to periodically delete old sessions. This Worker runs separately from your main Cloudflare Pages functions.

**Setup Steps:**

1.  **Create the Worker:**
    *   Go to your Cloudflare Dashboard -> **Workers & Pages**.
    *   Click **"Create Application"**.
    *   Select the **"Worker"** tab.
    *   Under "Templates", select a basic template like **"Hello World"** and click **"Use template"**.
    *   Give your Worker a descriptive name, for example: `session-cleanup-worker`.
    *   Click **"Deploy"**. This deploys the initial template code.

2.  **Add the Cleanup Code:**
    *   After the initial deploy, you'll be on the Worker's overview page. Click the **"Edit code"** button.
    *   In the online editor, **delete all** the existing "Hello World" template code.
    *   **Copy and paste** the following complete script into the editor:

    ```javascript
    /**
     * Cloudflare Worker script for cleaning up expired sessions from D1.
     */
    export default {
      /**
       * Handles the scheduled event triggered by a Cron Trigger.
       * @param {ScheduledEvent} event - Contains information about the trigger (e.g., cron schedule).
       * @param {object} env - Contains environment variables and bindings (like D1).
       * @param {ExecutionContext} ctx - Provides methods like ctx.waitUntil().
       */
      async scheduled(event, env, ctx) {
        console.log(`[Session Cleanup] Cron Trigger Fired: ${event.cron}`);
        // Use ctx.waitUntil to ensure the script runs to completion,
        // even after the response to the trigger event has been sent.
        ctx.waitUntil(cleanupExpiredSessions(env));
      },
    };

    /**
     * Connects to the D1 database bound as SESSION_DB and deletes expired sessions.
     * @param {object} env - Environment variables and bindings.
     */
    async function cleanupExpiredSessions(env) {
      // Ensure the D1 binding name matches your configuration ('SESSION_DB' is used here)
      if (!env.SESSION_DB) {
        console.error("[Session Cleanup] D1 Database binding 'SESSION_DB' is missing in Worker environment.");
        return; // Stop execution if DB binding isn't configured
      }

      const nowISO = new Date().toISOString();
      console.log(`[Session Cleanup] Running session cleanup at ${nowISO}...`);

      try {
        // Prepare the SQL statement to delete sessions where expiry is in the past
        const stmt = env.SESSION_DB.prepare(
          "DELETE FROM sessions WHERE expires_at <= ?1" // Using numbered param
        );

        // Bind the current time and execute the delete operation
        const { success, meta } = await stmt.bind(nowISO).run();

        if (success) {
          console.log(`[Session Cleanup] Cleanup successful. Deleted ${meta.changes ?? 0} expired sessions.`);
        } else {
          // D1 might report !success in some edge cases, log if needed
          console.error("[Session Cleanup] D1 query execution reported failure.", meta);
        }
      } catch (e) {
        // Catch any errors during DB interaction
        console.error("[Session Cleanup] Error during session cleanup:", e);
        // You might want to add more robust error reporting here (e.g., send to logging service)
      }
    }
    ```

    *   Click the **"Save and deploy"** button in the editor.

3.  **Bind D1 Database:**
    *   Navigate back to your `session-cleanup-worker` overview page.
    *   Go to the **Settings** tab.
    *   Click on **Variables**.
    *   Scroll down to **D1 Database Bindings** and click **"Add binding"**.
    *   **Variable name:** Enter `SESSION_DB` (This *must* match the `env.SESSION_DB` used in the code above).
    *   **D1 database:** Select the D1 database that contains your `sessions` table from the dropdown list.
    *   Click **"Save"**.

4.  **Configure Cron Trigger:**
    *   Go back to the `session-cleanup-worker` overview page.
    *   Go to the **Triggers** tab.
    *   Scroll down to the **Cron Triggers** section and click **"Add Cron Trigger"**.
    *   Enter your desired **Cron Schedule** in UTC. Examples:
        *   `0 0 * * *` : Run daily at midnight UTC.
        *   `0 */6 * * *`: Run every 6 hours (00:00, 06:00, 12:00, 18:00 UTC).
        *   `15 3 * * *` : Run daily at 3:15 AM UTC.
        *   *(Use [crontab.guru](https://crontab.guru/) to verify your schedule)*
    *   Click **"Add trigger"**.

5.  **Final Deploy:** Deploying after adding the code (Step 2) should have published the latest script. If you made changes to the Settings (like D1 binding or triggers) after that, you might need to trigger another deploy. Go to the Worker overview and click **"Deploy"** if available, or simply make a tiny change in the code editor (like adding a space) and click **"Save and deploy"** again to be sure.

**Monitoring:**

*   After the scheduled time for your Cron Trigger passes, check the logs for your `session-cleanup-worker`. Go to the Worker's dashboard -> **Logs** tab. You should see the `console.log` messages indicating it ran and how many sessions were deleted.
*   You can also periodically check the `sessions` table in your D1 database console to confirm that rows with past `expires_at` dates are being removed.

### 3. Custom Domain Setup (www.thomasconnolly.com via Namecheap)

**Goal:** Point `www.thomasconnolly.com` to your Cloudflare Pages site *without* changing Namecheap nameservers, preserving Namecheap's email forwarding.

1.  **Add Custom Domain in Cloudflare Pages:**
    *   Go to your Cloudflare Pages project dashboard.
    *   Click `Custom domains` -> `Set up a custom domain`.
    *   Enter `www.thomasconnolly.com`, click `Continue`.
    *   Cloudflare will provide instructions to add a `CNAME` record. **Copy the target value** (e.g., `<your-project-name>.pages.dev`).

2.  **Add CNAME Record in Namecheap:**
    *   Log in to Namecheap -> `Domain List` -> `Manage` next to `thomasconnolly.com`.
    *   Go to `Advanced DNS` tab. Keep "Nameservers" on "Namecheap BasicDNS".
    *   In "Host Records", click `Add New Record`.
        *   **Type:** `CNAME Record`
        *   **Host:** `www`
        *   **Value:** Paste the target value from Cloudflare.
        *   **TTL:** `Automatic` or `5 min`.
    *   Click the green checkmark to save.
    *   **Remove Conflicts:** Delete any existing `A` or `CNAME` records for the `www` host. *Leave MX records untouched.*

3.  **Verification in Cloudflare:**
    *   Go back to Cloudflare Pages "Custom domains". Wait for DNS propagation. The status will change to "Active". SSL will be provisioned.

4.  **(Optional) Handling the Root Domain (`thomasconnolly.com`):**
    *   In Namecheap's `Advanced DNS`: Add a `URL Redirect Record`.
        *   **Type:** `URL Redirect`
        *   **Host:** `@`
        *   **Value:** `https://www.thomasconnolly.com`
        *   **Type:** `Permanent (301)`
    *   Save this record. Remove conflicting `A`/`CNAME` records for `@`.

### 4. Confirm Email Forwarding

*   Since nameservers were not changed, your Namecheap email forwarding for `contact@thomasconnolly.com` remains active.

### 5. Continuous Deployment & Updates

*   Make changes locally (e.g., update `index.html`, `style.css`, `script.js`, or `functions/api/submit-comment.js`).
*   Commit and push to your `main` branch on GitHub:
    ```bash
    git add .
    git commit -m "Describe your changes"
    git push origin main
    ```
*   Cloudflare Pages will automatically detect the push and redeploy the updated site and function.

---
