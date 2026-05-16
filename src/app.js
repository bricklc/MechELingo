import { getLettersForSubject, greekLetters, subjects } from './data.js';
import { playCorrectSound, playWrongSound } from './sounds.js';
import { completeLesson, loadProgress, saveProgress } from './storage.js';

const app = document.querySelector('#app');
const state = {
  selectedSubject: 'machine-design',
  lessonStarted: false,
  lessonFinished: false,
  questionIndex: 0,
  selectedChoice: undefined,
  correctAnswers: 0,
  missedLetters: [],
  progress: loadProgress(),
  matchingMode: 'name',
  selectedLeft: undefined,
  selectedRight: undefined,
  matchedPairIds: [],
  pairFeedback: undefined,
  questions: [],
  pairs: [],
  rightColumn: [],
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const choiceFor = (letter, kind) => {
  if (kind === 'name') return letter.name;
  if (kind === 'meaning') return letter.primaryMeaning;
  return letter.usedIn;
};

const buildQuestions = (subjectId) => {
  const subjectLetters = getLettersForSubject(subjectId);
  const fallbackPool = greekLetters.filter((letter) => !letter.subjectIds.includes(subjectId));

  return shuffle(subjectLetters)
    .slice(0, 5)
    .map((letter, index) => {
      const kind = index % 3 === 0 ? 'name' : index % 3 === 1 ? 'meaning' : 'use';
      const correctChoice = choiceFor(letter, kind);
      const distractors = shuffle([...subjectLetters, ...fallbackPool])
        .filter((candidate) => candidate.id !== letter.id)
        .map((candidate) => choiceFor(candidate, kind))
        .filter((choice, choiceIndex, choices) => choices.indexOf(choice) === choiceIndex)
        .slice(0, 3);

      return {
        letter,
        kind,
        choices: shuffle([correctChoice, ...distractors]),
      };
    });
};

const buildPairs = (subjectId, mode) =>
  shuffle(getLettersForSubject(subjectId))
    .slice(0, 4)
    .map((letter) => ({
      id: letter.id,
      left: letter.symbol,
      right: mode === 'name' ? letter.name : letter.primaryMeaning,
    }));

const activeSubject = () =>
  subjects.find((subject) => subject.id === state.selectedSubject) ?? subjects[0];

const startLesson = () => {
  state.lessonStarted = true;
  state.lessonFinished = false;
  state.questionIndex = 0;
  state.selectedChoice = undefined;
  state.correctAnswers = 0;
  state.missedLetters = [];
  state.selectedLeft = undefined;
  state.selectedRight = undefined;
  state.matchedPairIds = [];
  state.pairFeedback = undefined;
  state.questions = buildQuestions(state.selectedSubject);
  state.pairs = buildPairs(state.selectedSubject, state.matchingMode);
  state.rightColumn = shuffle(state.pairs);
  render();
};

const finishLesson = () => {
  state.progress = completeLesson(state.progress);
  state.lessonFinished = true;
  render();
};

const toggleSound = () => {
  state.progress = { ...state.progress, soundEnabled: !state.progress.soundEnabled };
  saveProgress(state.progress);
  render();
};

const setSubject = (subjectId) => {
  state.selectedSubject = subjectId;
  render();
};

const setMatchingMode = (mode) => {
  state.matchingMode = mode;
  render();
};

const handleAnswer = (choice) => {
  const currentQuestion = state.questions[state.questionIndex];
  if (state.selectedChoice || !currentQuestion) return;

  const isCorrect = choice === choiceFor(currentQuestion.letter, currentQuestion.kind);
  state.selectedChoice = choice;

  if (isCorrect) {
    state.correctAnswers += 1;
    if (state.progress.soundEnabled) playCorrectSound();
  } else {
    state.missedLetters.push(currentQuestion.letter);
    if (state.progress.soundEnabled) playWrongSound();
  }

  render();
};

const nextQuestion = () => {
  state.selectedChoice = undefined;
  state.questionIndex += 1;
  render();
};

const handlePairSelect = (side, pairId) => {
  if (state.matchedPairIds.includes(pairId)) return;

  const nextLeft = side === 'left' ? pairId : state.selectedLeft;
  const nextRight = side === 'right' ? pairId : state.selectedRight;
  state.pairFeedback = undefined;
  state.selectedLeft = nextLeft;
  state.selectedRight = nextRight;

  if (!nextLeft || !nextRight) {
    render();
    return;
  }

  const isCorrect = nextLeft === nextRight;
  if (isCorrect) {
    state.matchedPairIds.push(nextLeft);
    state.correctAnswers += 1;
    state.pairFeedback = 'correct';
    if (state.progress.soundEnabled) playCorrectSound();
    if (state.matchedPairIds.length === state.pairs.length) {
      window.setTimeout(finishLesson, 600);
    }
  } else {
    state.pairFeedback = 'wrong';
    if (state.progress.soundEnabled) playWrongSound();
  }

  render();
  window.setTimeout(() => {
    state.selectedLeft = undefined;
    state.selectedRight = undefined;
    state.pairFeedback = undefined;
    render();
  }, 650);
};

const questionPrompt = (kind) => {
  if (kind === 'name') return 'What is this symbol called?';
  if (kind === 'meaning') return 'What does this usually mean in ME problems?';
  return 'Where is this commonly used?';
};

const subjectSelector = () => `
  <section class="subject-grid" aria-label="Choose a subject track">
    ${subjects
      .map(
        (subject) => `
          <button
            class="subject-card ${state.selectedSubject === subject.id ? 'selected' : ''}"
            data-subject="${subject.id}"
            style="--accent: ${subject.accent}"
            type="button"
          >
            <span class="subject-pill">${subject.shortTitle}</span>
            <h2>${subject.title}</h2>
            <p>${subject.description}</p>
            <small>${subject.examContext}</small>
          </button>
        `,
      )
      .join('')}
  </section>
`;

const lessonPreview = () => {
  const subject = activeSubject();
  const letters = getLettersForSubject(state.selectedSubject);

  return `
    <section class="lesson-preview">
      <h2>${subject.title} pilot lesson</h2>
      <p>
        Start with symbol names, meanings, and matching pairs. The current pilot uses
        ${letters.length} Greek-letter cards for this subject.
      </p>
      <div class="letter-strip">
        ${letters.map((letter) => `<span title="${letter.name}">${letter.symbol}</span>`).join('')}
      </div>
      <div class="mode-row">
        <button class="chip ${state.matchingMode === 'name' ? 'selected-chip' : ''}" data-mode="name" type="button">
          Match names
        </button>
        <button class="chip ${state.matchingMode === 'meaning' ? 'selected-chip' : ''}" data-mode="meaning" type="button">
          Match meanings
        </button>
      </div>
      <button class="primary-action" data-start type="button">Start lesson</button>
    </section>
  `;
};

const flashCard = () => {
  const subject = activeSubject();
  const currentQuestion = state.questions[state.questionIndex];
  const correctChoice = choiceFor(currentQuestion.letter, currentQuestion.kind);
  const progressPercent = Math.min(100, (state.questionIndex / (state.questions.length + 1)) * 100);

  return `
    <section class="lesson-card">
      <div class="progress-track"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
      <p class="eyebrow">${subject.shortTitle} · Flash card</p>
      <div class="symbol-card">${currentQuestion.letter.symbol}</div>
      <h2>${questionPrompt(currentQuestion.kind)}</h2>
      <div class="choices">
        ${currentQuestion.choices
          .map((choice) => {
            const isPicked = state.selectedChoice === choice;
            const isCorrect = state.selectedChoice && choice === correctChoice;
            const isWrong = isPicked && choice !== correctChoice;
            return `
              <button
                class="choice-card ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}"
                ${state.selectedChoice ? 'disabled' : ''}
                data-choice="${encodeURIComponent(choice)}"
                type="button"
              >${choice}</button>
            `;
          })
          .join('')}
      </div>
      ${
        state.selectedChoice
          ? `
            <div class="feedback-panel">
              <strong>${state.selectedChoice === correctChoice ? 'Correct!' : 'Not quite.'}</strong>
              <p>${currentQuestion.letter.detail}</p>
              <button class="primary-action" data-next type="button">Continue</button>
            </div>
          `
          : ''
      }
    </section>
  `;
};

const matchingRound = () => {
  const subject = activeSubject();
  const progressPercent = Math.min(100, (state.questionIndex / (state.questions.length + 1)) * 100);

  return `
    <section class="lesson-card">
      <div class="progress-track"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
      <p class="eyebrow">${subject.shortTitle} · Matching pairs</p>
      <h2>Match each symbol to its ${state.matchingMode === 'name' ? 'name' : 'meaning'}.</h2>
      <div class="matching-board ${state.pairFeedback ?? ''}">
        <div class="match-column">
          ${state.pairs
            .map(
              (pair) => `
                <button
                  class="match-card ${state.selectedLeft === pair.id ? 'active' : ''} ${
                    state.matchedPairIds.includes(pair.id) ? 'matched' : ''
                  }"
                  data-pair-left="${pair.id}"
                  type="button"
                >${pair.left}</button>
              `,
            )
            .join('')}
        </div>
        <div class="match-column">
          ${state.rightColumn
            .map(
              (pair) => `
                <button
                  class="match-card text ${state.selectedRight === pair.id ? 'active' : ''} ${
                    state.matchedPairIds.includes(pair.id) ? 'matched' : ''
                  }"
                  data-pair-right="${pair.id}"
                  type="button"
                >${pair.right}</button>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
};

