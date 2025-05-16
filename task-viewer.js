// JavaScript для отображения отдельных заданий
document.addEventListener('DOMContentLoaded', async function() {
    // Получаем ID задания из URL
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');
    
    if (!taskId) {
        showNotFound();
        return;
    }
    
    try {
        // Пробуем загрузить задание
        const result = await loadTaskFromDatabase(taskId);
        
        if (!result.success) {
            showNotFound();
            return;
        }
        
        const task = result.task;
        
        // Обработка изображений, если они есть
        if (task.type === 'match' && task.hasReferencedImages && task.pairs) {
            // Загружаем хранилище изображений
            const imageStorage = JSON.parse(localStorage.getItem('tapsyr-shared-images') || '{}');
            
            task.pairs.forEach((pair) => {
                if (pair.isImageReference && typeof pair.imageData === 'string') {
                    // Восстанавливаем изображение из хранилища
                    const imageId = pair.imageData;
                    if (imageStorage[imageId]) {
                        pair.imageData = imageStorage[imageId];
                        pair.isImageReference = false;
                    }
                }
            });
        }
        
        // Настраиваем заголовок страницы
        document.title = `${task.title} - Tapsyr`;
        
        // Отображаем задание
        renderTask(task);
        
        // Настраиваем кнопку шаринга
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                shareTask(task);
            });
        }
    } catch (error) {
        console.error('Ошибка при загрузке задания:', error);
        showNotFound();
    }
    
    // Настройка диалога шаринга
    const closeShareBtn = document.getElementById('close-share-btn');
    const shareOverlay = document.getElementById('share-overlay');
    
    if (closeShareBtn && shareOverlay) {
        closeShareBtn.addEventListener('click', function() {
            shareOverlay.classList.add('hidden');
        });
        
        // Закрываем при клике вне диалога
        shareOverlay.addEventListener('click', function(e) {
            if (e.target === shareOverlay) {
                shareOverlay.classList.add('hidden');
            }
        });
    }
    
    // Настраиваем кнопку копирования
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const shareUrl = document.getElementById('share-url');
    
    if (copyLinkBtn && shareUrl) {
        copyLinkBtn.addEventListener('click', function() {
            shareUrl.select();
            document.execCommand('copy');
            
            copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    }
});

// Функция для отображения ошибки "не найдено"
function showNotFound() {
    const loadingElement = document.getElementById('loading');
    const notFoundElement = document.getElementById('not-found');
    
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
    
    if (notFoundElement) {
        notFoundElement.classList.remove('hidden');
    }
}

// Функция для отображения задания
function renderTask(task) {
    const loadingElement = document.getElementById('loading');
    const taskContentElement = document.getElementById('task-content');
    
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
    
    if (taskContentElement) {
        taskContentElement.classList.remove('hidden');
        
        // Создаем HTML для задания в зависимости от его типа
        let taskHTML = `
            <div class="task-header">
                <h2>${task.title}</h2>
                <p class="task-description">${task.description || ''}</p>
            </div>
        `;
        
        // Добавляем содержимое в зависимости от типа задания
        if (task.type === 'quiz') {
            taskHTML += renderQuiz(task);
        } else if (task.type === 'match') {
            taskHTML += renderMatch(task);
        } else if (task.type === 'wordsearch') {
            taskHTML += renderWordsearch(task);
        }
        
        taskContentElement.innerHTML = taskHTML;
        
        // Добавляем интерактивность в зависимости от типа задания
        if (task.type === 'quiz') {
            initQuizInteractivity(task);
        } else if (task.type === 'match') {
            initMatchInteractivity(task);
        } else if (task.type === 'wordsearch') {
            initWordsearchInteractivity(task);
        }
    }
}

// Функция для отображения викторины
function renderQuiz(task) {
    let html = '<div class="quiz-container">';
    
    if (task.questions && task.questions.length > 0) {
        task.questions.forEach((question, questionIndex) => {
            html += `
                <div class="quiz-question" data-question-index="${questionIndex}">
                    <div class="question-header">
                        <span class="question-number">${questionIndex + 1}</span>
                        <h3>${question.question}</h3>
                    </div>
                    <div class="options-container">
            `;
            
            // Добавляем варианты ответов
            if (question.options && question.options.length > 0) {
                question.options.forEach((option, optionIndex) => {
                    html += `
                        <div class="option" data-option-index="${optionIndex}">
                            <input type="radio" id="q${questionIndex}_o${optionIndex}" name="q${questionIndex}" value="${optionIndex}">
                            <label for="q${questionIndex}_o${optionIndex}">${option}</label>
                        </div>
                    `;
                });
            }
            
            html += `
                    </div>
                    <div class="feedback hidden"></div>
                </div>
            `;
        });
        
        html += `
            <div class="quiz-controls">
                <button id="check-answers-btn" class="primary-btn">Жауаптарды тексеру</button>
                <div class="quiz-results hidden">
                    <h3>Нәтижелер</h3>
                    <div class="results-info"></div>
                </div>
            </div>
        `;
    } else {
        html += '<p class="empty-message">Бұл викторинада сұрақтар жоқ.</p>';
    }
    
    html += '</div>';
    return html;
}

