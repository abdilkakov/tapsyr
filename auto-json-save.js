// Автоматическое сохранение заданий в JSON-файлы
(function() {
    console.log('Инициализация автоматического сохранения в JSON');
    
    // Отслеживаем изменения в локальном хранилище
    function setupAutoJsonSave() {
        // Переопределим функции сохранения заданий, чтобы автоматически экспортировать в JSON
        
        // Оригинальная функция сохранения викторины
        const originalSaveQuiz = window.saveQuiz;
        // Оригинальная функция сохранения match-up
        const originalSaveMatch = window.saveMatch;
        // Оригинальная функция сохранения wordsearch
        const originalSaveWordsearch = window.saveWordsearch;
        
        // Переопределяем функцию saveQuiz
        window.saveQuiz = function() {
            // Вызываем оригинальную функцию
            const task = originalSaveQuiz();
            
            // Если задание успешно создано, автоматически экспортируем в JSON
            if (task) {
                setTimeout(() => exportTaskToJson(task), 500);
            }
            
            return task;
        };
        
        // Переопределяем функцию saveMatch
        window.saveMatch = function() {
            // Вызываем оригинальную функцию
            const task = originalSaveMatch();
            
            // Если задание успешно создано, автоматически экспортируем в JSON
            if (task) {
                setTimeout(() => exportTaskToJson(task), 500);
            }
            
            return task;
        };
        
        // Переопределяем функцию saveWordsearch
        window.saveWordsearch = function() {
            // Вызываем оригинальную функцию
            const task = originalSaveWordsearch();
            
            // Если задание успешно создано, автоматически экспортируем в JSON
            if (task) {
                setTimeout(() => exportTaskToJson(task), 500);
            }
            
            return task;
        };
        
        // Также перехватываем сохранение в API
        const originalSaveTaskToDatabase = window.saveTaskToDatabase;
        window.saveTaskToDatabase = async function(task) {
            // Сначала автоматически экспортируем задание в JSON
            if (task) {
                setTimeout(() => exportTaskToJson(task), 500);
            }
            
            // Затем вызываем оригинальную функцию
            return await originalSaveTaskToDatabase(task);
        };
        
        console.log('Автоматическое сохранение в JSON настроено');
        
        // Проверяем наличие заданий в localStorage и экспортируем их
        autoExportExistingTasks();
    }
    
    // Функция для автоматического экспорта существующих заданий
    function autoExportExistingTasks() {
        console.log('Проверка существующих заданий для автоэкспорта');
        
        try {
            // Получаем все задания из localStorage
            const tasks = JSON.parse(localStorage.getItem('tapsyr-tasks') || '[]');
            const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
            
            // Если есть задания, экспортируем каждое из них
            if (tasks.length > 0) {
                console.log(`Найдено ${tasks.length} заданий для автоэкспорта`);
                
                // Создаем директорию для хранения заданий
                const storageDir = 'tapsyr_tasks';
                
                // Создаем zip-архив со всеми заданиями
                const zipContent = JSON.stringify({
                    tasks: tasks,
                    sharedTasks: sharedTasks,
                    exportDate: new Date().toISOString(),
                    appVersion: '1.0.0'
                }, null, 2);
                
                // Создаем Blob с данными
                const blob = new Blob([zipContent], { type: 'application/json' });
                
                // Создаем ссылку для скачивания
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = `tapsyr_all_tasks_${new Date().toISOString().slice(0, 10)}.json`;
                
                // Добавляем элемент перед экспортом
                const exportAllBtn = document.createElement('button');
                exportAllBtn.id = 'export-all-btn';
                exportAllBtn.className = 'secondary-btn';
                exportAllBtn.innerHTML = '<i class="fas fa-file-export"></i> Экспортировать все задания';
                exportAllBtn.title = 'Экспортировать все задания в один JSON-файл';
                
                // Найдем место для вставки кнопки
                const actionButtons = document.querySelector('.action-buttons');
                if (actionButtons) {
                    actionButtons.appendChild(exportAllBtn);
                    
                    // Добавляем обработчик для кнопки
                    exportAllBtn.addEventListener('click', function() {
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    });
                }
            }
        } catch (error) {
            console.error('Ошибка при автоэкспорте заданий:', error);
        }
    }
    
    // Запускаем настройку автоматического сохранения
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(setupAutoJsonSave, 1000);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(setupAutoJsonSave, 1000);
        });
    }
})();
