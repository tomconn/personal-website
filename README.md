# Personal Website - Thomas Connolly

This repository contains the source code for the personal website of Thomas Connolly (www.softwarestable.com), hosted on Cloudflare Pages.

## Original Prompt & Generation

*This project structure, code, and documentation were generated based on the following prompt using Google Gemini 2.5 Pro:*

> Using Cloudflare Pages. Implement the following sequence.
> Create a simple reactive webpage, that works on both mobile and desktop browsers and supported the latest chrome, firefox and safari browsers.
> The website will present a personal home page of my name, skills as an IT architect in Platform engineering, links to github and linkedin pages.
> The page includes my name Thomas Connolly, my email address, contact@thomasconnolly.com, a brief bio copied from my linkedin page, see https://www.linkedin.com/in/thomas-connolly-7350742/?originalSubdomain=au and to my github page, https://github.com/tomconn.
> Add my it certifications from linkedin include kubernetes, CKA,CKAD,CKS,kubestronaut, AWS Architect Professional and TOGAF 9 Certified.
> It will also provide links to my linkedin and github pages.
> Split the website into html, css and javascript files.
> Use a 1970's Nasa theme for the website, with emphasis on an optimistic future of innovation and automation where people are content and tolerant.
> I have a domain name www.softwarestable.com, I want to use the free Cloudflare pages to only host my personal website.
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
/
├── index.html # Main HTML structure
├── style.css # CSS for styling and theme
├── script.js # JavaScript for reactivity (animations, etc.)
└── README.md # This setup and documentation file


## Technology Stack

*   **HTML5:** Structure and content.
*   **CSS3:** Styling, layout (Flexbox), responsiveness, and theme implementation (including background animations). Google Fonts (`Orbitron`, `Montserrat`) are used.
*   **JavaScript (Vanilla):** Simple interactivity (fade-in on scroll, dynamic year in footer).
*   **Cloudflare Pages:** Hosting (Free Tier).
*   **GitHub:** Source control and deployment trigger (Private Repository).
*   **Namecheap:** DNS Management (for `www.softwarestable.com`) and Email Forwarding.

## Setup Instructions

Follow these steps to set up the repository and deploy the website to Cloudflare Pages using your custom domain `www.softwarestable.com`, while keeping email forwarding active on Namecheap.

### 1. GitHub Repository Setup (Private)