const summary = () => `
  <section class="summary-card">
    <p class="eyebrow">Lesson complete</p>
    <h2>Nice work!</h2>
    <p class="score-line">You scored ${state.correctAnswers} correct actions across flash cards and matching pairs.</p>
    ${
      state.missedLetters.length > 0
        ? `<div class="missed-list"><h3>Review these next:</h3>${state.missedLetters
            .map((letter) => `<span>${letter.symbol} ${letter.name}</span>`)
            .join('')}</div>`
        : '<p class="perfect">Perfect flash-card round. Try matching meanings next.</p>'
    }
    <button class="primary-action" data-start type="button">Practice again</button>
    <button class="secondary-action" data-home type="button">Choose another subject</button>
  </section>
`;

const hero = () => `
  <section class="hero-card">
    <div class="top-bar">
      <div>
        <p class="eyebrow">Philippine ME board-style micro review</p>
        <h1>MechELingo</h1>
      </div>
      <button class="sound-toggle" data-toggle-sound type="button">
        ${state.progress.soundEnabled ? '🔔 Sound on' : '🔕 Muted'}
      </button>
    </div>
    <p class="intro-copy">
      Practice Greek letters and engineering terms in three subject tracks patterned after the PRC split:
      Power Plant Engineering, Mathematics, and Machine Design with Materials & Shop Practice.
    </p>
    <div class="stats-row" aria-label="Progress summary">
      <span>🔥 ${state.progress.streak} streak</span>
      <span>✅ ${state.progress.completedLessons} lessons</span>
    </div>
  </section>
`;

