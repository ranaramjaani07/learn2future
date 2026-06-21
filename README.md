<div align="center">
  <img width="1200" height="420" alt="Learn 2 Future Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" style="border-radius: 12px; margin-bottom: 24px;" />

  # 🚀 Learn 2 Future
  ### *The Ultimate Premium E-Learning Hub & Affiliate Ecosystem*

  [![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black&style=flat-square)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-10.x-FFCA28?logo=firebase&logoColor=black&style=flat-square)](https://firebase.google.com/)
</div>

---

## 🌟 Introduction

**Learn 2 Future** is a state-of-the-art e-learning and community platform engineered for future-minded innovators. It provides a curated curriculum of premium masterclasses in **Artificial Intelligence, High-End Video Editing, International Freelancing, and Modern Digital Careers**. 

Designed with a high-fidelity Cyber-Gold design language, the app features an immersive student dashboard, an advanced SEO-optimized blog CMS, automated coupon and student tracking, and a fully-equipped **Affiliate Program CRM** allowing creators to earn direct commissions on course recommendations.

---

## ⚡ Main Features & Core Modules

### 🎓 1. Immersive Student Portal
* **Course Streamliner**: High-definition video player, lesson trackers, and smart notes module.
* **Success portfolios**: Showcase student portfolios, success metrics, and community achievements.
* **Interactive Reviews**: Direct review engine for real-time rating and curriculum feedback.

### 💼 2. Creator Affiliate Program CRM (Master Console)
* **Custom Coupon Engine**: Auto-generate unique referral codes for approved student affiliates (e.g., offering `10% Student Discount` + tracking `15% Affiliate Commissions`).
* **Real-time Performance Metrics**: Trace coupon usages, cumulative sales, total revenue, and estimated earnings automatically.
* **Withdrawals & Payout System**: Secure billing logs with active pending thresholds and manual verification flags.

### 🛡️ 3. Full-Fidelity Admin & CMS Suite
* **Analytics Engine**: Trace gross sales, sign-ups, and user traffic charts using real-time Firestore synchronization.
* **Course and Content CMS**: Instantly append new video lessons, adjust prices, edit course structures, and update metadata.
* **Orbit Blog CMS**: Write SEO-optimized blog posts directly inside the administrative panel without code changes.
* **Interactive Contacts Portal**: Direct ticket manager to trace support complaints and process resolution tickets.

---

## 🛠️ Step-by-Step Local Setup

Follow these simple procedures to configure the **Learn 2 Future** environment on your local server.

### 📋 Prerequisites
Make sure you have **Node.js** (v18 or higher) and **npm** installed on your workstation.

### 📦 1. Install Dependencies
In your main project folder, run the setup command to install webpack extensions and UI libraries:
```bash
npm install
```

### ⚙️ 2. Configure Environment Variables
Create a file named `.env.local` inside the root directory and insert your keys:
```env
# Google Gemini Creator API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Config (Optional fallback overrides)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 🚀 3. Run the Development Server
Launch the application locally in high-performance mode:
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000` (or the local port provided in terminal).

---

## 🔮 How to Push Updates to your GitHub Repository

If you've updated files on your computer and want to commit them directly to your personal GitHub repository, open your terminal and run the following commands sequentially:

```bash
# 1. Initialize Git (only if you haven't run it inside this folder before)
git init

# 2. Add your GitHub Remote URL (Replace with your actual GitHub repo link)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# 3. Mark the main branch name
git branch -M main

# 4. Stage all modified and added files
git add .

# 5. Commit with a premium, descriptive note
git commit -m "feat: finalize Learn 2 Future Affiliate CRM, visual tuning, and config support"

# 6. Push your updates smoothly in production-ready form
git push -u origin main --force
```

---

## 🚀 Deployment & Production Build

### Standard Compile / Build Test
Ensure everything is fully checked and optimal for web crawlers:
```bash
npm run build
```
This compiles your frontend static layouts inside the `/dist` directory and packages the server configuration context.

*Designed with high craft and premium layouts.* 💎
