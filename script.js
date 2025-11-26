function splitCsvLine(line) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];

        if (char === '"') {
            const nextChar = line[i + 1];
            if (inQuotes && nextChar === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            cells.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    cells.push(current);
    return cells;
}

function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    const questions = [];

    lines.forEach((line, index) => {
        if (index === 0 && line.trim().toLowerCase().startsWith('question,')) {
            return;
        }

        const cells = splitCsvLine(line).map(cell => cell.trim());
        if (cells.length < 3) {
            console.warn(`Row ${index + 1}: not enough columns.`);
            return;
        }

        const maybeNewFormat = cells.length >= 7;
        let questionText = '';
        let options = [];
        let correctIndex = -1;
        let explanation = '';

        if (maybeNewFormat) {
            questionText = cells[0];
            options = cells.slice(1, 5).filter(option => option && option.trim() !== '').map(option => option.trim());
            const correctIndexRaw = parseInt(cells[5], 10);
            const zeroBasedIndex = Number.isNaN(correctIndexRaw) ? -1 : correctIndexRaw - 1;
            explanation = cells[6] ? cells[6].trim() : '';

            if (!questionText || options.length < 2 || zeroBasedIndex === -1) {
                console.warn(`Row ${index + 1}: missing question, answers, or valid correct answer index.`);
                return;
            }

            if (zeroBasedIndex < 0 || zeroBasedIndex >= options.length) {
                console.warn(`Row ${index + 1}: correct answer index out of range.`);
                return;
            }

            correctIndex = zeroBasedIndex;
        } else {
            questionText = cells[0];
            options = cells.slice(1, 4).filter(option => option && option.trim() !== '').map(option => option.trim());
            const correctText = cells[4] ? cells[4].trim() : '';
            explanation = cells[5] ? cells[5].trim() : '';
            correctIndex = options.findIndex(option => option === correctText);

            if (!questionText || options.length < 2 || correctIndex === -1) {
                console.warn(`Row ${index + 1}: invalid legacy row.`);
                return;
            }
        }

        questions.push({
            id: questions.length,
            question: questionText.trim(),
            options,
            correctIndex,
            explanation,
            firstAnswerIndex: null,
            firstAnswerCorrect: null,
            attempts: 0,
            answeredCorrectlyAtLeastOnce: false
        });
    });

    return questions;
}

function handleUpload(event) {
    event.preventDefault();
    const input = document.getElementById('csvFile');
    const file = input.files[0];

    if (!file) {
        alert('Please select a CSV file.');
        return;
    }

    file.text().then(text => {
        const questions = parseCsv(text);
        if (!questions.length) {
            alert('No valid questions were found in the CSV file.');
            return;
        }

        localStorage.setItem('quizQuestions', JSON.stringify(questions));
        localStorage.removeItem('quizSummary');
        window.location.href = 'Questions.html';
    }).catch(() => {
        alert('Failed to read the CSV file.');
    });
}

async function fetchDirectoryCsvs() {
    try {
        const response = await fetch('Quizzes/', { cache: 'no-store' });
        const contentType = response.headers.get('content-type') || '';

        if (!response.ok || !contentType.includes('text/html')) {
            return [];
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));

        const csvFiles = links
            .map(link => link.getAttribute('href'))
            .filter(Boolean)
            .map(href => decodeURIComponent(href))
            .filter(href => href.toLowerCase().endsWith('.csv'))
            .map(href => href.split('/').pop());

        return Array.from(new Set(csvFiles));
    } catch (error) {
        console.debug('Could not read directory listing for Quizzes/', error);
        return [];
    }
}

async function fetchGithubCsvs() {
    try {
        const { hostname, pathname } = window.location;
        const owner = hostname.endsWith('github.io') ? hostname.split('.')[0] : null;
        const pathSegments = pathname.split('/').filter(Boolean);
        const repo = pathSegments[0] || null;

        if (!owner || !repo) {
            return [];
        }

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/Quizzes`;
        const response = await fetch(apiUrl, {
            headers: { Accept: 'application/vnd.github.v3+json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            return [];
        }

        const entries = await response.json();
        if (!Array.isArray(entries)) {
            return [];
        }

        return entries
            .filter(item => item && item.type === 'file' && typeof item.name === 'string')
            .map(item => item.name)
            .filter(name => name.toLowerCase().endsWith('.csv'));
    } catch (error) {
        console.debug('Could not retrieve quizzes via GitHub API', error);
        return [];
    }
}

async function fetchQuizList() {
    const status = document.getElementById('quiz-status');
    const select = document.getElementById('quiz-list');

    if (!select) return;

    if (status) status.textContent = 'Loading quizzes...';
    select.innerHTML = '';

    try {
        const [directoryCsvs, githubCsvs] = await Promise.all([
            fetchDirectoryCsvs(),
            fetchGithubCsvs()
        ]);

        const allCsvs = Array.from(new Set([...directoryCsvs, ...githubCsvs]));

        if (!allCsvs.length) {
            if (status) status.textContent = 'No quizzes found in the Quizzes folder.';
            return;
        }

        allCsvs.forEach(file => {
            const prettyName = file.replace(/_/g, ' ').replace(/\.csv$/i, '');
            const displayName = prettyName.charAt(0).toUpperCase() + prettyName.slice(1);
            const option = document.createElement('option');
            option.value = file;
            option.textContent = displayName;
            select.appendChild(option);
        });

        if (status) status.textContent = `Loaded ${allCsvs.length} quiz${allCsvs.length > 1 ? 'zes' : ''}.`;
    } catch (error) {
        console.error(error);
        if (status) status.textContent = 'Failed to load quizzes from the server.';
    }
}

async function loadQuizFromServer() {
    const select = document.getElementById('quiz-list');
    const status = document.getElementById('quiz-status');

    if (!select || !select.value) {
        alert('Please select a quiz from the list.');
        return;
    }

    const fileName = select.value;
    if (status) status.textContent = 'Loading selected quiz...';

    try {
        const response = await fetch(`Quizzes/${fileName}`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Quiz file could not be loaded');
        }

        const text = await response.text();
        const questions = parseCsv(text);

        if (!questions.length) {
            if (status) status.textContent = 'No valid questions found in that CSV file.';
            return;
        }

        localStorage.setItem('quizQuestions', JSON.stringify(questions));
        localStorage.removeItem('quizSummary');
        window.location.href = 'Questions.html';
    } catch (error) {
        console.error(error);
        if (status) status.textContent = 'There was a problem loading the selected quiz.';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    if (form) {
        form.addEventListener('submit', handleUpload);
    }

    const startSelectedButton = document.getElementById('start-selected');
    if (startSelectedButton) {
        startSelectedButton.addEventListener('click', loadQuizFromServer);
    }

    const refreshButton = document.getElementById('refresh-quizzes');
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchQuizList);
    }

    fetchQuizList();
});