// Функция для отображения сопоставления
function renderMatch(task) {
    let html = '<div class="match-container">';
    
    if (task.pairs && task.pairs.length > 0) {
        html += `
            <div class="match-instructions">
                <p>Сол жақтағы элементтерді оң жақтағы сәйкес элементтермен жұптастырыңыз.</p>
            </div>
            <div class="match-game">
                <div class="match-items left-items">
        `;
        
        // Добавляем левые элементы
        task.pairs.forEach((pair, index) => {
            html += `
                <div class="match-item" data-index="${index}" data-side="left">
                    ${pair.imageData && !pair.isImageReference ? 
                        `<img src="${pair.imageData}" alt="${pair.left}" class="match-image">` : 
                        `<p>${pair.left}</p>`}
                </div>
            `;
        });
        
        html += `
                </div>
                <div class="match-items right-items">
        `;
        
        // Перемешиваем и добавляем правые элементы
        const shuffledPairs = [...task.pairs].sort(() => Math.random() - 0.5);
        shuffledPairs.forEach((pair, index) => {
            const originalIndex = task.pairs.findIndex(p => p.left === pair.left && p.right === pair.right);
            html += `
                <div class="match-item" data-index="${originalIndex}" data-side="right">
                    <p>${pair.right}</p>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
            <div class="match-controls">
                <button id="check-matches-btn" class="primary-btn">Жауаптарды тексеру</button>
                <div class="match-results hidden">
                    <h3>Нәтижелер</h3>
                    <div class="results-info"></div>
                </div>
            </div>
        `;
    } else {
        html += '<p class="empty-message">Бұл тапсырмада жұптар жоқ.</p>';
    }
    
    html += '</div>';
    return html;
}

// Функция для отображения вопрос-ответ
function renderWordsearch(task) {
    let html = '<div class="wordsearch-container">';
    
    if (task.questions && task.questions.length > 0) {
        task.questions.forEach((item, index) => {
            html += `
                <div class="wordsearch-item" data-index="${index}">
                    <div class="question-header">
                        <span class="question-number">${index + 1}</span>
                        <h3>${item.question}</h3>
                    </div>
                    <div class="answer-container">
                        <input type="text" class="answer-input" placeholder="Жауабыңызды енгізіңіз..." data-index="${index}">
                        <div class="feedback hidden"></div>
                    </div>
                </div>
            `;
        });
        
        html += `
            <div class="wordsearch-controls">
                <button id="check-wordsearch-btn" class="primary-btn">Жауаптарды тексеру</button>
                <div class="wordsearch-results hidden">
                    <h3>Нәтижелер</h3>
                    <div class="results-info"></div>
                </div>
            </div>
        `;
    } else {
        html += '<p class="empty-message">Бұл тапсырмада сұрақтар жоқ.</p>';
    }
    
    html += '</div>';
    return html;
}

// Функция для инициализации интерактивности викторины
function initQuizInteractivity(task) {
    const checkAnswersBtn = document.getElementById('check-answers-btn');
    
    if (checkAnswersBtn) {
        checkAnswersBtn.addEventListener('click', function() {
            // Проверяем ответы
            let correctCount = 0;
            
            task.questions.forEach((question, questionIndex) => {
                const questionElement = document.querySelector(`.quiz-question[data-question-index="${questionIndex}"]`);
                const feedbackElement = questionElement.querySelector('.feedback');
                const selectedOption = questionElement.querySelector(`input[name="q${questionIndex}"]:checked`);
                
                if (feedbackElement) {
                    feedbackElement.classList.remove('hidden', 'correct', 'incorrect');
                    
                    if (selectedOption) {
                        const selectedIndex = parseInt(selectedOption.value);
                        if (selectedIndex === question.correctIndex) {
                            feedbackElement.textContent = 'Дұрыс!';
                            feedbackElement.classList.add('correct');
                            correctCount++;
                        } else {
                            feedbackElement.textContent = `Дұрыс емес. Дұрыс жауап: ${question.options[question.correctIndex]}`;
                            feedbackElement.classList.add('incorrect');
                        }
                    } else {
                        feedbackElement.textContent = 'Жауап таңдалған жоқ.';
                        feedbackElement.classList.add('incorrect');
                    }
                    
                    feedbackElement.classList.remove('hidden');
                }
            });
            
            // Показываем результаты
            const resultsElement = document.querySelector('.quiz-results');
            const resultsInfoElement = document.querySelector('.results-info');
            
            if (resultsElement && resultsInfoElement) {
                const percentage = Math.round((correctCount / task.questions.length) * 100);
                resultsInfoElement.innerHTML = `
                    <p>Дұрыс жауаптар: ${correctCount} / ${task.questions.length} (${percentage}%)</p>
                `;
                
                resultsElement.classList.remove('hidden');
            }
        });
    }
}

// Функция для инициализации интерактивности сопоставления
function initMatchInteractivity(task) {
    const matchItems = document.querySelectorAll('.match-item');
    let selectedItem = null;
    const connections = new Map();
    
    // Добавляем обработчики для элементов
    matchItems.forEach(item => {
        item.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const side = this.dataset.side;
            
            if (selectedItem) {
                const selectedIndex = parseInt(selectedItem.dataset.index);
                const selectedSide = selectedItem.dataset.side;
                
                if (selectedSide !== side) {
                    // Соединяем элементы
                    if (selectedSide === 'left') {
                        connections.set(selectedIndex, index);
                    } else {
                        connections.set(index, selectedIndex);
                    }
                    
                    // Добавляем визуальное выделение
                    this.classList.add('connected');
                    selectedItem.classList.add('connected');
                    
                    // Сбрасываем выбранный элемент
                    selectedItem.classList.remove('selected');
                    selectedItem = null;
                } else {
                    // Выбрали элемент с той же стороны
                    selectedItem.classList.remove('selected');
                    this.classList.add('selected');
                    selectedItem = this;
                }
            } else {
                // Выбираем элемент
                this.classList.add('selected');
                selectedItem = this;
            }
        });
    });
    
    // Настраиваем кнопку проверки
    const checkMatchesBtn = document.getElementById('check-matches-btn');
    
    if (checkMatchesBtn) {
        checkMatchesBtn.addEventListener('click', function() {
            let correctCount = 0;
            
            // Проверяем каждую пару
            for (let i = 0; i < task.pairs.length; i++) {
                const matchedIndex = connections.get(i);
                
                if (matchedIndex !== undefined && matchedIndex === i) {
                    correctCount++;
                }
            }
            
            // Показываем результаты
            const resultsElement = document.querySelector('.match-results');
            const resultsInfoElement = document.querySelector('.results-info');
            
            if (resultsElement && resultsInfoElement) {
                const percentage = Math.round((correctCount / task.pairs.length) * 100);
                resultsInfoElement.innerHTML = `
                    <p>Дұрыс жұптар: ${correctCount} / ${task.pairs.length} (${percentage}%)</p>
                `;
                
                resultsElement.classList.remove('hidden');
            }
        });
    }
}

