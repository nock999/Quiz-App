window.addEventListener('DOMContentLoaded', () => {
    const stored = localStorage.getItem('quizSummary');
    if (!stored) {
        window.location.href = 'index.html';
        return;
    }

    const summary = JSON.parse(stored);
    renderSummary(summary);

    const restartBtn = document.getElementById('restart-btn');
    const startOverBtn = document.getElementById('start-over');
    const goHome = () => window.location.href = 'index.html';
    restartBtn.addEventListener('click', goHome);
    startOverBtn.addEventListener('click', goHome);
});

function renderSummary(summary) {
    const container = document.getElementById('result-container');
    const { totalQuestions, correctOnFirstTry, wrongOnFirstTry, questionSummaries } = summary;

    container.innerHTML = '';

    const summarySection = document.createElement('section');
    summarySection.className = 'summary';

    const heading = document.createElement('h1');
    heading.textContent = `${correctOnFirstTry} / ${totalQuestions} correct on first try`;

    const correctPara = document.createElement('p');
    correctPara.textContent = `Correct on first try: ${correctOnFirstTry}`;

    const wrongPara = document.createElement('p');
    wrongPara.textContent = `Wrong on first try: ${wrongOnFirstTry}`;

    summarySection.append(heading, correctPara, wrongPara);

    const detailsSection = document.createElement('section');
    detailsSection.className = 'details';
    const detailsHeading = document.createElement('h2');
    detailsHeading.textContent = 'Question breakdown';
    const list = document.createElement('ul');
    list.className = 'question-list';

    questionSummaries.forEach(q => {
        const item = document.createElement('li');
        item.className = q.firstAnswerCorrect ? 'correct' : 'wrong';
        const strong = document.createElement('strong');
        strong.textContent = `${q.firstAnswerCorrect ? '✔' : '✖'} ${q.question}`;
        item.appendChild(strong);
        list.appendChild(item);
    });

    detailsSection.append(detailsHeading, list);
    container.append(summarySection, detailsSection);
}
