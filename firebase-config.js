// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyAZfDX2lKtIUiH0w4iGTq14HnqWb8QY2-4",
  authDomain: "tapsyr-8e54a.firebaseapp.com",
  projectId: "tapsyr-8e54a",
  storageBucket: "tapsyr-8e54a.appspot.com",
  messagingSenderId: "789123456789",
  appId: "1:789123456789:web:1a2b3c4d5e6f7g8h9i0j1k"
};

// Глобальные переменные для Firebase
let db;
let tasksCollection;
let firebaseInitialized = false;

// Пробуем инициализировать Firebase
try {
  console.log("Начинаем инициализацию Firebase");
  firebase.initializeApp(firebaseConfig);
  
  // Получаем ссылку на базу данных
  db = firebase.firestore();
  tasksCollection = db.collection('tasks');
  firebaseInitialized = true;
  console.log("Успешная инициализация Firebase");
} catch (error) {
  console.error("Ошибка при инициализации Firebase:", error);
  alert('Ошибка при подключении к базе данных: ' + error.message);
}

// Функция для сохранения задания в Firestore
async function saveTaskToDatabase(task) {
  try {
    // Проверяем, инициализирован ли Firebase
    if (!firebaseInitialized) {
      console.warn('Сохранение в Firebase невозможно: Firebase не инициализирован');
      return {
        success: false,
        error: 'Firebase не инициализирован. Используем локальное хранилище.'
      };
    }
    
    // Генерируем уникальный ID если его нет
    if (!task.shareId) {
      task.shareId = generateUniqueId();
    }
    
    // Удаляем объемные данные изображений перед сохранением (если они есть)
    const taskToSave = JSON.parse(JSON.stringify(task));
    
    // Преобразуем изображения для более эффективного хранения
    if (taskToSave.type === 'match' && taskToSave.pairs) {
      taskToSave.pairs = taskToSave.pairs.map(pair => {
        if (pair.imageData && pair.imageData.length > 10000) {
          // Сохраняем только первые 100 символов для идентификации, что это изображение
          // В реальном проекте здесь можно было бы загрузить изображения в Storage
          pair.imageDataCompressed = true;
          pair.imageData = pair.imageData.substring(0, 100) + '...';
        }
        return pair;
      });
    }
    
    // Сохраняем в Firestore
    await tasksCollection.doc(task.shareId).set(taskToSave);
    
    // Формируем URL для шаринга
    const shareUrl = `${window.location.origin}${window.location.pathname}?task=${task.shareId}`;
    
    return {
      success: true,
      shareUrl: shareUrl,
      shareId: task.shareId
    };
  } catch (error) {
    console.error('Ошибка при сохранении задания в базу данных:', error);
    return {
      success: false,
      error: 'Не удалось сохранить задание: ' + error.message
    };
  }
}

// Функция для загрузки задания из Firestore
async function loadTaskFromDatabase(shareId) {
  try {
    // Проверяем, инициализирован ли Firebase
    if (!firebaseInitialized) {
      console.warn('Загрузка из Firebase невозможна: Firebase не инициализирован');
      return {
        success: false,
        error: 'Firebase не инициализирован. Проверяем локальное хранилище.'
      };
    }
    
    console.log('Загрузка задания из Firestore:', shareId);
    // Пробуем загрузить из Firestore
    const doc = await tasksCollection.doc(shareId).get();
    
    if (doc.exists) {
      const task = doc.data();
      
      // Локально кешируем задание
      const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
      sharedTasks[shareId] = task;
      localStorage.setItem('tapsyr-shared-tasks', JSON.stringify(sharedTasks));
      
      return {
        success: true,
        task: task
      };
    } else {
      // Проверяем в localStorage в качестве резервного варианта
      const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
      
      if (sharedTasks[shareId]) {
        return {
          success: true,
          task: sharedTasks[shareId],
          fromCache: true
        };
      }
      
      return {
        success: false,
        error: 'Задание не найдено в базе данных'
      };
    }
  } catch (error) {
    console.error('Ошибка при загрузке задания из базы данных:', error);
    
    // Проверяем в localStorage в качестве резервного варианта
    const sharedTasks = JSON.parse(localStorage.getItem('tapsyr-shared-tasks') || '{}');
    
    if (sharedTasks[shareId]) {
      return {
        success: true,
        task: sharedTasks[shareId],
        fromCache: true
      };
    }
    
    return {
      success: false,
      error: 'Не удалось загрузить задание: ' + error.message
    };
  }
}

// Вспомогательная функция для генерации уникального ID
function generateUniqueId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