// Функция для инициализации интерактивности вопрос-ответ
function initWordsearchInteractivity(task) {
    const checkWordsearchBtn = document.getElementById('check-wordsearch-btn');
    
    if (checkWordsearchBtn) {
        checkWordsearchBtn.addEventListener('click', function() {
            let correctCount = 0;
            
            task.questions.forEach((question, index) => {
                const inputElement = document.querySelector(`.answer-input[data-index="${index}"]`);
                const feedbackElement = inputElement.parentElement.querySelector('.feedback');
                
                if (inputElement && feedbackElement) {
                    feedbackElement.classList.remove('hidden', 'correct', 'incorrect');
                    
                    const userAnswer = inputElement.value.trim().toLowerCase();
                    const correctAnswer = question.answer.toLowerCase();
                    
                    if (userAnswer === correctAnswer) {
                        feedbackElement.textContent = 'Дұрыс!';
                        feedbackElement.classList.add('correct');
                        correctCount++;
                    } else {
                        feedbackElement.textContent = `Дұрыс емес. Дұрыс жауап: ${question.answer}`;
                        feedbackElement.classList.add('incorrect');
                    }
                    
                    feedbackElement.classList.remove('hidden');
                }
            });
            
            // Показываем результаты
            const resultsElement = document.querySelector('.wordsearch-results');
            const resultsInfoElement = document.querySelector('.results-info');
            
            if (resultsElement && resultsInfoElement) {
                const percentage = Math.round((correctCount / task.questions.length) * 100);
                resultsInfoElement.innerHTML = `
                    <p>Дұрыс жауаптар: ${correctCount} / ${task.questions.length} (${percentage}%)</p>
                `;
                
                resultsElement.classList.remove('hidden');
            }
        });
    }
}

// Функция для шаринга задания
function shareTask(task) {
    const shareUrl = `${window.location.origin}/task-viewer.html?id=${task.id}`;
    
    // Показываем оверлей с ссылкой
    const shareOverlay = document.getElementById('share-overlay');
    const shareUrlInput = document.getElementById('share-url');
    
    if (shareOverlay && shareUrlInput) {
        shareUrlInput.value = shareUrl;
        shareOverlay.classList.remove('hidden');
    }
    
    // Копируем ссылку в буфер обмена
    try {
        navigator.clipboard.writeText(shareUrl);
        const copyLinkBtn = document.getElementById('copy-link-btn');
        if (copyLinkBtn) {
            copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        }
    } catch (error) {
        console.error('Не удалось скопировать ссылку:', error);
    }
}
