const createBtn = document.getElementById('create-btn');
const myTasksBtn = document.getElementById('my-tasks-btn');
const getStartedBtn = document.getElementById('get-started-btn');
const backToTasksBtn = document.getElementById('back-to-tasks-btn');
const logoHome = document.getElementById('logo-home');

const welcomeSection = document.getElementById('welcome-section');
const createSection = document.getElementById('create-section');
const tasksSection = document.getElementById('tasks-section');
const previewSection = document.getElementById('preview-section');

const typeButtons = document.querySelectorAll('.type-btn');
const quizCreator = document.getElementById('quiz-creator');
const matchCreator = document.getElementById('match-creator');
const wordsearchCreator = document.getElementById('wordsearch-creator');

const addQuestionBtn = document.getElementById('add-question-btn');
const saveQuizBtn = document.getElementById('save-quiz-btn');
const addPairBtn = document.getElementById('add-pair-btn');
const saveMatchBtn = document.getElementById('save-match-btn');
const addWordBtn = document.getElementById('add-word-btn');
const saveWordsearchBtn = document.getElementById('save-wordsearch-btn');

const quizQuestions = document.getElementById('quiz-questions');
const matchPairs = document.getElementById('match-pairs');
const wordsearchWords = document.getElementById('wordsearch-words');
const wordsearchGrid = document.getElementById('wordsearch-grid');
const taskList = document.getElementById('task-list');
const previewContainer = document.getElementById('preview-container');
const previewTitle = document.getElementById('preview-title');
const shareTaskBtn = document.getElementById('share-task-btn');
const shareOverlay = document.getElementById('share-overlay');
const shareUrl = document.getElementById('share-url');
const copyLinkBtn = document.getElementById('copy-link-btn');
const closeShareBtn = document.getElementById('close-share-btn');

let tasks = JSON.parse(localStorage.getItem('tapsyr-tasks')) || [];
let currentTask = null;

// Базовый URL для сохранения задания (Firebase Storage)
const SERVER_URL = 'https://firebasestorage.googleapis.com/v0/b/tapsyr-8e54a.appspot.com/o/';

function showSection(section) {
    welcomeSection.classList.remove('active-section');
    createSection.classList.remove('active-section');
    tasksSection.classList.remove('active-section');
    previewSection.classList.remove('active-section');
    
    welcomeSection.classList.add('hidden-section');
    createSection.classList.add('hidden-section');
    tasksSection.classList.add('hidden-section');
    previewSection.classList.add('hidden-section');
    
    section.classList.remove('hidden-section');
    section.classList.add('active-section');
}

createBtn.addEventListener('click', () => showSection(createSection));
myTasksBtn.addEventListener('click', () => {
    showSection(tasksSection);
    renderTaskList();
});
getStartedBtn.addEventListener('click', () => showSection(createSection));

// Add event listener for the bottom Get Started button
const getStartedBtnBottom = document.getElementById('get-started-btn-bottom');
if (getStartedBtnBottom) {
    getStartedBtnBottom.addEventListener('click', () => showSection(createSection));
}

// Добавляем обработчик для логотипа - возврат на главную страницу
logoHome.addEventListener('click', () => {
    showSection(welcomeSection);
});

// Add event listeners for activity type buttons in landing page
const activityButtons = document.querySelectorAll('.activity-btn');
activityButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Show create section
        showSection(createSection);
        
        // Get the activity type from button data attribute
        const activityType = button.getAttribute('data-type');
        if (activityType) {
            // Find and click the corresponding tab button
            const tabButton = document.querySelector(`.type-btn[data-type="${activityType}"]`);
            if (tabButton) {
                tabButton.click();
            }
        }
    });
});
backToTasksBtn.addEventListener('click', () => {
    showSection(tasksSection);
    renderTaskList();
});

