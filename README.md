# TS Developer

Production-ready web application built with React, Vite, Tailwind CSS, TypeScript, and Firebase.

## Project Details

- **Project Name:** TS Developer
- **Firebase Project ID:** `ts-devloper`
- **Firebase Project Number:** `731050932011`
- **Live Hosting URL:** `https://ts-devloper.web.app` (or `https://ts-devloper.firebaseapp.com`)

---

## Deployment Architecture

```text
Google AI Studio
       ↓
Git Repository (main branch)
       ↓
GitHub Actions (.github/workflows/firebase-hosting.yml)
       ↓
npm ci & npm run build
       ↓
Authenticate with Firebase (FIREBASE_SERVICE_ACCOUNT Secret)
       ↓
Deploy to Firebase Hosting (ts-devloper)
       ↓
Production Live Website
```

---

## 1. Local Development

### Prerequisites
- Node.js LTS (v20 or v22 recommended)
- npm v10+

### Setup

1. **Clone the repository:**
   ```bash
   git clone <YOUR_GITHUB_REPOSITORY_URL>
   cd ts-developer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional):**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 2. Production Build

To test the production build locally:

```bash
npm run build
```

This compiles TypeScript and builds optimized static assets into the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## 3. Manual Firebase Deployment (Firebase CLI)

If you wish to deploy manually from your local machine:

1. **Install Firebase CLI globally (if not already installed):**
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticate with Firebase:**
   ```bash
   firebase login
   ```

3. **Select the Firebase project:**
   ```bash
   firebase use ts-devloper
   ```

4. **Deploy to Firebase Hosting:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
   Or deploy both Hosting and Firestore Security Rules:
   ```bash
   firebase deploy
   ```

---

## 4. Automatic CI/CD Deployment with GitHub Actions

Whenever changes are pushed or merged to the `main` branch, the GitHub Actions workflow automatically builds and deploys the latest version to Firebase Hosting.

### Setting up the GitHub Secret

1. Go to your Firebase Console: [https://console.firebase.google.com/project/ts-devloper/settings/serviceaccounts/adminsdk](https://console.firebase.google.com/project/ts-devloper/settings/serviceaccounts/adminsdk)
2. Select your project **TS Developer** (`ts-devloper`).
3. Navigate to **Project Settings** (gear icon) → **Service accounts**.
4. Click **Generate new private key** and download the JSON file.
5. In your GitHub repository:
   - Navigate to **Settings** → **Secrets and variables** → **Actions**.
   - Click **New repository secret**.
   - Set Name: `FIREBASE_SERVICE_ACCOUNT`
   - Set Value: Paste the **entire contents** of the downloaded service account JSON file.
   - Click **Add secret**.

### Triggering Deployment

Every push to `main` will now trigger the workflow:
```bash
git add .
git commit -m "Deploy latest updates"
git push origin main
```

Monitor progress in your repository's **Actions** tab.

---

## 5. Security & Best Practices

- Never commit `.env` or service account JSON files to git.
- `.gitignore` is pre-configured to exclude secrets, keys, build artifacts (`dist/`), and local logs.
- Client-side Firebase configs are safely configured for web consumption.
