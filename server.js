const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'messages.json');

// 🔥 Список сайтов, откуда автоматически забираем данные
const SOURCES = [
    'https://sus-ft65.onrender.com',
    'https://local-j1ry.onrender.com',
    'https://example.com/api/messages' // можно добавлять другие
];

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// 📥 Загружаем сохранённые сообщения
const loadMessages = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
        console.error("Ошибка загрузки сообщений:", err);
        return [];
    }
};

// 💾 Сохраняем сообщения
const saveMessages = (messages) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
    } catch (err) {
        console.error("Ошибка сохранения сообщений:", err);
    }
};

// 🔄 Автоматически загружаем данные со всех сайтов
app.get('/fetch-messages', async (req, res) => {
    let allMessages = loadMessages();

    for (const url of SOURCES) {
        try {
            const response = await axios.get(url);
            if (Array.isArray(response.data)) {
                allMessages.push(...response.data);
            } else {
                console.warn(`⚠ Ошибка: ${url} вернул не массив JSON`);
            }
        } catch (error) {
            console.error(`❌ Ошибка при запросе к ${url}:`, error.message);
        }
    }

    saveMessages(allMessages);
    res.json(allMessages);
});

// 📩 Любой может отправить данные
app.post('/send-message', (req, res) => {
    const messages = loadMessages();
    const newMessage = req.body;

    if (!newMessage || !newMessage.text) {
        return res.status(400).json({ error: "Сообщение должно содержать текст" });
    }

    messages.push(newMessage);
    saveMessages(messages);

    res.json({ success: true, message: "Сообщение сохранено" });
});

// 📤 Отдаём все сохранённые данные
app.get('/messages', (req, res) => {
    res.json(loadMessages());
});

// 🚀 Запускаем сервер
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
