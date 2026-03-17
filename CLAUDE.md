# Apple Landing Page Project

## Important Notes

### Video Frames
The `frames/` directory contains 192 extracted video frames that are REQUIRED for the canvas animation to work on the live site.

- **DO NOT** exclude the `frames/` folder from git
- The frames are tracked in git as regular files (~37MB total)
- Always include `frames/` when pushing to GitHub

### Git Commands
```bash
# Always include frames when adding files
git add .
# OR explicitly include frames
git add index.html css/style.css js/app.js frames/
```

### Project Structure
```
apple-landing-page/
├── index.html          # Main HTML file
├── css/style.css       # Styles
├── js/app.js           # JavaScript
├── frames/             # Video frames (REQUIRED for animation)
├── .gitignore
└── .gitattributes
```

### Deployment
- Hosting: Vercel
- Repository: https://github.com/Kunalpatil21/apple-landing-page

### Development Server
```bash
cd E:/Ollama/Test
python -m http.server 8000
```

Then open http://localhost:8000 in browser.