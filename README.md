# Personal Website - Thomas Connolly

This repository contains the source code for the personal website of Thomas Connolly (www.thomasconnolly.com), hosted on Cloudflare Pages.

## DB schema

```
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
```
/
├── functions/
│   ├── api/
│   │   ├── submit-comment.js   # Existing comment handler
│   │   ├── register.js         # Handles user registration
│   │   ├── login.js            # Handles user login
│   │   ├── activate-account.js # Handles email activation link
│   │   └── logout.js           # Handles user logout
│   └── utils/
│       ├── auth.js             # Password hashing, token generation, cookies
│       └── email.js            # Email sending utility
│       └── validation.js       # Shared validation logic (e.g., password complexity)
│
├── index.html          # Main page
├── login.html          # Login form page
├── register.html       # Registration form page
├── activate.html       # Activation landing page
├── style.css           # Shared styles
├── script.js           # Main page JS (incl. comment logic, auth links)
├── login.js            # Login page specific JS
├── register.js         # Registration page specific JS
├── activate.js         # Activation page specific JS
├── common.js           # Shared frontend JS utilities (e.g., password toggle)
└── README.md           # Documentation
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

**Important Reminders:**

*   Replace placeholder **reCAPTCHA Site Key** in `index.html`.
*   Set the **reCAPTCHA Secret Key** as an environment variable (`RECAPTCHA_SECRET_KEY`) in your Cloudflare Pages project settings.
*   Manually update the **bio text** in `index.html`.
*   (Optional) If enabling MailChannels, uncomment the relevant code in `functions/api/submit-comment.js` and configure MailChannels in Cloudflare.