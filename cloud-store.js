// Хранилище заданий в облаке
// Решение использует Firebase Realtime Database для максимальной простоты

// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyBGpTCm4Fld5zvWnCEjrOuIGYBYvOmtlnM",
  authDomain: "tapsyr-cloud.firebaseapp.com",
  databaseURL: "https://tapsyr-cloud-default-rtdb.firebaseio.com",
  projectId: "tapsyr-cloud",
  storageBucket: "tapsyr-cloud.appspot.com",
  messagingSenderId: "237518847144",
  appId: "1:237518847144:web:8e7ebd3c3c1c8d2c8f4b54"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const tasksRef = database.ref('tasks');

// Сохранение задания в облако
async function saveTaskToCloud(task) {
  if (!task || !task.id) {
    console.error('Задание должно иметь ID');
    return {success: false, error: 'Нет ID задания'};
  }
  
  try {
    console.log('Сохранение задания в облако:', task.title);
    await tasksRef.child(task.id).set(task);
    
    const publicUrl = window.location.origin + window.location.pathname + '?task=' + task.id;
    console.log('Публичная ссылка:', publicUrl);
    
    return {
      success: true,
      shareUrl: publicUrl,
      shareId: task.id
    };
  } catch (error) {
    console.error('Ошибка при сохранении в облако:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Загрузка задания из облака
async function loadTaskFromCloud(taskId) {
  if (!taskId) {
    return {success: false, error: 'Не указан ID задания'};
  }
  
  try {
    console.log('Загрузка задания из облака:', taskId);
    const snapshot = await tasksRef.child(taskId).once('value');
    
    if (snapshot.exists()) {
      const task = snapshot.val();
      
      // Кешируем локально для офлайн-доступа
      const cachedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
      cachedTasks[taskId] = task;
      localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(cachedTasks));
      
      return {
        success: true,
        task: task
      };
    } else {
      console.warn('Задание не найдено в облаке');
      
      // Проверяем локальный кеш
      const cachedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
      if (cachedTasks[taskId]) {
        return {
          success: true,
          task: cachedTasks[taskId],
          fromCache: true
        };
      }
      
      return {
        success: false,
        error: 'Задание не найдено'
      };
    }
  } catch (error) {
    console.error('Ошибка при загрузке из облака:', error);
    
    // Проверяем локальный кеш при ошибке
    const cachedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
    if (cachedTasks[taskId]) {
      return {
        success: true,
        task: cachedTasks[taskId],
        fromCache: true
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Заменяем существующие функции API на функции облачного хранилища
window.saveTaskToDatabase = saveTaskToCloud;
window.loadTaskFromDatabase = loadTaskFromCloud;

// Проверяем наличие задания в URL и загружаем его
async function checkForSharedTask() {
  console.log('Проверка URL на наличие ID задания');
  
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('task');
  
  if (taskId) {
    console.log('Найден ID задания в URL:', taskId);
    
    try {
      const result = await loadTaskFromCloud(taskId);
      
      if (result.success) {
        console.log('Задание успешно загружено, открываем предпросмотр');
        
        // Запускаем предпросмотр
        if (typeof window.previewTask === 'function') {
          window.previewTask(result.task);
        } else {
          console.error('Функция previewTask не найдена');
          alert('Не удалось открыть задание: функция предпросмотра не найдена');
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

// Проверяем наличие задания при загрузке страницы
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(checkForSharedTask, 1000);
} else {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(checkForSharedTask, 1000);
  });
}
