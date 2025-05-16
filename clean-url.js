// Скрипт для очистки URL и перехода на главную страницу

// Функция очистки URL от параметров
function cleanURL() {
    // Проверяем, есть ли параметры в URL
    if (window.location.search || window.location.hash) {
        // Получаем базовый URL без параметров
        const baseURL = window.location.protocol + '//' + window.location.host + window.location.pathname;
        
        // Заменяем текущий URL на чистый URL без параметров (без перезагрузки страницы)
        window.history.replaceState({}, document.title, baseURL);
        
        console.log('URL очищен от параметров');
        return true;
    }
    return false;
}

// Обрабатываем нажатие на логотип
document.addEventListener('DOMContentLoaded', function() {
    const logoHome = document.getElementById('logo-home');
    
    if (logoHome) {
        // Заменяем существующий обработчик события
        logoHome.addEventListener('click', function(e) {
            e.preventDefault(); // Предотвращаем стандартное поведение, если есть
            
            // Очищаем URL
            cleanURL();
            
            // Показываем главную страницу
            const welcomeSection = document.getElementById('welcome-section');
            
            if (typeof showSection === 'function' && welcomeSection) {
                showSection(welcomeSection);
                console.log('Переход на главную страницу');
            } else {
                console.error('Функция showSection не найдена');
            }
        });
        
        console.log('Добавлен обработчик для логотипа с очисткой URL');
    }
    
    // Проверяем URL при загрузке страницы
    const hasParameters = window.location.search || window.location.hash;
    
    if (hasParameters) {
        // Если в URL есть параметры, проверяем, связаны ли они с заданием
        const urlParams = new URLSearchParams(window.location.search);
        const taskData = urlParams.get('task_data');
        
        // Если это не параметр с заданием, очищаем URL и переходим на главную
        if (!taskData) {
            setTimeout(function() {
                cleanURL();
                
                // Показываем главную страницу
                const welcomeSection = document.getElementById('welcome-section');
                
                if (typeof showSection === 'function' && welcomeSection) {
                    showSection(welcomeSection);
                    console.log('Автоматический переход на главную страницу при загрузке');
                }
            }, 500); // Небольшая задержка для загрузки других скриптов
        }
    }
});

// Добавляем обработчик события прямого обновления страницы (F5 или Ctrl+R)
window.addEventListener('beforeunload', function(event) {
    // Очищаем localStorage от временных данных (опционально)
    localStorage.removeItem('current_task_preview');
    
    // Убедимся, что URL чист после перезагрузки
    cleanURL();
    
    // Обратите внимание, что этот метод не всегда работает из-за ограничений безопасности браузера
});