// Task Type Selection
typeButtons.forEach(button => {
    button.addEventListener('click', () => {
        typeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const type = button.getAttribute('data-type');
        
        // Hide all task creators first
        quizCreator.classList.add('hidden');
        matchCreator.classList.add('hidden');
        wordsearchCreator.classList.add('hidden');
        
        // Show only the selected task creator
        if (type === 'quiz') {
            quizCreator.classList.remove('hidden');
        } else if (type === 'match') {
            matchCreator.classList.remove('hidden');
        } else if (type === 'wordsearch') {
            wordsearchCreator.classList.remove('hidden');
        }
    });
});

function addQuestion() {
    const questionId = Date.now();
    const questionHTML = `
        <div class="question-item" data-id="${questionId}">
            <button class="remove-btn"><i class="fas fa-times"></i></button>
            <input type="text" class="question-text" placeholder="Сұрағыңызды енгізіңіз...">
            <div class="option-list">
                <div class="option-item">
                    <input type="radio" name="correct-${questionId}" id="option1-${questionId}" checked>
                    <input type="text" placeholder="Нұсқа 1" class="option-text">
                </div>
                <div class="option-item">
                    <input type="radio" name="correct-${questionId}" id="option2-${questionId}">
                    <input type="text" placeholder="Нұсқа 2" class="option-text">
                </div>
                <div class="option-item">
                    <input type="radio" name="correct-${questionId}" id="option3-${questionId}">
                    <input type="text" placeholder="Нұсқа 3" class="option-text">
                </div>
                <div class="option-item">
                    <input type="radio" name="correct-${questionId}" id="option4-${questionId}">
                    <input type="text" placeholder="Нұсқа 4" class="option-text">
                </div>
            </div>
        </div>
    `;
    
    quizQuestions.insertAdjacentHTML('beforeend', questionHTML);
    
    const removeBtn = quizQuestions.querySelector(`.question-item[data-id="${questionId}"] .remove-btn`);
    removeBtn.addEventListener('click', () => {
        removeBtn.parentElement.remove();
    });
}

function saveQuiz() {
    const title = document.getElementById('quiz-title').value;
    const description = document.getElementById('quiz-description').value;
    
    if (!title) {
        alert('Викторина тақырыбын енгізіңіз');
        return;
    }
    
    const questionItems = quizQuestions.querySelectorAll('.question-item');
    if (questionItems.length === 0) {
        alert('Кем дегенде бір сұрақ қосыңыз');
        return;
    }
    
    const questions = [];
    
    questionItems.forEach(item => {
        const questionText = item.querySelector('.question-text').value;
        if (!questionText) return;
        
        const options = [];
        const questionId = item.getAttribute('data-id');
        const optionItems = item.querySelectorAll('.option-item');
        let correctIndex = 0;
        
        optionItems.forEach((optionItem, index) => {
            const optionText = optionItem.querySelector('.option-text').value;
            if (!optionText) return;
            
            options.push(optionText);
            
            const radioBtn = optionItem.querySelector(`input[type="radio"]`);
            if (radioBtn.checked) {
                correctIndex = index;
            }
        });
        
        if (options.length > 0) {
            questions.push({
                question: questionText,
                options: options,
                correctIndex: correctIndex
            });
        }
    });
    
    if (questions.length === 0) {
        alert('Нұсқалары бар жарамды сұрақтар қосыңыз');
        return;
    }
    
    const quiz = {
        id: Date.now(),
        type: 'quiz',
        title: title,
        description: description,
        questions: questions,
        date: new Date().toISOString()
    };
    
    tasks.push(quiz);
    saveTasksToLocalStorage();
    resetQuizCreator();
    showSection(tasksSection);
    renderTaskList();
}

function resetQuizCreator() {
    document.getElementById('quiz-title').value = '';
    document.getElementById('quiz-description').value = '';
    quizQuestions.innerHTML = '';
}

