# CivicEye 👁️
[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Project-blue?style=for-the-badge&logo=vercel)](https://wce-hackathon2026-cgp-aglus.vercel.app/)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)

**CivicEye** is a comprehensive, AI-powered civic issue reporting and management platform designed to bridge the gap between citizens and municipal authorities. Built during the WCE Hackathon 2026, it empowers communities to report local infrastructure problems while providing city officials with a streamlined, intelligent dashboard to manage and resolve them efficiently.

---

## ✨ Key Features

### 👤 For Citizens
- **Easy Issue Reporting:** Instantly capture and report civic issues (potholes, garbage dumps, broken streetlights) with location data and image evidence.
- **Community Feed & Upvoting:** View problems reported by others in your neighborhood. Upvote pressing issues to bring them to the authorities' attention faster.
- **Gamification & Leaderboard:** Earn points for reporting and verifying issues. Climb the local leaderboard and become a top civic contributor in your city.
- **Real-Time Tracking:** Track the real-time status of your reports from "Submitted" to "Resolved".

### 👮‍♂️ For City Officers (Govt Portal)
- **Secure Officer Portal:** Exclusive login for government officials (via `@gov.in` domain) to access the administrative dashboard.
- **Automated AI Severity Prediction:** Uploaded images are analyzed by a custom PyTorch model to automatically predict the severity of the issue, helping officers prioritize critical problems.
- **Team & Workflow Management:** Assign tasks to field engineers, track team workload, and update report statuses with proof of resolution (before/after images).
- **Analytics Dashboard:** Get a bird's-eye view of total reports, critical issues, overdue tasks, and resolution rates.

---

## 🛠️ Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion

**Backend:**
- Node.js & Express.js
- PostgreSQL (pg)
- JSON Web Tokens (JWT) for secure authentication
- Bcrypt for secure password hashing
- Multer for handling image uploads

**Machine Learning / AI:**
- Python & PyTorch (Custom Vision Model for Severity Prediction)

---

## 📂 Project Structure

```text
WCEHackathon2026_CGPAglus/
├── model/                     # AI/ML Python scripts and Custom Vision Model
│   ├── inference.py           # PyTorch prediction execution script
│   └── severity_model.pth     # Trained PyTorch severity model weights
├── public/                    # Static assets & Vanilla UI for Admin flow
│   ├── dashboard.html         # Officer's real-time administrative Dashboard
│   └── api.js                 # API bindings for vanilla pages
├── server/                    # Node.js Express Backend API
│   ├── index.pg.js            # Main backend server & init routines (PostgreSQL)
│   ├── index.js               # Legacy backend server (SQLite)
│   ├── package.json           # Backend node dependencies
│   └── uploads/               # Local temp storage for uploaded image proof
├── src/                       # React Frontend Source Code
│   ├── components/            # Reusable UI components (React)
│   ├── lib/                   # Utility functions
│   ├── styles/                # Global styling (Tailwind CSS)
│   ├── App.tsx                # Main application component & routing
│   └── main.tsx               # Frontend entry point
├── package.json               # Frontend dependencies & Vite setup
├── tailwind.config.js         # Tailwind styling definitions
└── vite.config.ts             # Vite build & plugin configurations
```

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Python 3.x](https://www.python.org/downloads/)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/WCEHackathon2026_CGPAglus.git
   cd WCEHackathon2026_CGPAglus
   ```

2. **Install JavaScript dependencies:**
   ```bash
   npm install
   ```

3. **Install Python dependencies (for AI Inference):**
   *(It is recommended to use a virtual environment)*
   ```bash
   pip install torch torchvision Pillow
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory (or inside `server/`) and configure your PostgreSQL database connection:
   ```env
   DATABASE_URL=postgres://your_db_user:your_db_password@localhost:5432/civiceye_db
   JWT_SECRET=your_super_secret_jwt_key
   PORT=4000
   ```

5. **Start the Backend Server:**
   The backend auto-initializes the PostgreSQL schema on startup.
   ```bash
   node server/index.pg.js
   ```

6. **Start the Frontend Development Server:**
   In a new terminal split/window:
   ```bash
   npm run dev
   ```

7. **Access the application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 Application Workflows

1. **Citizen Registration:** Sign up as a normal citizen.
2. **Report Submission:** Take a picture of an issue. The backend's AI model will run an inference to classify its severity.
3. **Officer Login:** Register using a dummy government email (e.g., `officer@gov.in`).
4. **Issue Management:** In the officer dashboard, view the new report, assign it to a team member, and change its status to "Resolved".

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🏆 Hackathon Context

This project was built during the **WCE Hackathon 2026** by team **CGPAglus**.
