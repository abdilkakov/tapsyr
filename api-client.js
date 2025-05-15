// Клиент API для работы с сервером и SQLite3 базой данных
const API_URL = 'http://localhost:3000/api';
let serverAvailable = null; // Не знаем, доступен ли сервер, пока не проверим

// Проверка доступности сервера
async function checkServerAvailability() {
  if (serverAvailable !== null) {
    return serverAvailable;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // Таймаут 1.5 секунды
    
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    serverAvailable = response.ok;
    
    console.log(`Сервер ${serverAvailable ? 'доступен' : 'недоступен'}`);
    return serverAvailable;
  } catch (error) {
    console.warn('Сервер недоступен:', error.message);
    serverAvailable = false;
    return false;
  }
}

// Функция для сохранения задания на сервере
async function saveTaskToDatabase(task) {
  try {
    console.log('Сохранение задания:', task.title);
    
    // Сначала проверяем, доступен ли сервер
    const isServerAvailable = await checkServerAvailability();
    
    if (!isServerAvailable) {
      console.warn('Сервер недоступен. Сохраняем только локально');
      
      // Сохраняем только в localStorage
      if (!task.id) {
        task.id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
      sharedTasks[task.id] = task;
      localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
      
      const shareUrl = `${window.location.origin}${window.location.pathname}?task=${task.id}`;
      
      return {
        success: true,
        shareUrl: shareUrl,
        shareId: task.id,
        localOnly: true
      };
    }
    
    // Если сервер доступен, пытаемся сохранить задание в базе данных
    console.log('Сохранение задания на сервере...');
    
    // Устанавливаем таймаут на запрос, чтобы не висеть долго
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут
    
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Ошибка при сохранении задания:', result.error);
      return {
        success: false,
        error: result.error || 'Ошибка при сохранении задания'
      };
    }
    
    console.log('Задание успешно сохранено с ID:', result.id);
    
    // Обновляем ID задания, если его не было
    if (!task.id) {
      task.id = result.id;
    }
    
    // Сохраняем также в localStorage для работы офлайн
    const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
    sharedTasks[task.id] = task;
    localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
    
    return {
      success: true,
      shareUrl: result.shareUrl,
      shareId: task.id
    };
  } catch (error) {
    console.error('Ошибка при отправке запроса на сервер:', error);
    
    // Резервное сохранение только в localStorage если сервер недоступен
    if (!task.id) {
      task.id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
    sharedTasks[task.id] = task;
    localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?task=${task.id}`;
    
    return {
      success: true,
      shareUrl: shareUrl,
      shareId: task.id,
      localOnly: true
    };
  }
}

// Функция для загрузки задания с сервера по ID
async function loadTaskFromDatabase(taskId) {
  try {
    console.log('Загрузка задания:', taskId);
    
    // Сначала проверим в localStorage
    const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
    
    if (sharedTasks[taskId]) {
      console.log('Задание найдено в локальном хранилище');
      return {
        success: true,
        task: sharedTasks[taskId],
        localOnly: true
      };
    }
    
    // Проверяем, доступен ли сервер
    const isServerAvailable = await checkServerAvailability();
    
    if (!isServerAvailable) {
      console.warn('Сервер недоступен, задание не найдено в локальном хранилище');
      return {
        success: false,
        error: 'Сервер недоступен и задание не найдено в локальном хранилище'
      };
    }
    
    // Если сервер доступен, пытаемся загрузить с него
    console.log('Загрузка задания с сервера...');
    
    // Устанавливаем таймаут на запрос
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут
    
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const result = await response.json();
    
    if (!response.ok) {
      console.warn('Не удалось загрузить задание с сервера:', result.error);
      return {
        success: false,
        error: result.error || 'Задание не найдено на сервере'
      };
    }
    
    console.log('Задание успешно загружено с сервера');
    
    // Кешируем задание в localStorage
    sharedTasks[taskId] = result.task;
    localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
    
    return {
      success: true,
      task: result.task
    };
  } catch (error) {
    console.error('Ошибка при получении задания:', error);
    
    // Еще раз проверим в localStorage
    const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
    
    if (sharedTasks[taskId]) {
      console.log('Задание найдено в локальном хранилище после ошибки');
      return {
        success: true,
        task: sharedTasks[taskId],
        localOnly: true
      };
    }
    
    return {
      success: false,
      error: 'Не удалось загрузить задание: ' + error.message
    };
  }
}

// Проверяем URL при загрузке страницы для загрузки задания по ID
async function checkForSharedTask() {
  console.log('Проверка URL на наличие ID задания');
  
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('task');
  
  if (taskId) {
    console.log('Найден ID задания в URL:', taskId);
    
    try {
      const result = await loadTaskFromDatabase(taskId);
      
      if (result.success) {
        console.log('Задание успешно загружено, открываем предпросмотр');
        
        // Если в глобальном объекте есть функция для предпросмотра, используем её
        if (typeof window.previewTask === 'function') {
          window.previewTask(result.task);
        } else {
          console.error('Функция previewTask не найдена');
          alert('Не удалось загрузить задание: функция предпросмотра не найдена');
        }
      } else {
        console.error('Ошибка при загрузке задания:', result.error);
        alert('Не удалось загрузить задание: ' + result.error);
      }
    } catch (error) {
      console.error('Ошибка при проверке URL:', error);
    }
  }
}

// Функция экспорта задания в JSON-файл
function exportTaskToJson(task) {
  if (!task) {
    console.error('Нет задания для экспорта');
    return false;
  }
  
  try {
    // Преобразуем задание в JSON-строку
    const taskJSON = JSON.stringify(task, null, 2);
    
    // Создаем Blob с типом application/json
    const blob = new Blob([taskJSON], { type: 'application/json' });
    
    // Создаем ссылку для скачивания
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    
    // Устанавливаем имя файла на основе заголовка задания
    const fileName = `tapsyr_${task.type}_${task.title.replace(/[^a-z0-9А-я]/gi, '_').toLowerCase()}.json`;
    downloadLink.download = fileName;
    
    // Добавляем ссылку в DOM, кликаем по ней и удаляем
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Освобождаем ссылку
    URL.revokeObjectURL(downloadLink.href);
    
    console.log('Задание успешно экспортировано в JSON');
    return true;
  } catch (error) {
    console.error('Ошибка при экспорте задания:', error);
    return false;
  }
}

// Функция импорта задания из JSON-файла
async function importTaskFromJson(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Файл не указан'));
      return;
    }
    
    // Проверяем тип файла
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      reject(new Error('Файл должен быть в формате JSON'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        // Парсим JSON
        const task = JSON.parse(event.target.result);
        
        // Проверяем наличие обязательных полей
        if (!task.type || !task.title) {
          reject(new Error('Неверный формат файла: отсутствуют обязательные поля'));
          return;
        }
        
        // Сохраняем в localStorage
        const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
        
        // Генерируем новый ID, если его нет
        if (!task.id) {
          task.id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        sharedTasks[task.id] = task;
        localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
        
        // Добавляем задание в список моих заданий
        const tasks = JSON.parse(localStorage.getItem('tapsyr-tasks') || '[]');
        
        // Проверяем, что задание с таким ID еще не существует
        const existingTaskIndex = tasks.findIndex(t => t.id === task.id);
        
        if (existingTaskIndex === -1) {
          tasks.push(task);
          localStorage.setItem('tapsyr-tasks', JSON.stringify(tasks));
        } else {
          // Обновляем существующее задание
          tasks[existingTaskIndex] = task;
          localStorage.setItem('tapsyr-tasks', JSON.stringify(tasks));
        }
        
        // Пытаемся сохранить на сервере, если он доступен
        try {
          const isServerAvailable = await checkServerAvailability();
          
          if (isServerAvailable) {
            const saveResult = await saveTaskToDatabase(task);
            console.log('Результат сохранения на сервере:', saveResult);
          }
        } catch (serverError) {
          console.warn('Не удалось сохранить на сервере:', serverError);
          // Не прерываем процесс, так как уже сохранили в localStorage
        }
        
        resolve({
          success: true,
          task: task
        });
      } catch (error) {
        console.error('Ошибка при чтении файла:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка при чтении файла'));
    };
    
    reader.readAsText(file);
  });
}
