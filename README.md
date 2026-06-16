# LeaderAssess Pro — Enterprise AI-Powered Leadership Assessment Platform

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

## 🔑 Demo Credentials

| Role      | Email                         | Password   |
|-----------|-------------------------------|------------|
| Admin     | admin@leaderassess.com        | demo1234   |
| Candidate | candidate@leaderassess.com    | demo1234   |

## 📦 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Code Editor**: Monaco Editor (VS Code engine)
- **Charts**: Chart.js + react-chartjs-2
- **i18n**: i18next (EN, ES, FR + 4 more)
- **Offline**: IndexedDB + Service Worker (PWA)
- **State**: React Context + localStorage

## 🗺️ Routes

| Path              | Description                         | Role         |
|-------------------|-------------------------------------|--------------|
| `/`               | Login / Register                    | Public       |
| `/dashboard`      | Personalized dashboard              | All          |
| `/assessments`    | Assessment module browser           | All          |
| `/assessments/:id`| Take assessment (with proctoring)   | All          |
| `/results`        | Performance reports + charts        | All          |
| `/admin`          | User management + config            | Admin        |
| `/architecture`   | FAANG system design diagram         | Admin        |
| `/security`       | Security posture + threat matrix    | Admin        |
| `/observability`  | Live metrics + service health       | Admin        |
| `/integrations`   | Enterprise integration hub          | Admin        |

## 🧩 Modules (500 Questions Total)

| Module          | Questions | Time   | Features                         |
|-----------------|-----------|--------|----------------------------------|
| Technical       | 100       | 120m   | Live code editor, 5 languages    |
| Attitude        | 100       | 60m    | Professional values scenarios    |
| Behavioral      | 100       | 90m    | STAR-based situational judgment  |
| Psychometric    | 100       | 75m    | IRT adaptive, negative marking   |
| Communication   | 100       | 60m    | Written + cross-cultural skills  |

## 🤖 AI Features

- **Adaptive Engine**: 3-Parameter Logistic IRT model, MLE theta estimation
- **Risk Scoring**: Weighted event accumulation with exponential decay
- **Proctoring**: WebRTC webcam + tab/focus monitoring + violation alerts
- **Insights**: AI-generated performance summaries per module

## 🔐 Security

- JWT auth + RBAC (admin / candidate / viewer)
- AES-256 offline encryption
- Audit trail for every action
- GDPR-compliant data handling

## 📱 PWA

Install as a native-like app on desktop and mobile:
- Offline assessment support
- Background sync when reconnected
- Push notifications
