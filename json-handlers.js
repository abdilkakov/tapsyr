// Обработчики для экспорта и импорта заданий в формате JSON
document.addEventListener('DOMContentLoaded', function() {
    // Находим элементы UI
    const exportJsonBtn = document.getElementById('export-json-btn');
    const importJsonBtn = document.getElementById('import-json-btn');
    const importOverlay = document.getElementById('import-overlay');
    const closeImportBtn = document.getElementById('close-import-btn');
    const jsonFileInput = document.getElementById('json-file-input');
    const importFileBtn = document.getElementById('import-file-btn');
    
    // Обработчик кнопки экспорта JSON
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', function() {
            console.log('Кнопка экспорта JSON нажата');
            // Проверяем, есть ли текущее задание для экспорта
            if (window.currentTask) {
                // Используем функцию из api-client.js
                exportTaskToJson(window.currentTask);
            } else {
                alert('Нет активного задания для экспорта');
            }
        });
    }
    
    // Обработчик кнопки импорта JSON
    if (importJsonBtn) {
        importJsonBtn.addEventListener('click', function() {
            console.log('Кнопка импорта JSON нажата');
            // Показываем диалог импорта
            if (importOverlay) {
                importOverlay.classList.remove('hidden');
                
                // Сбрасываем поле выбора файла
                if (jsonFileInput) {
                    jsonFileInput.value = '';
                }
            }
        });
    }
    
    // Обработчик кнопки закрытия диалога импорта
    if (closeImportBtn) {
        closeImportBtn.addEventListener('click', function() {
            if (importOverlay) {
                importOverlay.classList.add('hidden');
            }
        });
    }
    
    // Закрытие диалога импорта при клике вне его
    if (importOverlay) {
        importOverlay.addEventListener('click', function(e) {
            if (e.target === importOverlay) {
                importOverlay.classList.add('hidden');
            }
        });
    }
    
    // Обработчик кнопки импорта файла
    if (importFileBtn) {
        importFileBtn.addEventListener('click', function() {
            const fileInput = document.getElementById('json-file-input');
            
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                console.log('Выбран файл:', file.name);
                
                // Используем функцию из api-client.js для импорта
                importTaskFromJson(file)
                    .then(result => {
                        if (result.success) {
                            console.log('Задание успешно импортировано:', result.task);
                            
                            // Закрываем диалог импорта
                            importOverlay.classList.add('hidden');
                            
                            // Обновляем список заданий, если мы на странице заданий
                            if (window.renderTaskList && typeof window.renderTaskList === 'function') {
                                window.renderTaskList();
                            }
                            
                            // Показываем предпросмотр импортированного задания
                            if (window.previewTask && typeof window.previewTask === 'function') {
                                window.previewTask(result.task);
                            }
                            
                            alert('Задание успешно импортировано!');
                        } else {
                            console.error('Ошибка при импорте:', result.error);
                            alert('Ошибка при импорте: ' + result.error);
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при импорте задания:', error);
                        alert('Ошибка при импорте: ' + (error.message || error));
                    });
            } else {
                alert('Пожалуйста, выберите JSON-файл');
            }
        });
    }
});
