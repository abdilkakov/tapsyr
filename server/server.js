// Сервер для Tapsyr с SQLite3 базой данных
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Инициализация приложения
const app = express();
const port = process.env.PORT || 3000;

// Настройка CORS для доступа с любого домена
app.use(cors());

// Парсинг JSON в запросах
app.use(bodyParser.json({limit: '50mb'}));

// Статические файлы (клиентская часть)
app.use(express.static(path.join(__dirname, '..')));

// Инициализация базы данных
const db = new sqlite3.Database(path.join(__dirname, 'tapsyr.db'), (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных', err);
  } else {
    console.log('Подключение к SQLite установлено');
    
    // Создаем таблицу для заданий, если она не существует
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Ошибка при создании таблицы', err);
      } else {
        console.log('Таблица tasks создана или уже существует');
      }
    });
  }
});

// API для сохранения задания
app.post('/api/tasks', (req, res) => {
  const task = req.body;
  
  // Проверяем наличие обязательных полей
  if (!task || !task.type || !task.title) {
    return res.status(400).json({ 
      success: false, 
      error: 'Не указаны обязательные поля (type, title)' 
    });
  }
  
  // Генерируем ID, если его нет
  if (!task.id) {
    task.id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Конвертируем объект задания в JSON-строку для хранения
  const taskData = JSON.stringify(task);
  
  // Сохраняем в базу данных
  const query = `INSERT OR REPLACE INTO tasks (id, title, type, data) VALUES (?, ?, ?, ?)`;
  db.run(query, [task.id, task.title, task.type, taskData], function(err) {
    if (err) {
      console.error('Ошибка при сохранении задания:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Ошибка при сохранении задания: ' + err.message 
      });
    }
    
    // Формируем URL для шаринга
    const shareUrl = `${req.protocol}://${req.get('host')}?task=${task.id}`;
    
    res.json({ 
      success: true, 
      id: task.id,
      shareUrl: shareUrl
    });
  });
});

// API для получения задания по ID
app.get('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  
  // Проверяем валидность ID
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Не указан ID задания'
    });
  }
  
  // Запрос к базе данных
  db.get('SELECT data FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Ошибка при загрузке задания:', err);
      return res.status(500).json({
        success: false,
        error: 'Ошибка при загрузке задания: ' + err.message
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Задание не найдено'
      });
    }
    
    try {
      // Парсим JSON-строку обратно в объект
      const task = JSON.parse(row.data);
      res.json({
        success: true,
        task: task
      });
    } catch (e) {
      console.error('Ошибка при парсинге данных задания:', e);
      res.status(500).json({
        success: false,
        error: 'Ошибка при парсинге данных задания: ' + e.message
      });
    }
  });
});

// API для получения списка всех заданий
app.get('/api/tasks', (req, res) => {
  db.all('SELECT id, title, type, created_at FROM tasks ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Ошибка при получении списка заданий:', err);
      return res.status(500).json({
        success: false,
        error: 'Ошибка при получении списка заданий: ' + err.message
      });
    }
    
    res.json({
      success: true,
      tasks: rows
    });
  });
});

// Маршрут для обработки всех остальных запросов (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`Откройте http://localhost:${port} в браузере`);
});