1.  **Create a New Repository on GitHub:**
    *   Go to your GitHub account (`github.com/tomconn`).
    *   Click the "+" icon in the top-right corner and select "New repository".
    *   **Repository name:** Choose a name (e.g., `personal-website` or `softwarestable-com`).
    *   **Description:** (Optional) Add a brief description like "Source code for www.softwarestable.com".
    *   **Select "Private"**: This is crucial to keep your code private as requested.
    *   **Initialize this repository with:** Tick the box for "Add a README file" (you'll replace it later with this one).
    *   Click "Create repository".

2.  **Clone the Repository:**
    *   On the new repository page, click the "Code" button.
    *   Copy the HTTPS or SSH URL.
    *   Open a terminal or command prompt on your local machine.
    *   Navigate to the directory where you want to store the project.
    *   Run: `git clone <repository_url>` (replace `<repository_url>` with the copied URL).
    *   Navigate into the newly created directory: `cd <repository_name>`

3.  **Add Project Files:**
    *   Copy the `index.html`, `style.css`, `script.js`, and this `README.md` file into the cloned repository directory on your computer, overwriting the initial `README.md` if necessary.
    *   **Important:** Open `index.html` and **manually paste your bio** from your LinkedIn profile into the designated `<p>` tag within the `#about` section.

4.  **Commit and Push Files:**
    *   In your terminal (inside the project directory), run the following commands:
        ```bash
        git add .
        git commit -m "Initial commit of website files"
        git push origin main # Or master, depending on your default branch name
        ```

### 2. Cloudflare Pages Setup

1.  **Sign up/Log in to Cloudflare:** Go to [dash.cloudflare.com](https://dash.cloudflare.com/) and log in or create a free account.
2.  **Navigate to Pages:** In the left-hand sidebar, go to `Workers & Pages` -> `Overview`. Click on the `Pages` tab, then `Create application`.
3.  **Connect to Git:**
    *   Click the `Connect to Git` tab.
    *   Choose `GitHub`. You'll likely need to authorize Cloudflare to access your GitHub account.
    *   **Crucially:** When prompted to "Select repositories", choose "Only select repositories" and pick the **private** repository you just created (e.g., `personal-website`). Click "Install & Authorize".
4.  **Select Repository:** Back in Cloudflare, select the newly authorized private repository and click "Begin setup".
5.  **Set up builds and deployments:**
    *   **Project name:** This determines your default `.pages.dev` subdomain (e.g., `softwarestable`). Choose something appropriate.
    *   **Production branch:** Select `main` (or `master`, matching your GitHub repo's default branch).
    *   **Framework preset:** Select `None`. This is important as it's a static HTML/CSS/JS site with no build step required.
    *   **Build command:** Leave this **blank**.
    *   **Build output directory:** Leave this as `/` or blank (Cloudflare will detect the static files in the root).
    *   **Root directory:** Leave as `/` unless your files are in a subfolder within the repo (they are not, based on the structure above).
    *   **Environment variables:** None needed for this setup.
6.  **Save and Deploy:** Click "Save and Deploy". Cloudflare will pull your code from GitHub and deploy it. You'll get a default `<your-project-name>.pages.dev` URL where you can view the site.

### 3. Custom Domain Setup (www.softwarestable.com via Namecheap)

**Goal:** Point `www.softwarestable.com` to your Cloudflare Pages site *without* changing your nameservers away from Namecheap, thus preserving Namecheap's email forwarding.

1.  **Add Custom Domain in Cloudflare Pages:**
    *   Go back to your Cloudflare Pages project dashboard (`Workers & Pages` -> Select your project).
    *   Click on the `Custom domains` tab.
    *   Click `Set up a custom domain`.
    *   Enter `www.softwarestable.com` into the domain field and click `Continue`.
    *   Cloudflare will detect that the domain's nameservers are *not* pointed to Cloudflare. It will provide instructions to add a `CNAME` record. **Follow these CNAME instructions.** It will look something like this:
        *   **Type:** `CNAME`
        *   **Name:** `www`
        *   **Target/Value:** `<your-project-name>.pages.dev` (Use the actual *.pages.dev domain assigned by Cloudflare).

2.  **Add CNAME Record in Namecheap:**
    *   Log in to your Namecheap account.
    *   Go to your `Domain List` and click `Manage` next to `softwarestable.com`.
    *   Go to the `Advanced DNS` tab.
    *   **Important:** Find the "Host Records" section. *Do not* change the "Nameservers" setting (keep it on "Namecheap BasicDNS" or "Namecheap Web Hosting DNS" if applicable).
    *   Click `Add New Record`.
        *   **Type:** Select `CNAME Record`.
        *   **Host:** Enter `www`.
        *   **Value:** Paste the `<your-project-name>.pages.dev` URL provided by Cloudflare.
        *   **TTL:** Leave as `Automatic` or set to a low value like `5 min` initially if you want changes to propagate faster (you can increase it later).
    *   Click the green checkmark to save the record.
    *   **Remove Conflicts:** If you have any existing `A` or `CNAME` records for the `www` host, remove them to avoid conflicts. *Leave other records (like MX records for email, or records for the root domain `@` if you have them) untouched.*

3.  **Verification in Cloudflare:**
    *   Go back to the Cloudflare Pages "Custom domains" tab.
    *   It might take some time (minutes to hours, usually faster) for DNS changes to propagate. Cloudflare will automatically check for the CNAME record.
    *   Once verified, the status will change to "Active". Cloudflare will also automatically provision an SSL certificate for `www.softwarestable.com`.

4.  **(Optional) Handling the Root Domain (`softwarestable.com`):**
    *   Visitors might type `softwarestable.com` without the `www`. You have a few options managed in Namecheap's `Advanced DNS`:
        *   **Option A (Recommended): URL Redirect:** Add a `URL Redirect Record` (sometimes called Forwarding).
            *   **Type:** `URL Redirect` (or similar name in Namecheap)
            *   **Host:** `@` (represents the root domain)
            *   **Value:** `https://www.softwarestable.com` (forward to the `www` version)
            *   **Type:** Choose `Permanent (301)`
            *   Save this record. Remove any existing `A` or `CNAME` records for `@` if they conflict.
        *   **Option B (If URL Redirect isn't ideal):** Add an `A` record pointing to a dummy IP like `192.0.2.1` (a non-routable IP often used for CNAME-like behavior at the root via Cloudflare, *but since you're NOT using Cloudflare DNS proxy*, this won't work directly). Stick with Option A (URL Redirect) managed within Namecheap for simplicity here.

### 4. Confirm Email Forwarding

*   Since you **did not** change your nameservers from Namecheap to Cloudflare, your existing MX records and email forwarding settings within Namecheap for `contact@thomasconnolly.com` (assuming it's configured for the `softwarestable.com` domain) will remain active and unaffected. No further action is needed for email.

### 5. Continuous Deployment

*   Any time you push changes to the `main` (or `master`) branch of your private GitHub repository, Cloudflare Pages will automatically detect the changes and deploy the new version of your website.

---

You should now have your personal website live on `www.softwarestable.com`, served via Cloudflare Pages, with the source code securely stored in a private GitHub repository, and your Namecheap email forwarding intact. Remember to paste your bio into `index.html`!