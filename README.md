# Collaborative Canvas

**Real-time collaborative whiteboard app** built with React, TypeScript, Go, WebSockets, and Google Cloud Platform.  
Designed to enable seamless visual collaboration between multiple users — perfect for brainstorming, wireframing, or classroom use.

![collab-canvas-preview](public/canvas_mainpage.png)

---

## 🚀 Live Demo

🔗 [https://yourcustomdomain.com](https://collaborative-canvas-25764.firebaseapp.com/)

---

## ✨ Key Features

- ⚡ **Real-time collaboration** via native WebSockets
- 👥 **Live presence tracking** with dynamic user count
- 🖌️ **Interactive whiteboard** with drawing and color tools
- ☁️ **Deployed on Firebase Hosting** with CI/CD via GitHub Actions
- 🧠 **Backend built in Go** — stateless WebSocket server deployed to **Google Cloud Run**

---

## 🛠️ Tech Stack

| Frontend      | Backend             | Cloud / DevOps        |
|---------------|---------------------|-----------------------|
| React         | Go (Golang)         | Firebase Hosting      |
| TypeScript    | Gorilla WebSocket   | Google Cloud Run      |
| Vite          | REST/WebSocket APIs | GitHub Actions (CI/CD)|

---

## 🧩 System Architecture

[ Client (React) ] ⇄ [ WebSocket Server (Go) ] ⇄ [ Google Cloud Run ]
                                ↓
                        [ Firebase Hosting ]
                                ↓
                  [ Firestore (Planned for sync) ]

- Each client connects via a persistent WebSocket connection to sync canvas events.
- Backend is fully containerized and deployable via Docker + GCP.
- Firebase Hosting handles static delivery + domain + SSL.
- GitHub Actions automate deploys on `main` merge and PR previews.

---

## Planned Improvements

- **Persistent whiteboard state** via Firebase Firestore
- **Session management** with UUID rooms

---

## Contact

- GitHub: [@QudahM](https://github.com/QudahM)
- LinkedIn: [linkedin.com/in/your-profile](https://www.linkedin.com/in/qudahm/)