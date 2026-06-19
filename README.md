# 🎬 TrendCraft AI
### *Your Trends. Your Face. Your Way.*

> An AI-powered web app that analyzes any trending video and recreates it using **your own photos** — no editing skills needed.

Built with **IBM Bob** for the [IBM AI Builders Challenge — July 2026](https://challenge-bobhub.bemyapp.com)

![License](https://img.shields.io/badge/license-MIT-purple)
![IBM Bob](https://img.shields.io/badge/Built%20with-IBM%20Bob-blue)
![Challenge](https://img.shields.io/badge/IBM%20AI%20Builders-July%202026-blueviolet)

---

## 🚨 The Problem

Every day, millions of creators and small business owners see a trending video and think:

> *"I want to recreate this — but with MY photos and MY brand."*

The problem? Recreating a trend requires:
- Knowing exactly what shots to take
- Professional video editing skills
- Hours of production time
- Expensive tools

**Most people give up before they even start.**

---

## 💡 The Solution

**TrendCraft AI** bridges the gap between *seeing a trend* and *owning it.*

Paste a trending video URL → AI analyzes it → You get a step-by-step recreation plan with your own photos → Export to Canva or video format — ready to post.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔍 **Trend Analyzer** | Paste any TikTok / Instagram / YouTube Shorts URL and AI breaks it down scene by scene |
| 📋 **Shot List Generator** | Get an exact list of photos and clips you need to recreate the trend |
| ✍️ **Content Generator** | AI writes your captions, hashtags, and suggests music |
| 🎨 **Canva Export** | One-click export to a ready-made Canva template |
| 🎬 **Auto Video Builder** | Shotstack API assembles your photos into a professional video automatically |
| 🤖 **AI Visual Effects** | Runway ML adds cinematic AI transitions to your footage |
| 🎯 **Style Matching** | AI adapts the trend to match your personal brand and style |

---

## 🛠️ Tech Stack

```
Frontend     →  React.js + Tailwind CSS
Backend      →  Python + FastAPI
AI Core      →  IBM Bob (Primary Development Tool)
Video API    →  Shotstack API
AI Video     →  Runway ML
Design       →  Canva API
Processing   →  FFmpeg
Hosting      →  Vercel (Frontend) + Railway (Backend)
```

---

## 🔄 How It Works

```
1. Paste trending video URL
         ↓
2. IBM Bob analyzes pacing, structure & style
         ↓
3. AI generates your personalized Shot List
         ↓
4. Upload your photos
         ↓
5. Runway ML enhances with AI effects
         ↓
6. Shotstack assembles the final video
         ↓
7. Export to Canva or download directly
         ↓
8. Post & go viral 🚀
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- IBM Bob account → [ibm.biz/university-bob](http://ibm.biz/university-bob)

### Installation

```bash
# Clone the repository
git clone https://github.com/yousef-69/creative-ai-assistant.git
cd creative-ai-assistant

# Backend setup
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your API keys

# Frontend setup
cd ../frontend
npm install
npm run dev
```

### Environment Variables

```env
IBM_BOB_API_KEY=your_key_here
SHOTSTACK_API_KEY=your_key_here
RUNWAY_API_KEY=your_key_here
CANVA_API_KEY=your_key_here
```

---

## 🏆 Why TrendCraft AI Wins

| Criteria | How We Deliver |
|----------|---------------|
| **Innovation** | First tool to recreate trends using *your real photos*, not AI avatars |
| **Technical Execution** | IBM Bob + Shotstack + Runway ML integrated pipeline |
| **Challenge Fit** | Directly reimagines creative content production with AI |
| **Feasibility** | Live working prototype with real API integrations |
| **Real-World Impact** | Solves a daily pain point for 500M+ content creators worldwide |

---

## 🆚 How We're Different

| | Other Tools | TrendCraft AI |
|--|--|--|
| Output | AI avatars & fake faces | **Your real photos** |
| Audience | Large marketing teams | **Individuals & small businesses** |
| Canva Integration | ❌ | ✅ |
| Personalized Shot List | ❌ | ✅ |
| IBM Bob Powered | ❌ | ✅ |

---

## 📁 Project Structure

```
creative-ai-assistant/
├── frontend/          # React.js application
├── backend/           # Python FastAPI server
│   ├── analyzer/      # IBM Bob trend analysis
│   ├── generator/     # Content & shot list generation
│   └── video/         # Shotstack & FFmpeg integration
├── docs/              # Documentation
└── README.md
```

---

## 👤 About

Built by **Yousef Skeikar** — IT Student, Malaysia

Submitted to the **IBM AI Builders Challenge — July 2026**
Theme: *Reimagine Creative Industries with AI*

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with IBM Bob 🤖 | Powered by AI | Made for Creators 🎨</strong>
</p>