// Match-Up Creator Functions
function addPair() {
    const pairId = Date.now();
    const pairHTML = `
        <div class="pair-item" data-id="${pairId}">
            <button class="remove-btn"><i class="fas fa-times"></i></button>
            <div class="pair-inputs">
                <div class="term-container">
                    <div class="image-upload-container">
                        <label for="image-upload-${pairId}" class="image-upload-label">
                            <i class="fas fa-image"></i> Сурет жүктеу
                        </label>
                        <input type="file" id="image-upload-${pairId}" class="image-upload" accept="image/*">
                        <div class="image-preview"></div>
                    </div>
                    <input type="text" class="term-text" placeholder="Немесе терминді енгізіңіз... (міндетті емес)">
                </div>
                <input type="text" class="definition-text" placeholder="Анықтаманы енгізіңіз...">
            </div>
        </div>
    `;
    
    matchPairs.insertAdjacentHTML('beforeend', pairHTML);
    
    // Add event listener to remove button
    const removeBtn = matchPairs.querySelector(`.pair-item[data-id="${pairId}"] .remove-btn`);
    removeBtn.addEventListener('click', () => {
        removeBtn.parentElement.remove();
    });
    
    // Add event listener for image upload
    const imageUpload = matchPairs.querySelector(`#image-upload-${pairId}`);
    const imagePreview = matchPairs.querySelector(`.pair-item[data-id="${pairId}"] .image-preview`);
    
    imageUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Clear previous image preview
                imagePreview.innerHTML = '';
                
                // Create image element
                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-image');
                
                // Add remove button
                const removeImgBtn = document.createElement('button');
                removeImgBtn.classList.add('remove-image-btn');
                removeImgBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeImgBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    imagePreview.innerHTML = '';
                    imageUpload.value = '';
                });
                
                // Add to preview
                imagePreview.appendChild(img);
                imagePreview.appendChild(removeImgBtn);
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
}

function saveMatch() {
    const title = document.getElementById('match-title').value;
    const description = document.getElementById('match-description').value;
    
    if (!title) {
        alert('Сәйкестендіру тапсырмасы үшін тақырып енгізіңіз');
        return;
    }
    
    const pairItems = matchPairs.querySelectorAll('.pair-item');
    if (pairItems.length === 0) {
        alert('Кем дегенде бір жұп қосыңыз');
        return;
    }
    
    const pairs = [];
    
    pairItems.forEach(item => {
        const term = item.querySelector('.term-text').value;
        const definition = item.querySelector('.definition-text').value;
        const imagePreview = item.querySelector('.image-preview img');
        const imageData = imagePreview ? imagePreview.src : null;
        
        // Разрешаем добавлять элементы, если есть хотя бы изображение или термин, и определение
        // Изображение может быть без термина, но определение всегда обязательно
        if ((imageData || term) && definition) {
            pairs.push({
                term: term || '',  // Если термин не указан, сохраняем пустую строку
                definition: definition,
                imageData: imageData
            });
        }
    });
    
    if (pairs.length === 0) {
        alert('Терминдері мен анықтамалары бар жарамды жұптар қосыңыз');
        return;
    }
    
    const match = {
        id: Date.now(),
        type: 'match',
        title: title,
        description: description,
        pairs: pairs,
        hasImages: pairs.some(pair => pair.imageData),
        date: new Date().toISOString()
    };
    
    tasks.push(match);
    saveTasksToLocalStorage();
    resetMatchCreator();
    showSection(tasksSection);
    renderTaskList();
}

function resetMatchCreator() {
    document.getElementById('match-title').value = '';
    document.getElementById('match-description').value = '';
    matchPairs.innerHTML = '';
}

function addWord() {
    const wordId = Date.now();
    const wordHTML = `
        <div class="word-item" data-id="${wordId}">
            <button class="remove-btn"><i class="fas fa-times"></i></button>
            <div class="qa-pair">
                <input type="text" class="question-text" placeholder="Сұрақты енгізіңіз...">
                <input type="text" class="answer-text" placeholder="Жауапты енгізіңіз...">
            </div>
        </div>
    `;
    
    wordsearchWords.insertAdjacentHTML('beforeend', wordHTML);
    
    const removeBtn = wordsearchWords.querySelector(`.word-item[data-id="${wordId}"] .remove-btn`);
    removeBtn.addEventListener('click', () => {
        removeBtn.parentElement.remove();
    });
}

