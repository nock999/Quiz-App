# Quiz-App

Quiz-App is a lightweight, front-end–only quiz experience built with HTML, CSS, and vanilla JavaScript. It loads quizzes from CSV files, supports retrying questions you miss, and shows a simple session summary once you are done.

## Project structure
```
Quiz-App/
├── index.html              # Landing page that links into the quiz flow
├── startquiz.html          # Quiz launcher (select server quizzes or upload your own CSV)
├── Questions.html          # Quiz runner
├── result.html             # Session summary
├── script.js               # Start screen logic (CSV parsing, quiz loading)
├── script1.js              # Quiz experience logic
├── result.js               # Result rendering logic
├── style.css               # Shared styles for splash/launch screens
├── quizstyle.css           # Styles for question and result screens
├── Quizzes/                # Built-in CSV samples served by the site
└── images/                 # UI assets
```

## How the app works
1. Open `startquiz.html` (or `index.html` → "Quiz app") in a browser.
2. Pick a CSV file: either choose one from the **Quizzes** folder listed on the page or upload your own.
3. The quiz runs in **Questions.html**. Questions you miss get queued for a review round until everything has been answered correctly.
4. The session summary in **result.html** shows how many questions you got right on the first try plus a per-question breakdown.

## Creating quiz CSV files
The app now supports a modern CSV format that is easier to create and less error-prone.

### Recommended (indexed) format
Provide a header row with these columns:
```
Question,Answer 1,Answer 2,Answer 3,Answer 4,Correct Answer Index,Explanation
```
Guidelines:
- Include **2–4** answer options per question; leave unused answer cells blank.
- Set **Correct Answer Index** to the **1-based** position of the right answer (1–4).
- **Explanation** is optional and is shown after a selection is made.

Example:
```
Question,Answer 1,Answer 2,Answer 3,Answer 4,Correct Answer Index,Explanation
"What does CIA stand for?",Confidentiality,Integrity,Availability,,3,"CIA refers to confidentiality, integrity, and availability."
```

### Legacy (text-match) format
Legacy CSVs are still accepted for backward compatibility. Columns: `Question,Answer 1,Answer 2,Answer 3,Correct Answer,Explanation`. The correct answer must exactly match one of the option texts. Prefer the indexed format above for new quizzes.

### Adding quizzes to the app
- To make quizzes discoverable on the start screen, place CSV files in the **Quizzes/** directory. The app will list them automatically (works on GitHub Pages or any static host that exposes directory listings or the GitHub API).
- You can also upload a CSV directly from your device via the form on **startquiz.html**; no hosting changes required.

## Development notes
The app is static—no build step or external dependencies. Open the HTML files directly or serve the repository with any static file server.
