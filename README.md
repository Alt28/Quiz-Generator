# ⚡ CLARKO - StudyBuddy Quiz Generator

An AI-powered quiz generator that turns your notes into interactive Kahoot-style quizzes. Upload a PDF, DOCX, PPTX, or paste text — CLARKO uses NLP to generate multiple quiz types automatically.


The Link: https://quiz-generator-0dil.onrender.com


![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Flask](https://img.shields.io/badge/Flask-Web_App-green)
![spaCy](https://img.shields.io/badge/spaCy-NLP-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **File Upload** — PDF, DOCX, PPTX, TXT support (up to 20 MB)
- **Paste Notes** — Paste text directly for quick quiz generation
- **Quiz Types:**
  - Multiple Choice (MCQ)
  - Fill in the Blank
  - Enumeration
  - Flashcards (3D flip carousel)
- **Game Modes:**
  - 🎮 **Quiz Mode** — 10 questions per type, relaxed timers
  - 📝 **Exam Mode (HARD)** — 50 items total, shorter timers
- **Kahoot-Style Gameplay** — Timed questions, scoring, streaks, color-coded choices
- **Mobile Responsive** — Optimized for phones, tablets, and desktop

## NLP Pipeline

CLARKO uses **spaCy** with a multi-stage NLP algorithm:

1. **TF-IDF Keyword Scoring** — Identifies important terms using term frequency × inverse document frequency
2. **POS Tagging** — Filters for nouns, proper nouns, and adjectives
3. **Named Entity Recognition** — Boosts keywords found in named entities (ORG, GPE, PERSON, etc.)
4. **Dependency Parsing** — Extracts "X is Y" definitions from sentence structure
5. **Sentence Ranking** — Selects information-rich sentences by keyword overlap + entity density
6. **Semantic Distractors** — Uses word vectors to pick plausible wrong answers for MCQs

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Flask (Python) |
| NLP | spaCy + en_core_web_sm |
| File Parsing | pdfplumber, python-docx, python-pptx |
| Frontend | Vanilla HTML/CSS/JS |
| Production Server | Gunicorn |
| Deployment | Docker / Render |

## Setup

### Local Development

```bash
# Clone the repo
git clone https://github.com/Alt28/Quiz-Generator.git
cd Quiz-Generator

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Run the app
python CLARKO.py
```

Open **http://localhost:8080** in your browser.

### Deploy to Render (Docker)

1. Push to GitHub
2. Create a **New Web Service** on Render
3. Connect your repo and select **Docker** as the runtime
4. Deploy — the Dockerfile handles everything automatically

## Project Structure

```
├── CLARKO.py            # Flask backend + NLP quiz engine
├── templates/
│   └── index.html       # Main HTML page
├── static/
│   ├── css/
│   │   └── style.css    # Dark theme + game UI
│   └── js/
│       └── app.js       # Kahoot-style game engine
├── Dockerfile           # Docker deployment config
├── build.sh             # Render build script
├── render.yaml          # Render blueprint
├── requirements.txt     # Python dependencies
└── .python-version      # Python version pin
```

## Usage

1. **Upload** a document or **paste** your notes
2. Select quiz types (MCQ, Fill in the Blank, Enumeration, Flashcards)
3. Choose **Quiz Mode** or **Exam Mode**
4. Click **Generate**
5. Play through the Kahoot-style game with timers and scoring
