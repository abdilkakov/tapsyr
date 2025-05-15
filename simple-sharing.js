// Простое решение для шаринга заданий между браузерами
// Использует локальное хранилище и прямые ссылки с URL-параметрами

// Функция для сохранения задания и создания ссылки
function saveAndShare(task) {
    console.log('Сохранение и шаринг задания:', task.title);
    
    // Генерируем уникальный ID если его нет
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
    
    // Создаем ссылку с данными в параметре
    const shareUrl = `${window.location.origin}${window.location.pathname}?task_data=${encodedData}`;
    
    // Копируем ссылку в буфер обмена
    navigator.clipboard.writeText(shareUrl)
        .then(() => {
            console.log('Ссылка скопирована в буфер обмена');
            alert('Ссылка скопирована в буфер обмена! Теперь вы можете отправить её кому угодно, и задание откроется у них в браузере.');
        })
        .catch(err => {
            console.error('Не удалось скопировать ссылку:', err);
            
            // Показываем ссылку пользователю для ручного копирования
            const linkElement = document.createElement('textarea');
            linkElement.value = shareUrl;
            document.body.appendChild(linkElement);
            linkElement.select();
            document.execCommand('copy');
            document.body.removeChild(linkElement);
            
            alert('Ссылка создана! Скопируйте её и отправьте кому угодно, и задание откроется у них в браузере.');
        });
    
    return {
        success: true,
        shareUrl: shareUrl,
        shareId: task.id
    };
}

// Функция для проверки наличия задания в URL
function checkForSharedTask() {
    console.log('Проверка URL на наличие данных задания');
    
    const urlParams = new URLSearchParams(window.location.search);
    const taskData = urlParams.get('task_data');
    
    if (taskData) {
        console.log('Найдены данные задания в URL');
        
        try {
            // Декодируем и парсим JSON
            const decodedData = decodeURIComponent(taskData);
            const task = JSON.parse(decodedData);
            
            console.log('Задание успешно получено из URL:', task.title);
            
            // Сохраняем в локальном хранилище
            const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
            sharedTasks[task.id] = task;
            localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
            
            // Также добавляем в список заданий пользователя
            const tasks = JSON.parse(localStorage.getItem('tapsyr-tasks') || '[]');
            const existingTaskIndex = tasks.findIndex(t => t.id === task.id);
            
            if (existingTaskIndex === -1) {
                tasks.push(task);
                localStorage.setItem('tapsyr-tasks', JSON.stringify(tasks));
            }
            
            // Открываем предпросмотр
            if (typeof window.previewTask === 'function') {
                window.previewTask(task);
            } else {
                console.error('Функция previewTask не найдена');
                alert('Не удалось открыть задание: функция предпросмотра не найдена. Но задание было сохранено на вашем устройстве.');
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
