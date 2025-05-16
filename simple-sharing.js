// Простое решение для шаринга заданий между браузерами
// Использует локальное хранилище и прямые ссылки с URL-параметрами

// Функция для сохранения задания и создания короткой ссылки
async function saveAndShare(task) {
    console.log('Сохранение и шаринг задания:', task.title);
    
    // Обрабатываем задания типа match с большими данными изображений
    if (task.type === 'match' && task.pairs) {
        // Создаем отдельное хранилище изображений
        const imageStorage = {};
        
        task.pairs.forEach((pair, index) => {
            // Если есть изображение
            if (pair.imageData && pair.imageData.length > 100) {
                // Сохраняем изображение в отдельное хранилище
                const imageId = `img_${task.id || Date.now()}_${index}`;
                imageStorage[imageId] = pair.imageData;
                
                // Заменяем данные изображения на ссылку
                pair.imageData = imageId;
                pair.isImageReference = true;
            }
        });
        
        // Сохраняем изображения отдельно
        if (Object.keys(imageStorage).length > 0) {
            localStorage.setItem('tapsyr-shared-images', JSON.stringify({
                ...JSON.parse(localStorage.getItem('tapsyr-shared-images') || '{}'),
                ...imageStorage
            }));
            task.hasReferencedImages = true;
        }
    }
    
    // Показываем индикатор загрузки в кнопке шаринга
    const shareBtn = document.getElementById('share-task-btn');
    let originalBtnText = '';
    
    if (shareBtn) {
        originalBtnText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
        shareBtn.disabled = true;
    }
    
    try {
        // Сохраняем задание с использованием API клиента
        const result = await saveTaskToDatabase(task);
        
        if (!result.success) {
            throw new Error(result.error || 'Ошибка при сохранении задания');
        }
        
        // Если сервер недоступен, используем локальное хранение
        const shareUrl = result.shareUrl || `${window.location.origin}${window.location.pathname}?task=${task.id}`;
        
        // Копируем ссылку в буфер обмена
        await navigator.clipboard.writeText(shareUrl);
        console.log('Ссылка скопирована в буфер обмена:', shareUrl);
        
        // Показываем успешное копирование
        if (shareBtn) {
            shareBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано';
            shareBtn.disabled = false;
            
            // Возвращаем оригинальный текст через 2 секунды
            setTimeout(() => {
                shareBtn.innerHTML = originalBtnText;
            }, 2000);
        }
        
        // Показываем ссылку в оверлее
        const shareOverlay = document.getElementById('share-overlay');
        const shareUrlInput = document.getElementById('share-url');
        
        if (shareOverlay && shareUrlInput) {
            shareUrlInput.value = shareUrl;
            shareOverlay.classList.remove('hidden');
        }
        
        return {
            success: true,
            shareUrl: shareUrl,
            shareId: task.id
        };
    } 
    catch (error) {
        console.error('Ошибка при сохранении задания:', error);
        
        // Возвращаем оригинальный текст кнопки
        if (shareBtn) {
            shareBtn.innerHTML = originalBtnText;
            shareBtn.disabled = false;
        }
        
        // Резервное решение: сохраняем в локальное хранилище и создаем длинную ссылку
        if (!task.id) {
            task.id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // Сохраняем в локальном хранилище
        const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
        sharedTasks[task.id] = task;
        localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
        
        // Создаем объект для передачи через URL (строку JSON)
        const taskData = JSON.stringify(task);
        
        // Кодируем для URL
        const encodedData = encodeURIComponent(taskData);
        
        // Создаем ссылку с данными в параметре (резервный вариант с длинной ссылкой)
        const shareUrl = `${window.location.origin}${window.location.pathname}?task_data=${encodedData}`;
        
        alert('Не удалось создать короткую ссылку. Будет использована длинная ссылка.');
        
        // Показываем ссылку в оверлее
        const shareOverlay = document.getElementById('share-overlay');
        const shareUrlInput = document.getElementById('share-url');
        
        if (shareOverlay && shareUrlInput) {
            shareUrlInput.value = shareUrl;
            shareOverlay.classList.remove('hidden');
        }
        
        // Пытаемся скопировать в буфер обмена
        try {
            navigator.clipboard.writeText(shareUrl);
        } catch (clipboardError) {
            // Резервное копирование
            const linkElement = document.createElement('textarea');
            linkElement.value = shareUrl;
            document.body.appendChild(linkElement);
            linkElement.select();
            document.execCommand('copy');
            document.body.removeChild(linkElement);
        }
        
        return {
            success: true,
            shareUrl: shareUrl,
            shareId: task.id,
            localOnly: true
        };
    }
}

// Функция для проверки наличия задания в URL
async function checkForSharedTask() {
    console.log('Проверка URL на наличие данных задания');
    
    const urlParams = new URLSearchParams(window.location.search);
    const taskData = urlParams.get('task_data');
    const taskId = urlParams.get('task');
    
    // Сначала проверяем наличие короткой ссылки (task=ID)
    if (taskId) {
        try {
            console.log('Найден ID задания в URL:', taskId);
            
            // Очищаем URL (убираем параметры)
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Показываем индикатор загрузки
            const loadingNotification = document.createElement('div');
            loadingNotification.className = 'task-notification';
            loadingNotification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Тапсырма жүктелуде...</p>
                </div>
            `;
            document.body.appendChild(loadingNotification);
            
            // Загружаем задание по ID
            const result = await loadTaskFromDatabase(taskId);
            
            // Удаляем индикатор загрузки
            document.body.removeChild(loadingNotification);
            
            if (!result.success) {
                throw new Error(result.error || 'Задание не найдено');
            }
            
            const task = result.task;
            console.log('Задание успешно загружено:', task.title);
            
            // Восстанавливаем изображения, если они представлены как ссылки
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
                        } else {
                            console.warn(`Изображение ${imageId} не найдено в хранилище`);
                        }
                    }
                });
            }
            
            // Добавляем задание в локальное хранилище
            const tasks = JSON.parse(localStorage.getItem('tapsyr-tasks') || '[]');
            const existingTaskIndex = tasks.findIndex(t => t.id === task.id);
            
            if (existingTaskIndex !== -1) {
                // Обновляем существующее задание
                tasks[existingTaskIndex] = task;
            } else {
                // Добавляем новое задание
                tasks.push(task);
            }
            
            localStorage.setItem('tapsyr-tasks', JSON.stringify(tasks));
            
            // Показываем уведомление о сохранении задания
            const notification = document.createElement('div');
            notification.className = 'task-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-check-circle"></i>
                    <p>Тапсырма "${task.title}" сіздің құрылғыңызда сақталды</p>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Скрываем уведомление через 4 секунды
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 4000);
            
            // Открываем предпросмотр
            if (typeof window.previewTask === 'function') {
                window.previewTask(task);
            } else {
                console.error('Функция previewTask не найдена');
                alert('Тапсырма сіздің құрылғыңызда сақталды! Оны "Менің тапсырмаларым" бөлімінен таба аласыз.');
            }
        } catch (error) {
            console.error('Ошибка при загрузке задания:', error);
            alert('Ошибка при загрузке задания: ' + error.message);
        }
    }
    // Если не нашли короткую ссылку, проверяем наличие данных в URL (обратная совместимость)
    else if (taskData) {
        try {
            // Декодируем и парсим JSON
            const decodedData = decodeURIComponent(taskData);
            const task = JSON.parse(decodedData);
            console.log('Найдены полные данные задания в URL');
            
            // Очищаем URL (убираем параметры)
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Восстанавливаем изображения, если они представлены как ссылки
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
                        } else {
                            console.warn(`Изображение ${imageId} не найдено в хранилище`);
                        }
                    }
                });
            }
            
            // Проверяем, есть ли уже такое задание в локальном хранилище
            const tasks = JSON.parse(localStorage.getItem('tapsyr-tasks') || '[]');
            const existingTaskIndex = tasks.findIndex(t => t.id === task.id);
            
            if (existingTaskIndex !== -1) {
                // Обновляем существующее задание
                tasks[existingTaskIndex] = task;
                localStorage.setItem('tapsyr-tasks', JSON.stringify(tasks));
                console.log('Существующее задание обновлено');
            } else {
                // Добавляем новое задание
                tasks.push(task);
                localStorage.setItem('tapsyr-tasks', JSON.stringify(tasks));
            }
            
            // Показываем уведомление о сохранении задания
            const notification = document.createElement('div');
            notification.className = 'task-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-check-circle"></i>
                    <p>Тапсырма "${task.title}" сіздің құрылғыңызда сақталды</p>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Скрываем уведомление через 4 секунды
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 4000);
            
            // Открываем предпросмотр
            if (typeof window.previewTask === 'function') {
                window.previewTask(task);
            } else {
                console.error('Функция previewTask не найдена');
                alert('Тапсырма сіздің құрылғыңызда сақталды! Оны "Менің тапсырмаларым" бөлімінен таба аласыз.');
            }
        } catch (error) {
            console.error('Ошибка при обработке данных задания из URL:', error);
            alert('Ошибка при обработке данных задания из URL: ' + error.message);
        }
    }
}

// Проверяем параметры URL при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    checkForSharedTask();
    
    // Перехватываем кнопку "Бөлісу" для использования нашей функции
    const shareBtn = document.getElementById('share-task-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            console.log('Кнопка Бөлісу нажата');
            
            // Проверяем наличие текущего задания
            if (window.currentTask) {
                saveAndShare(window.currentTask);
            } else {
                alert('Нет активного задания для шаринга');
            }
        });
    }
    
    // Добавляем обработчик для закрытия диалога шаринга
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
    
    // Настраиваем кнопку копирования в диалоге
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

// Перехватываем функцию предпросмотра, чтобы добавить нашу кнопку шаринга
const originalPreviewTask = window.previewTask;
window.previewTask = function(task) {
    // Вызываем оригинальную функцию
    if (originalPreviewTask) {
        originalPreviewTask(task);
    }
    
    // Обновляем обработчик для кнопки шаринга
    const shareBtn = document.getElementById('share-task-btn');
    if (shareBtn) {
        shareBtn.onclick = function() {
            saveAndShare(task);
        };
    }
};