const bindEvents = () => {
  document.querySelectorAll('[data-subject]').forEach((button) => {
    button.addEventListener('click', () => setSubject(button.dataset.subject));
  });

  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => setMatchingMode(button.dataset.mode));
  });

  document.querySelectorAll('[data-choice]').forEach((button) => {
    button.addEventListener('click', () => handleAnswer(decodeURIComponent(button.dataset.choice)));
  });

  document.querySelectorAll('[data-pair-left]').forEach((button) => {
    button.addEventListener('click', () => handlePairSelect('left', button.dataset.pairLeft));
  });

  document.querySelectorAll('[data-pair-right]').forEach((button) => {
    button.addEventListener('click', () => handlePairSelect('right', button.dataset.pairRight));
  });

  document.querySelector('[data-start]')?.addEventListener('click', startLesson);
  document.querySelector('[data-next]')?.addEventListener('click', nextQuestion);
  document.querySelector('[data-toggle-sound]')?.addEventListener('click', toggleSound);
  document.querySelector('[data-home]')?.addEventListener('click', () => {
    state.lessonStarted = false;
    state.lessonFinished = false;
    render();
  });
};

const render = () => {
  const currentQuestion = state.questions[state.questionIndex];
  const isMatchingRound = state.lessonStarted && !state.lessonFinished && state.questionIndex === state.questions.length;

  app.innerHTML = `
    <main class="app-shell">
      ${hero()}
      ${!state.lessonStarted ? subjectSelector() + lessonPreview() : ''}
      ${state.lessonStarted && !state.lessonFinished && currentQuestion && !isMatchingRound ? flashCard() : ''}
      ${isMatchingRound ? matchingRound() : ''}
      ${state.lessonFinished ? summary() : ''}
    </main>
  `;

  bindEvents();
};

render();
