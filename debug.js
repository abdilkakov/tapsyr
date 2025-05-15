// Отладочный файл для проверки функциональности шаринга
document.addEventListener('DOMContentLoaded', function() {
    console.log('Отладочный скрипт загружен');
    
    // Проверяем все элементы UI
    const shareButtons = {
        shareTaskBtn: document.getElementById('share-task-btn'),
        shareOverlay: document.getElementById('share-overlay'),
        shareUrl: document.getElementById('share-url'),
        copyLinkBtn: document.getElementById('copy-link-btn'),
        closeShareBtn: document.getElementById('close-share-btn')
    };
    
    // Выводим состояние элементов в консоль
    for (const [name, element] of Object.entries(shareButtons)) {
        console.log(`Элемент "${name}": ${element ? 'найден' : 'НЕ НАЙДЕН'}`);
    }
    
    // Прямое добавление обработчиков для кнопок шаринга
    if (shareButtons.shareTaskBtn) {
        console.log('Добавляем обработчик для кнопки "Бөлісу"');
        
        shareButtons.shareTaskBtn.addEventListener('click', async function() {
            console.log('Кнопка "Бөлісу" нажата');
            
            // Показываем диалог даже без задания для тестирования
            shareButtons.shareUrl.value = 'https://example.com/test-url'; 
            shareButtons.shareOverlay.classList.remove('hidden');
            
            // Если есть активное задание, пытаемся сохранить его
            if (window.currentTask) {
                try {
                    console.log('Пробуем сохранить задание:', window.currentTask.title);
                    
                    // Простая локальная реализация для отладки
                    // Генерируем ID для задания, если его нет
                    if (!window.currentTask.shareId) {
                        window.currentTask.shareId = 'task_' + Date.now();
                    }
                    
                    // Сохраняем в localStorage
                    const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
                    sharedTasks[window.currentTask.shareId] = window.currentTask;
                    localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
                    
                    // Формируем URL для шаринга
                    const shareUrl = `${window.location.origin}${window.location.pathname}?task=${window.currentTask.shareId}`;
                    shareButtons.shareUrl.value = shareUrl;
                    
                    console.log('Задание успешно сохранено с ID:', window.currentTask.shareId);
                } catch (error) {
                    console.error('Ошибка при сохранении задания:', error);
                    alert('Ошибка при сохранении задания: ' + error.message);
                }
            } else {
                console.warn('Нет активного задания');
            }
        });
    }
    
    // Обработчик для кнопки копирования
    if (shareButtons.copyLinkBtn) {
        shareButtons.copyLinkBtn.addEventListener('click', function() {
            console.log('Копирование ссылки');
            shareButtons.shareUrl.select();
            document.execCommand('copy');
            
            // Визуальная обратная связь
            this.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    }
    
    // Обработчик для кнопки закрытия
    if (shareButtons.closeShareBtn) {
        shareButtons.closeShareBtn.addEventListener('click', function() {
            console.log('Закрытие диалога');
            shareButtons.shareOverlay.classList.add('hidden');
        });
    }
    
    // Закрытие по клику вне диалога
    if (shareButtons.shareOverlay) {
        shareButtons.shareOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                console.log('Закрытие диалога по клику вне него');
                this.classList.add('hidden');
            }
        });
    }
    
    // Проверяем URL при загрузке страницы
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('task');
    
    if (taskId) {
        console.log('Найден параметр task в URL:', taskId);
        
        // Пробуем загрузить из localStorage
        const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
        
        if (sharedTasks[taskId]) {
            console.log('Задание найдено в локальном хранилище, загружаем');
            
            // Если в глобальном объекте есть функция для предпросмотра, используем её
            if (typeof window.previewTask === 'function') {
                window.previewTask(sharedTasks[taskId]);
            } else {
                console.error('Функция previewTask не найдена');
                alert('Не удалось загрузить задание: функция предпросмотра не найдена');
            }
        } else {
            console.error('Задание не найдено в локальном хранилище');
            alert('Задание не найдено');
        }
    }
});
