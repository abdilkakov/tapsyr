// Скрипт для восстановления видимости кнопки Бөлісу
document.addEventListener('DOMContentLoaded', function() {
    // Функция для проверки и восстановления кнопки "Бөлісу"
    function fixShareButton() {
        console.log("Запуск функции для восстановления кнопки Бөлісу");
        const shareTaskBtn = document.getElementById('share-task-btn');
        const shareButtons = document.getElementById('share-buttons');
        
        if (shareTaskBtn) {
            console.log("Кнопка найдена, восстанавливаем видимость");
            // Сбрасываем все стили, которые могут скрывать кнопку
            shareTaskBtn.style.display = 'flex';
            shareTaskBtn.style.visibility = 'visible';
            shareTaskBtn.style.opacity = '1';
            shareTaskBtn.style.pointerEvents = 'auto';
            
            // Применяем базовые стили
            shareTaskBtn.style.alignItems = 'center';
            shareTaskBtn.style.gap = '0.5rem';
            shareTaskBtn.style.padding = '0.6rem 1rem';
            shareTaskBtn.style.backgroundColor = '#4361ee';
            shareTaskBtn.style.color = 'white';
            shareTaskBtn.style.borderRadius = '12px';
            shareTaskBtn.style.border = 'none';
            shareTaskBtn.style.cursor = 'pointer';
            
            console.log("Стили кнопки восстановлены");
        } else {
            console.error("Кнопка 'share-task-btn' не найдена");
        }
        
        if (shareButtons) {
            console.log("Контейнер share-buttons найден, восстанавливаем видимость");
            shareButtons.style.display = 'flex';
            shareButtons.style.visibility = 'visible';
            shareButtons.style.margin = '0 0 0 auto';
        } else {
            console.error("Контейнер 'share-buttons' не найден");
        }
        
        // Если мы на странице предпросмотра, добавим кнопку динамически, если она отсутствует
        const previewSection = document.getElementById('preview-section');
        const previewHeader = previewSection ? previewSection.querySelector('.preview-header') : null;
        
        if (previewSection && previewSection.classList.contains('active-section') && previewHeader && !shareButtons) {
            console.log("Добавляем кнопку динамически");
            
            const newShareButtons = document.createElement('div');
            newShareButtons.id = 'share-buttons';
            newShareButtons.className = 'share-buttons';
            newShareButtons.style.display = 'flex';
            newShareButtons.style.margin = '0 0 0 auto';
            
            const newShareBtn = document.createElement('button');
            newShareBtn.id = 'share-task-btn';
            newShareBtn.className = 'primary-btn';
            newShareBtn.title = 'Тапсырмамен бөлісу';
            newShareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Бөлісу';
            newShareBtn.style.display = 'flex';
            newShareBtn.style.alignItems = 'center';
            newShareBtn.style.gap = '0.5rem';
            newShareBtn.style.padding = '0.6rem 1rem';
            
            newShareButtons.appendChild(newShareBtn);
            previewHeader.appendChild(newShareButtons);
            
            console.log("Кнопка добавлена динамически");
            
            // Добавляем обработчик для новой кнопки
            newShareBtn.addEventListener('click', function() {
                console.log("Кнопка Бөлісу нажата");
                const result = {
                    success: true,
                    shareUrl: window.location.href + "?task=example"
                };
                
                // Создаем диалог для шаринга, если его нет
                let shareOverlay = document.getElementById('share-overlay');
                if (!shareOverlay) {
                    shareOverlay = document.createElement('div');
                    shareOverlay.id = 'share-overlay';
                    shareOverlay.className = 'share-overlay';
                    
                    const shareContent = document.createElement('div');
                    shareContent.className = 'share-content';
                    
                    shareContent.innerHTML = `
                        <h3>Тапсырмамен бөлісу</h3>
                        <div class="share-link-container">
                            <input type="text" id="share-url" readonly>
                            <button id="copy-link-btn" class="secondary-btn">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <p class="share-info">Бұл сілтемені бөлісу арқылы басқалар тапсырманы көре алады</p>
                        <button id="close-share-btn" class="secondary-btn">Жабу</button>
                    `;
                    
                    shareOverlay.appendChild(shareContent);
                    document.body.appendChild(shareOverlay);
                    
                    // Добавляем обработчики
                    document.getElementById('copy-link-btn').addEventListener('click', function() {
                        const shareUrl = document.getElementById('share-url');
                        shareUrl.select();
                        document.execCommand('copy');
                        this.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            this.innerHTML = '<i class="fas fa-copy"></i>';
                        }, 2000);
                    });
                    
                    document.getElementById('close-share-btn').addEventListener('click', function() {
                        shareOverlay.classList.add('hidden');
                    });
                    
                    shareOverlay.addEventListener('click', function(e) {
                        if (e.target === this) {
                            this.classList.add('hidden');
                        }
                    });
                }
                
                // Показываем диалог
                document.getElementById('share-url').value = result.shareUrl;
                shareOverlay.classList.remove('hidden');
            });
        }
    }
    
    // Запускаем функцию сразу
    fixShareButton();
    
    // И также запускаем при переходе на экран предпросмотра
    // Находим все возможные кнопки, которые могут открыть экран предпросмотра
    const previewBtn = document.querySelectorAll('.preview-task-btn, .task-btn, .task-card');
    previewBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            // Запускаем с небольшой задержкой, чтобы DOM успел обновиться
            setTimeout(fixShareButton, 500);
        });
    });
    
    // Наблюдаем за изменениями в DOM
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                // Проверяем, не отображается ли экран предпросмотра
                const previewSection = document.getElementById('preview-section');
                if (previewSection && !previewSection.classList.contains('hidden-section')) {
                    fixShareButton();
                }
            }
        }
    });
    
    // Наблюдаем за всем body
    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
});