function saveWordsearch() {
    const title = document.getElementById('wordsearch-title').value;
    const description = document.getElementById('wordsearch-description').value;
    
    if (!title) {
        alert('Сұрақ-жауап тапсырмасы үшін тақырып енгізіңіз');
        return;
    }
    
    const wordItems = wordsearchWords.querySelectorAll('.word-item');
    if (wordItems.length === 0) {
        alert('Кем дегенде бір сұрақ-жауап жұбын қосыңыз');
        return;
    }
    
    const qaPairs = [];
    wordItems.forEach(item => {
        const question = item.querySelector('.question-text').value.trim();
        const answer = item.querySelector('.answer-text').value.trim();
        
        if (question && answer) {
            qaPairs.push({ question, answer });
        }
    });
    
    if (qaPairs.length === 0) {
        alert('Сұрақтары мен жауаптары бар жарамды жұптар қосыңыз');
        return;
    }
    
    const wordsearch = {
        id: Date.now(),
        type: 'wordsearch',
        title: title,
        description: description,
        qaPairs: qaPairs,
        date: new Date().toISOString()
    };
    
    tasks.push(wordsearch);
    saveTasksToLocalStorage();
    resetWordsearchCreator();
    showSection(tasksSection);
    renderTaskList();
}

function resetWordsearchCreator() {
    document.getElementById('wordsearch-title').value = '';
    document.getElementById('wordsearch-description').value = '';
    wordsearchWords.innerHTML = '';
}

// Task Management Functions
function saveTasksToLocalStorage() {
    localStorage.setItem('tapsyr-tasks', JSON.stringify(tasks));
}

function renderTaskList() {
    if (tasks.length === 0) {
        taskList.innerHTML = '<p class="empty-message">Әлі тапсырмалар жасалмаған.</p>';
        return;
    }
    
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const date = new Date(task.date).toLocaleDateString();
        const taskHTML = `
            <div class="task-card" data-id="${task.id}">
                <span class="task-type type-${task.type}">${task.type === 'quiz' ? 'Викторина' : task.type === 'match' ? 'Сәйкестендіру' : 'Сөзді іздеу'}</span>
                <h3>${task.title}</h3>
                <p>${task.description.substring(0, 60)}${task.description.length > 60 ? '...' : ''}</p>
                <p class="task-date">Жасалған күні: ${date}</p>
            </div>
        `;
        
        taskList.insertAdjacentHTML('beforeend', taskHTML);
    });
    
    // Add event listeners to task cards
    const taskCards = taskList.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        card.addEventListener('click', () => {
            const taskId = parseInt(card.getAttribute('data-id'));
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                previewTask(task);
            }
        });
    });
}

function previewTask(task) {
    currentTask = task;
    previewTitle.textContent = task.title;
    
    if (task.type === 'quiz') {
        previewQuiz(task);
    } else if (task.type === 'match') {
        previewMatch(task);
    } else if (task.type === 'wordsearch') {
        previewWordsearch(task);
    }
    
    // Добавим обработчик для кнопки "Бөлісу" здесь, чтобы гарантировать его активацию
    if (shareTaskBtn) {
        shareTaskBtn.onclick = async function() {
            console.log('Кнопка Бөлісу нажата, текущее задание:', currentTask);
            if (currentTask) {
                try {
                    // Прямой вызов к API-клиенту, минуя промежуточные функции
                    const result = await saveTaskToDatabase(currentTask);
                    console.log('Результат сохранения:', result);
                    
                    if (result.success) {
                        shareUrl.value = result.shareUrl;
                        shareOverlay.classList.remove('hidden');
                        console.log('Показываем оверлей с URL:', result.shareUrl);
                    } else {
                        console.error('Не удалось создать ссылку:', result.error);
                        alert('Не удалось создать ссылку: ' + result.error);
                    }
                } catch (error) {
                    console.error("Ошибка при шаринге:", error);
                    alert('Ошибка: ' + error.message);
                }
            } else {
                alert('Нет активного задания для шаринга');
            }
        };
    }
    
    // Также инициализируем другие кнопки шаринга
    if (copyLinkBtn) {
        copyLinkBtn.onclick = function() {
            shareUrl.select();
            document.execCommand('copy');
            copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        };
    }
    
    if (closeShareBtn) {
        closeShareBtn.onclick = function() {
            shareOverlay.classList.add('hidden');
        };
    }
    
    if (shareOverlay) {
        shareOverlay.onclick = function(e) {
            if (e.target === shareOverlay) {
                shareOverlay.classList.add('hidden');
            }
        };
    }
    
    showSection(previewSection);
}

