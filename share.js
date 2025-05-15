// Функции для сохранения и загрузки заданий через сеть
async function saveTaskToServer(task) {
    try {
        // Используем новый API-клиент для сохранения в SQLite3 базу данных
        const result = await saveTaskToDatabase(task);
        
        // Просто передаем результат вызова API-клиента
        return result;
    } catch (error) {
        console.error('Ошибка при сохранении задания:', error);
        return {
            success: false,
            error: 'Не удалось сохранить задание: ' + error.message
        };
    }
}

async function loadTaskFromServer(shareId) {
    try {
        // Используем новый API-клиент для загрузки из SQLite3 базы данных
        const result = await loadTaskFromDatabase(shareId);
        
        // Просто передаем результат вызова API-клиента
        return result;
    } catch (error) {
        console.error('Ошибка при загрузке задания:', error);
        return {
            success: false,
            error: 'Не удалось загрузить задание: ' + error.message
        };
    }
}

// Функция для генерации уникального ID (для резервных случаев)
function generateUniqueId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Функции для обработки UI шаринга
function showShareDialog(url) {
    document.getElementById('share-url').value = url;
    document.getElementById('share-overlay').classList.remove('hidden');
}

function hideShareDialog() {
    document.getElementById('share-overlay').classList.add('hidden');
}

function copyShareLink() {
    const shareUrl = document.getElementById('share-url');
    shareUrl.select();
    document.execCommand('copy');
    
    // Показать уведомление о копировании
    const copyLinkBtn = document.getElementById('copy-link-btn');
    copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
        copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i>';
    }, 2000);
}

// Проверяем URL при загрузке страницы для загрузки шаренного задания
async function checkForSharedTask() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('task');
    
    if (taskId) {
        const result = await loadTaskFromServer(taskId);
        
        if (result.success) {
            // Показываем загруженное задание
            previewTask(result.task);
        } else {
            // Показываем сообщение об ошибке
            alert('Не удалось загрузить задание: ' + result.error);
        }
    }
}

// Инициализация обработчиков событий для шаринга
document.addEventListener('DOMContentLoaded', () => {
    const shareTaskBtn = document.getElementById('share-task-btn');
    const shareOverlay = document.getElementById('share-overlay');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const closeShareBtn = document.getElementById('close-share-btn');
    
    // Обработчики событий для шаринга
    if (shareTaskBtn) {
        shareTaskBtn.addEventListener('click', async () => {
            if (currentTask) {
                const result = await saveTaskToServer(currentTask);
                
                if (result.success) {
                    showShareDialog(result.shareUrl);
                } else {
                    alert('Не удалось создать ссылку: ' + result.error);
                }
            }
        });
    }
    
    if (closeShareBtn) {
        closeShareBtn.addEventListener('click', () => {
            hideShareDialog();
        });
    }
    
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            copyShareLink();
        });
    }
    
    if (shareOverlay) {
        // Закрыть диалог при клике вне его
        shareOverlay.addEventListener('click', (e) => {
            if (e.target === shareOverlay) {
                hideShareDialog();
            }
        });
    }
    
    // Проверяем URL для загрузки шаренного задания
    checkForSharedTask();
});
