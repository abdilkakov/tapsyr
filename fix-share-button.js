// Скрипт для немедленного исправления кнопки "Бөлісу"
(function() {
    // Функция запустится сразу после загрузки страницы
    console.log("Запуск скрипта для исправления кнопки Бөлісу");
    
    // Ждем, пока DOM будет полностью загружен
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM загружен, начинаем исправление кнопки");
        fixShareButton();
    });
    
    // Также попробуем сразу, если DOM уже загружен
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("DOM уже загружен, начинаем исправление кнопки");
        setTimeout(fixShareButton, 100);
    }
    
    function fixShareButton() {
        // Находим кнопку
        const shareTaskBtn = document.getElementById('share-task-btn');
        const shareOverlay = document.getElementById('share-overlay');
        const shareUrl = document.getElementById('share-url');
        const copyLinkBtn = document.getElementById('copy-link-btn');
        const closeShareBtn = document.getElementById('close-share-btn');
        
        console.log("Элементы найдены:", {
            shareTaskBtn: !!shareTaskBtn,
            shareOverlay: !!shareOverlay,
            shareUrl: !!shareUrl,
            copyLinkBtn: !!copyLinkBtn,
            closeShareBtn: !!closeShareBtn
        });
        
        if (!shareTaskBtn) {
            console.error("Кнопка share-task-btn не найдена!");
            return;
        }
        
        // Удаляем все существующие обработчики событий
        shareTaskBtn.onclick = null;
        
        // Устанавливаем новый обработчик событий
        shareTaskBtn.onclick = async function() {
            console.log("Кнопка 'Бөлісу' нажата");
            
            // Получаем текущее задание из глобальной переменной
            const currentTask = window.currentTask;
            console.log("Текущее задание:", currentTask);
            
            if (!currentTask) {
                alert("Нет активного задания для шаринга");
                return;
            }
            
            try {
                console.log("Сохраняем задание в базу данных...");
                
                // Проверяем, что функция saveTaskToDatabase существует
                if (typeof saveTaskToDatabase !== 'function') {
                    console.error("Функция saveTaskToDatabase не найдена!");
                    alert("Ошибка: функция saveTaskToDatabase не найдена");
                    return;
                }
                
                // Вызываем функцию из api-client.js напрямую
                const result = await saveTaskToDatabase(currentTask);
                console.log("Результат сохранения:", result);
                
                if (result.success) {
                    // Показываем оверлей с URL
                    shareUrl.value = result.shareUrl;
                    shareOverlay.classList.remove('hidden');
                    console.log("Показываем оверлей с URL:", result.shareUrl);
                } else {
                    console.error("Не удалось создать ссылку:", result.error);
                    alert("Не удалось создать ссылку: " + (result.error || "Неизвестная ошибка"));
                }
            } catch (error) {
                console.error("Ошибка при шаринге:", error);
                alert("Ошибка: " + (error.message || error));
            }
        };
        
        // Также исправляем другие связанные кнопки
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
        
        console.log("Кнопка 'Бөлісу' успешно исправлена");
    }
})();