function previewQuiz(quiz) {
    let quizHTML = '<div class="quiz-preview">';
    
    quiz.questions.forEach((question, index) => {
        quizHTML += `
            <div class="question" data-correct="${question.correctIndex}">
                <h3>Q${index + 1}. ${question.question}</h3>
                <ul class="options">
        `;
        
        question.options.forEach((option, optIndex) => {
            quizHTML += `
                <li class="option" data-index="${optIndex}">${option}</li>
            `;
        });
        
        quizHTML += `
                </ul>
                <p class="feedback"></p>
            </div>
        `;
    });
    
    quizHTML += `
        <div class="submit-section">
            <button id="submit-quiz-btn" class="primary-btn">Тапсыру</button>
            <div class="score-display" style="display: none;">
                <h3>Жалпы ұпайлар: <span id="score">0</span>/<span id="total">0</span></h3>
            </div>
        </div>`;
    
    quizHTML += '</div>';
    
    previewContainer.innerHTML = quizHTML;
    
    // Add event listeners to options
    const questions = previewContainer.querySelectorAll('.question');
    let isSubmitted = false;
    
    questions.forEach((questionEl, qIndex) => {
        const options = questionEl.querySelectorAll('.option');
        const feedback = questionEl.querySelector('.feedback');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                if (isSubmitted) return; // Disable selection after submission
                
                // Remove previous selection
                options.forEach(opt => opt.classList.remove('selected'));
                
                // Add selection to clicked option
                option.classList.add('selected');
                
                // Clear feedback when changing selection
                feedback.textContent = '';
            });
        });
    });
    
    // Add submit button functionality
    const submitBtn = document.getElementById('submit-quiz-btn');
    submitBtn.addEventListener('click', () => {
        if (isSubmitted) return;
        
        isSubmitted = true;
        let score = 0;
        
        questions.forEach((questionEl, qIndex) => {
            const options = questionEl.querySelectorAll('.option');
            const feedback = questionEl.querySelector('.feedback');
            const correctIndex = parseInt(questionEl.getAttribute('data-correct'));
            
            // Find selected option
            let selectedOption = null;
            let selectedIndex = -1;
            
            options.forEach((opt, idx) => {
                if (opt.classList.contains('selected')) {
                    selectedOption = opt;
                    selectedIndex = idx;
                }
                
                if (idx === correctIndex) {
                    opt.classList.add('correct');
                }
            });
            
            if (selectedIndex === -1) {
                feedback.textContent = 'Таңдалмаған';
                feedback.style.color = '#ff9800';
            } else if (selectedIndex === correctIndex) {
                feedback.textContent = 'Дұрыс!';
                feedback.style.color = '#38b2ac';
                score++;
            } else {
                feedback.textContent = 'Дұрыс емес';
                feedback.style.color = '#ff6b6b';
                selectedOption.classList.add('incorrect');
            }
        });
        
        // Show score
        const scoreDisplay = document.querySelector('.score-display');
        const scoreElement = document.getElementById('score');
        const totalElement = document.getElementById('total');
        
        scoreElement.textContent = score;
        totalElement.textContent = questions.length;
        scoreDisplay.style.display = 'block';
        
        submitBtn.textContent = 'Тапсырылды';
        submitBtn.disabled = true;
    });
}

