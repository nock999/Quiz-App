function parseCsv(text) {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const questions = [];

    lines.forEach((line, index) => {
        const cells = line.split(',').map(cell => cell.trim());
        if (cells.length < 3) {
            return;
        }

        const questionText = cells[0];
        const rest = cells.slice(1);
        if (rest.length < 2) {
            return;
        }

        let options = [];
        let correctIndex = -1;
        let explanation = '';

        if (rest.length >= 3) {
            const possibleCorrect = rest[rest.length - 2];
            const possibleExplanation = rest[rest.length - 1];
            const maybeOptions = rest.slice(0, rest.length - 2);

            if (maybeOptions.includes(possibleCorrect)) {
                options = maybeOptions;
                correctIndex = options.indexOf(possibleCorrect);
                explanation = possibleExplanation;
            }
        }

        if (correctIndex === -1) {
            options = rest.slice(0, rest.length - 1);
            const correctOption = rest[rest.length - 1];
            correctIndex = options.indexOf(correctOption);
        }

        if (correctIndex === -1 || options.length === 0) {
            console.warn(`Row ${index + 1}: correct option not found among options.`);
            return;
        }

        questions.push({
            id: index,
            question: questionText,
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

async function fetchQuizList() {
    const status = document.getElementById('quiz-status');
    const select = document.getElementById('quiz-list');

    if (!select) return;

    if (status) status.textContent = 'Loading quizzes...';
    select.innerHTML = '';

    try {
        const response = await fetch('Quizzes/quizzes.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Unable to load quiz list');
        }

        const quizzes = await response.json();

        if (!Array.isArray(quizzes) || quizzes.length === 0) {
            if (status) status.textContent = 'No quizzes found in the Quizzes folder.';
            return;
        }

        quizzes.forEach(quiz => {
            const option = document.createElement('option');
            option.value = quiz.file;
            option.textContent = quiz.title || quiz.file;
            select.appendChild(option);
        });

        if (status) status.textContent = `Loaded ${quizzes.length} quiz${quizzes.length > 1 ? 'zes' : ''}.`;
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
