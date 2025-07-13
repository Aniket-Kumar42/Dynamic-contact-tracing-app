# Dynamic-contact-tracing-app
Dynamic Contact Tracing App Using Graphs to Track Exposure Paths.
# Contact Tracing Web App

## Overview
A full-stack dynamic contact tracing web app using graphs to track exposure paths. Backend uses Flask (Python) and C++ for graph logic. Frontend uses plain JS and TailwindCSS with Cytoscape.js for graph visualization.

## File Structure
```
project-root/
  backend/
    app.py            # Flask app (API)
    graph_logic.cpp   # C++ graph logic
    users.json        # Data storage
  frontend/
    index.html
    dashboard.html
    js/graph.js
    css/style.css
  README.md
```

## Requirements
- Python 3.x
- Flask
- C++ compiler (g++)
- nlohmann/json (header-only C++ JSON library)
- Node.js (optional, for frontend dev server)

## Setup
1. **Install Python dependencies:**
   ```bash
   pip install flask
   ```
2. **Install C++ dependencies:**
   - Download `json.hpp` from https://github.com/nlohmann/json/releases/latest and place it in `backend/`.
3. **Build C++ graph logic:**
   ```bash
   cd backend
   g++ -std=c++17 -o graph_logic graph_logic.cpp
   ```
4. **Run Flask backend:**
   ```bash
   python app.py
   ```
5. **Open frontend:**
   - Open `frontend/index.html` in your browser (or use a local server for CORS).

## Features
- User registration/login
- Mark infected, add contacts
- View exposure graph and risk level
- Send alerts to contacts
- Graph visualization (Cytoscape.js)

## To Do
- Complete C++ graph logic
- Implement frontend dashboard and graph UI