function previewMatch(match) {
    const pairs = [...match.pairs];
    const userSelections = [];
    const hasImages = match.hasImages || pairs.some(pair => pair.imageData);
    
    let matchHTML = '<div class="match-preview">';
    
    if (hasImages) {
        matchHTML += '<div class="match-instructions">Термин немесе суретті таңдап, одан кейін оған сәйкес келетін жауапты таңдаңыз. Дұрыс та, қате де сәйкестерді таңдауға болады.</div>';
    } else {
        matchHTML += '<div class="match-instructions">Терминді таңдап, одан кейін оған сәйкес анықтаманы таңдаңыз. Дұрыс та, қате де сәйкестерді таңдауға болады.</div>';
    }
    
    matchHTML += '<div class="match-container">';
    
    // First column: terms or images
    matchHTML += '<div class="match-column terms-column">';
    
    if (hasImages) {
        matchHTML += `<h3 class="column-title">Сурет немесе Термин</h3>`;
        
        pairs.forEach((pair, index) => {
            if (pair.imageData) {
                // Если есть изображение
                matchHTML += `
                    <div class="match-item term image-item" data-pair-id="${index}">
                        <img src="${pair.imageData}" alt="${pair.term || 'Изображение'}" class="match-image">
                        ${pair.term ? `<div class="image-term">${pair.term}</div>` : ''}
                    </div>
                `;
            } else if (pair.term) {
                // Если есть только термин
                matchHTML += `
                    <div class="match-item term" data-pair-id="${index}">${pair.term}</div>
                `;
            }
        });
    } else {
        matchHTML += `<h3 class="column-title">Терминдер</h3>`;
        
        pairs.forEach((pair, index) => {
            matchHTML += `
                <div class="match-item term" data-pair-id="${index}">${pair.term}</div>
            `;
        });
    }
    
    matchHTML += '</div>';
    
    // Second column: definitions or terms (depending on the match type)
    matchHTML += '<div class="match-column definitions-column">';
    matchHTML += `<h3 class="column-title">Анықтамалар</h3>`;
    
    const shuffledDefs = [...pairs];
    for (let i = shuffledDefs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDefs[i], shuffledDefs[j]] = [shuffledDefs[j], shuffledDefs[i]];
    }
    
    shuffledDefs.forEach((pair, index) => {
        const originalIndex = pairs.findIndex(p => p.definition === pair.definition);
        matchHTML += `
            <div class="match-item definition" data-original-id="${originalIndex}">${pair.definition}</div>
        `;
    });
    matchHTML += '</div>';
    
    matchHTML += '</div>';
    
    matchHTML += `
        <div class="submit-section">
            <button id="submit-match-btn" class="primary-btn">Жауаптарды тексеру</button>
        </div>
    `;
    
    matchHTML += `
        <div class="match-results" style="display: none;">
            <h3>Дұрыс сәйкестіктер: <span id="match-score">0</span>/<span id="match-total">${pairs.length}</span></h3>
        </div>
    `;
    
    matchHTML += '</div>';
    
    previewContainer.innerHTML = matchHTML;
    
    // Add event listeners for matching
    const terms = previewContainer.querySelectorAll('.term');
    const definitions = previewContainer.querySelectorAll('.definition');
    const submitButton = document.getElementById('submit-match-btn');
    let selectedTerm = null;
    
    // Add click event to terms
    terms.forEach(term => {
        term.addEventListener('click', () => {
            // Skip if already connected
            if (term.classList.contains('connected')) return;
            
            // Deselect any previously selected term
            terms.forEach(t => t.classList.remove('selected'));
            
            // Select this term
            term.classList.add('selected');
            selectedTerm = term;
        });
    });
    
    // Add click event to definitions
    definitions.forEach(definition => {
        definition.addEventListener('click', () => {
            // Skip if already connected or no term selected
            if (definition.classList.contains('connected') || !selectedTerm) return;
            
            const termPairId = parseInt(selectedTerm.getAttribute('data-pair-id'));
            const defOriginalId = parseInt(definition.getAttribute('data-original-id'));
            
            // Remove any previous connection for this term
            const prevConnection = userSelections.find(sel => sel.termId === termPairId);
            if (prevConnection) {
                // Remove visual connection
                const prevTermElement = document.querySelector(`.term[data-pair-id="${prevConnection.termId}"]`);
                const prevDefElement = document.querySelector(`.definition[data-original-id="${prevConnection.defId}"]`);
                
                prevTermElement.classList.remove(`user-match-${prevConnection.termId}`);
                prevDefElement.classList.remove(`user-match-${prevConnection.termId}`);
                prevDefElement.classList.remove('connected');
                
                // Remove from user selections
                userSelections.splice(userSelections.findIndex(sel => sel.termId === termPairId), 1);
            }
            
            // Make visual connection
            selectedTerm.classList.add(`user-match-${termPairId}`);
            definition.classList.add(`user-match-${termPairId}`);
            
            // Mark as connected
            selectedTerm.classList.add('connected');
            definition.classList.add('connected');
            
            // Store the selection
            userSelections.push({
                termId: termPairId,
                defId: defOriginalId,
                isCorrect: termPairId === defOriginalId
            });
            
            // Reset selected term
            selectedTerm.classList.remove('selected');
            selectedTerm = null;
        });
    });
    
    // Submit button event
    submitButton.addEventListener('click', () => {
        // Count correct answers
        const correctCount = userSelections.filter(sel => sel.isCorrect).length;
        
        // Disable further changes
        terms.forEach(term => {
            term.classList.add('disabled');
        });
        
        definitions.forEach(def => {
            def.classList.add('disabled');
        });
        
        // Show visual feedback for correct/incorrect answers
        userSelections.forEach(selection => {
            const termElement = document.querySelector(`.term[data-pair-id="${selection.termId}"]`);
            const defElement = document.querySelector(`.definition[data-original-id="${selection.defId}"]`);
            
            if (selection.isCorrect) {
                termElement.classList.add('correct-match');
                defElement.classList.add('correct-match');
            } else {
                termElement.classList.add('incorrect-match');
                defElement.classList.add('incorrect-match');
            }
        });
        
        // Show all correct pairs that weren't selected
        pairs.forEach((pair, index) => {
            const selection = userSelections.find(sel => sel.termId === index);
            
            // If this pair wasn't selected or was selected incorrectly
            if (!selection || !selection.isCorrect) {
                const correctDefId = index;
                const correctDef = document.querySelector(`.definition[data-original-id="${correctDefId}"]`);
                
                // Add a visual hint to show the correct answer
                correctDef.classList.add('correct-hint');
            }
        });
        
        // Show results
        const matchResults = document.querySelector('.match-results');
        matchResults.style.display = 'block';
        document.getElementById('match-score').textContent = correctCount;
        
        submitButton.style.display = 'none';
        
        const percentage = (correctCount / pairs.length) * 100;
        let messageText = '';
        
        if (percentage === 100) {
            messageText = 'Керемет! Барлық сәйкестіктерді дұрыс таптыңыз!';
        } else if (percentage >= 70) {
            messageText = 'Жақсы жұмыс! Көптеген сәйкестіктерді дұрыс таптыңыз.';
        } else {
            messageText = 'Тағы да жаттығу керек. Қайталап көріңіз!';
        }
        
        const completionMessage = document.createElement('div');
        completionMessage.className = 'completion-message';
        completionMessage.innerHTML = `<h3>${messageText}</h3>`;
        document.querySelector('.match-preview').appendChild(completionMessage);
    });
}

