let questions = [];
let phase = 'initial';
let initialOrder = [];
let wrongIndices = [];
let reviewQueue = [];
let remainingToFix = new Set();
let currentIndex = 0;

window.addEventListener('DOMContentLoaded', () => {
    const stored = localStorage.getItem('quizQuestions');
    if (!stored) {
        window.location.href = 'index.html';
        return;
    }

    questions = JSON.parse(stored);
    initialOrder = questions.map((_, idx) => idx);
    attachHandlers();
    renderCurrentQuestion();
    updateProgress();
});

function attachHandlers() {
    const continueBtn = document.getElementById('continue-btn');
    continueBtn.addEventListener('click', handleContinue);

    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to exit the quiz?')) {
            window.location.href = 'index.html';
        }
    });
}

function getCurrentQuestionIndex() {
    if (phase === 'initial') {
        return initialOrder[currentIndex];
    }
    return reviewQueue[currentIndex];
}

function renderCurrentQuestion() {
    const container = document.getElementById('question-container');
    const questionIndex = getCurrentQuestionIndex();
    const question = questions[questionIndex];
    const isReview = phase === 'review';

    container.innerHTML = '';

    const meta = document.createElement('div');
    meta.className = 'question-meta';
    meta.textContent = isReview ? 'Review question' : 'New question';

    const title = document.createElement('h1');
    title.className = 'question-text';
    title.textContent = question.question;

    const optionsDiv = document.createElement('div');
    optionsDiv.id = 'options';

    const explanationDiv = document.createElement('div');
    explanationDiv.id = 'explanation';
    explanationDiv.className = 'explanation hidden';

    container.append(meta, title, optionsDiv, explanationDiv);
    question.options.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-button';
        btn.textContent = option;
        btn.addEventListener('click', () => handleAnswer(idx));
        optionsDiv.appendChild(btn);
    });

    document.getElementById('continue-btn').disabled = true;
}

function handleAnswer(selectedIndex) {
    const questionIndex = getCurrentQuestionIndex();
    const question = questions[questionIndex];
    const optionButtons = document.querySelectorAll('.option-button');
    const isCorrect = selectedIndex === question.correctIndex;

    question.attempts += 1;

    if (question.firstAnswerIndex === null) {
        question.firstAnswerIndex = selectedIndex;
        question.firstAnswerCorrect = isCorrect;
        if (!isCorrect) {
            wrongIndices.push(questionIndex);
        }
    }

    if (isCorrect) {
        question.answeredCorrectlyAtLeastOnce = true;
        if (phase === 'review') {
            remainingToFix.delete(questionIndex);
        }
    }

    optionButtons.forEach((btn, idx) => {
        btn.classList.add('disabled');
        btn.disabled = true;
        if (idx === selectedIndex) {
            btn.classList.add(isCorrect ? 'correct' : 'wrong');
        }
        if (!isCorrect && idx === question.correctIndex) {
            btn.classList.add('correct');
        }
    });

    const explanationDiv = document.getElementById('explanation');
    if (question.explanation && question.explanation.trim() !== '') {
        explanationDiv.textContent = question.explanation;
        explanationDiv.classList.remove('hidden');
    }

    document.getElementById('continue-btn').disabled = false;
    updateProgress();
}

function handleContinue() {
    const order = phase === 'initial' ? initialOrder : reviewQueue;
    if (currentIndex < order.length - 1) {
        currentIndex += 1;
        renderCurrentQuestion();
        return;
    }

    if (phase === 'initial') {
        if (wrongIndices.length > 0) {
            startReviewPhase();
        } else {
            finishQuiz();
        }
    } else {
        if (remainingToFix.size > 0) {
            reviewQueue = Array.from(remainingToFix);
            currentIndex = 0;
            renderCurrentQuestion();
        } else {
            finishQuiz();
        }
    }
}

function startReviewPhase() {
    phase = 'review';
    reviewQueue = wrongIndices.slice();
    remainingToFix = new Set(wrongIndices);
    currentIndex = 0;
    renderCurrentQuestion();
}

function updateProgress() {
    const answeredFirstTime = questions.filter(q => q.firstAnswerIndex !== null).length;
    const percent = questions.length ? (answeredFirstTime / questions.length) * 100 : 0;
    document.getElementById('progress-fill').style.width = `${percent}%`;
}

function finishQuiz() {
    const total = questions.length;
    const correctOnFirstTry = questions.filter(q => q.firstAnswerCorrect === true).length;
    const summary = {
        totalQuestions: total,
        correctOnFirstTry,
        wrongOnFirstTry: total - correctOnFirstTry,
        questionSummaries: questions.map(q => ({
            id: q.id,
            question: q.question,
            firstAnswerIndex: q.firstAnswerIndex,
            firstAnswerCorrect: Boolean(q.firstAnswerCorrect),
            correctIndex: q.correctIndex
        }))
    };

    localStorage.setItem('quizSummary', JSON.stringify(summary));
    localStorage.setItem('quizQuestions', JSON.stringify(questions));
    window.location.href = 'result.html';
}