function previewWordsearch(wordsearch) {
    let qaHTML = '<div class="qa-preview">';
    qaHTML += '<div class="qa-instructions">Сұрақтарға жауап беріңіз және тексеру үшін тапсырыңыз</div>';
    
    qaHTML += '<form id="qa-form" class="qa-form">';
    
    wordsearch.qaPairs.forEach((pair, index) => {
        qaHTML += `
            <div class="qa-item" data-index="${index}">
                <div class="question">
                    <h3>${index + 1}. ${pair.question}</h3>
                    <input type="text" class="answer-input" placeholder="Жауапты енгізіңіз...">
                    <div class="feedback"></div>
                </div>
            </div>
        `;
    });
    
    qaHTML += `
        <div class="submit-section">
            <button type="button" id="check-answers-btn" class="primary-btn">Жауаптарды тексеру</button>
            <div class="score-display" style="display: none;">
                <h3>Жалпы ұпайлар: <span id="qa-score">0</span>/<span id="qa-total">${wordsearch.qaPairs.length}</span></h3>
            </div>
        </div>
    `;
    
    qaHTML += '</form>';
    qaHTML += '</div>';
    
    previewContainer.innerHTML = qaHTML;
    
    const checkButton = document.getElementById('check-answers-btn');
    const qaItems = document.querySelectorAll('.qa-item');
    let isSubmitted = false;
    
    checkButton.addEventListener('click', () => {
        if (isSubmitted) return;
        
        isSubmitted = true;
        let score = 0;
        
        qaItems.forEach((item, index) => {
            const input = item.querySelector('.answer-input');
            const feedback = item.querySelector('.feedback');
            const userAnswer = input.value.trim().toLowerCase();
            const correctAnswer = wordsearch.qaPairs[index].answer.toLowerCase();
            
            if (userAnswer === correctAnswer) {
                feedback.textContent = 'Дұрыс!';
                feedback.className = 'feedback correct';
                input.classList.add('correct-answer');
                score++;
            } else {
                feedback.textContent = `Дұрыс емес. Дұрыс жауап: ${wordsearch.qaPairs[index].answer}`;
                feedback.className = 'feedback incorrect';
                input.classList.add('incorrect-answer');
            }
            
            input.disabled = true;
        });
        
        // Show score
        const scoreDisplay = document.querySelector('.score-display');
        const scoreElement = document.getElementById('qa-score');
        
        scoreElement.textContent = score;
        scoreDisplay.style.display = 'block';
        
        checkButton.textContent = 'Тексерілді';
        checkButton.disabled = true;
        
        // Show completion message based on score
        const percentage = (score / wordsearch.qaPairs.length) * 100;
        let messageText = '';
        
        if (percentage === 100) {
            messageText = 'Тамаша! Барлық сұрақтарға дұрыс жауап бердіңіз!';
        } else if (percentage >= 70) {
            messageText = 'Жақсы жұмыс! Көптеген сұрақтарға дұрыс жауап бердіңіз.';
        } else {
            messageText = 'Тағы да жаттығыңыз керек. Қайталап көріңіз!';
        }
        
        const completionMessage = document.createElement('div');
        completionMessage.className = 'completion-message';
        completionMessage.innerHTML = `<h3>${messageText}</h3>`;
        document.querySelector('.qa-preview').appendChild(completionMessage);
    });
}

// Event Listeners
addQuestionBtn.addEventListener('click', addQuestion);
saveQuizBtn.addEventListener('click', saveQuiz);
addPairBtn.addEventListener('click', addPair);
saveMatchBtn.addEventListener('click', saveMatch);
addWordBtn.addEventListener('click', addWord);
saveWordsearchBtn.addEventListener('click', saveWordsearch);

// Ensure only the active task creator is visible on page load
function initializeTaskCreators() {
    // Find the active tab
    const activeTab = document.querySelector('.type-btn.active');
    if (activeTab) {
        const activeType = activeTab.getAttribute('data-type');
        
        // Hide all task creators
        quizCreator.classList.add('hidden');
        matchCreator.classList.add('hidden');
        wordsearchCreator.classList.add('hidden');
        
        // Show only the selected one
        if (activeType === 'quiz') {
            quizCreator.classList.remove('hidden');
        } else if (activeType === 'match') {
            matchCreator.classList.remove('hidden');
        } else if (activeType === 'wordsearch') {
            wordsearchCreator.classList.remove('hidden');
        }
    }
}

// Инициализация с некоторыми стандартными вопросами/парами
addQuestion();
addPair();
addWord();

// Начальная визуализация списка заданий
renderTaskList();

// Инициализация создателей задач
initializeTaskCreators();

// Проверяем URL для загрузки шаренного задания
checkForSharedTask();
