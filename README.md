# Telegram Posts Parser | Парсер постов Telegram

[English](#english) | [Русский](#русский)

---

<a name="english"></a>
# English

## ✨ Features

- 🔍 **Smart Search**: Automatically collects links to posts in Telegram based on specified keywords
- 🤖 **Automated Browsing**: Uses Puppeteer with fingerprinting to automate Telegram Web
- 📝 **Logging**: Comprehensive logging in English for easy debugging
- ⚙️ **Configurable**: Easy-to-configure keywords and search terms
- 💾 **File Output**: Saves extracted links to timestamped text files

## 📋 Requirements

- Node.js (v16 or higher)
- npm or yarn
- Active Telegram account

## 🚀 Installation

0. **Open terminal**

1. **Clone the repository**
   ```bash
   git clone https://github.com/akoody/tg-parse-posts.git
   cd tg-parse-posts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your settings**
   
   Edit `src/config.js` to set your search keywords and text:
   ```javascript
   export const keywords = 'giveaway tickets stars'; // Search keywords separated by spaces
   export const searchText = 'giveaway'; // Search text in the search bar
   ```

## ⚙️ Configuration

### Basic Configuration

Open `src/config.js` and modify:

- **`keywords`**: Space-separated keywords to search for in posts (e.g., `'giveaway tickets points'`)
- **`searchText`**: The text to enter in Telegram's search bar (e.g., `'giveaway'`)

## 🎯 Usage

1. **Start the parser**
   ```bash
   npm start
   ```
   or
   ```bash
   node src/index.js
   ```

   ⚠️ **Important**: After running the script, wait for the browser to download and the fingerprint to be obtained. This may take a time on the first run.

2. **Authorize in Telegram**
   - A browser window will open
   - You have 6 minutes to manually log in to Telegram Web
   - Wait for the authorization confirmation message
   - The authorized session will be saved, so you won't need to authorize on subsequent runs

3. **Wait for processing**
   - The parser will automatically:
     - Go through each channel one by one and check the latest posts containing your keywords
     - Extract links from relevant posts
     - Save links to a timestamped file

4. **Check results**
   - Links are saved to files named: `telegram_links_YYYY-MM-DD_HH-MM-SS.txt`
   - Files are created in the project root directory

## 📁 Project Structure

```
parsePosts/
├── src/
│   ├── index.js          # Main entry point
│   ├── config.js         # Configuration (keywords, paths)
│   ├── utils.js          # Utility functions (scrolling, file operations)
│   └── postProcessor.js  # Core post processing logic
├── package.json
└── README.md
```

## 🔧 How It Works

1. **Browser Launch**: Starts a headless browser with fingerprinting
2. **Telegram Login**: Waits for manual authorization
3. **Search**: Navigates to Telegram Web and searches for posts
4. **Channel Processing**: Iterates through channels in search results
5. **Keyword Detection**: Finds posts containing specified keywords
6. **Link Extraction**: Extracts links from relevant posts
7. **File Saving**: Saves all extracted links to a text file

## 📝 Output

The parser creates a text file containing extracted links to posts:

```
telegram_links_2025-01-15_14-30-45.txt
```

## ⚠️ Important Notes

- **Manual Authorization**: You need to manually log in to Telegram Web when the browser opens
- **Time Limit**: You have 6 minutes to complete authorization
- **Browser Profile**: Your browser profile is saved in `telegram_profile/` directory
- **Fingerprint**: Browser fingerprint is saved in `telegram_fingerprint.json`
- **Rate Limiting**: The parser includes random delays to avoid detection

## 📦 Dependencies

- **puppeteer-with-fingerprints**: Browser automation with fingerprinting
- **fs/promises**: File system operations

## 📄 License

Custom License - See [LICENSE](LICENSE) file for details.

**Key points:**
- ✅ You can use, modify, and distribute this code
- ✅ You must include copyright notice
- ❌ You cannot claim this code as your own
- ❌ You cannot sell this code as your own product without permission

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

<a name="русский"></a>
# Русский

## ✨ Возможности

- 🔍 **Умный поиск**: Автоматически собирает ссылки на посты в Telegram по указанным ключевым словам
- 🤖 **Автоматизированный браузинг**: Использует Puppeteer с отпечатками для автоматизации Telegram Web
- 📝 **Логирование**: Подробное логирование на английском языке для удобной отладки
- ⚙️ **Настраиваемый**: Легко настраиваемые ключевые слова и поисковые запросы
- 💾 **Вывод в файл**: Сохраняет извлеченные ссылки в файлы с временными метками

## 📋 Требования

- Node.js (v16 или выше)
- npm или yarn
- Активный аккаунт Telegram

## 🚀 Установка

0. **Откройте терминал**

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/akoody/tg-parse-posts.git
   cd tg-parse-posts
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Настройте параметры**
   
   Отредактируйте `src/config.js`, чтобы установить ключевые слова и текст поиска:
   ```javascript
   export const keywords = 'розыгрыш билет звезды'; // Ключевые слова для поиска, разделенные пробелами
   export const searchText = 'розыгрыш'; // Текст для поиска в строке поиска
   ```

## ⚙️ Конфигурация

### Базовая конфигурация

Откройте `src/config.js` и измените:

- **`keywords`**: Ключевые слова для поиска в постах, разделенные пробелами (например, `'розыгрыш билет очки'`)
- **`searchText`**: Текст для ввода в строку поиска Telegram (например, `'розыгрыш'`)

## 🎯 Использование

1. **Запустите парсер**
   ```bash
   npm start
   ```
   или
   ```bash
   node src/index.js
   ```

   ⚠️ **Важно**: После запуска скрипта подождите, пока скачается браузер и возьмется отпечаток. Это может занять время при первом запуске.

2. **Авторизуйтесь в Telegram**
   - Откроется окно браузера
   - У вас есть 6 минут для ручного входа в Telegram Web
   - Дождитесь сообщения о подтверждении авторизации
   - Авторизованная сессия сохранится и последующие входы авторизовываться не надо будет

3. **Дождитесь обработки**
   - Парсер автоматически:
     - Будет заходить в каждый канал по очереди и смотреть последние посты, содержащие ваши ключевые слова
     - Извлечет ссылки из соответствующих постов
     - Сохранит ссылки в файл с временной меткой

4. **Проверьте результаты**
   - Ссылки сохраняются в файлы с именами: `telegram_links_ГГГГ-ММ-ДД_ЧЧ-ММ-СС.txt`
   - Файлы создаются в корневой директории проекта

## 📁 Структура проекта

```
parsePosts/
├── src/
│   ├── index.js          # Главная точка входа
│   ├── config.js         # Конфигурация (ключевые слова, пути)
│   ├── utils.js          # Утилитарные функции (прокрутка, операции с файлами)
│   └── postProcessor.js  # Основная логика обработки постов
├── package.json
└── README.md
```

## 🔧 Как это работает

1. **Запуск браузера**: Запускает браузер с отпечатками
2. **Вход в Telegram**: Ожидает ручной авторизации
3. **Поиск**: Переходит на Telegram Web и ищет посты
4. **Обработка каналов**: Проходит по каналам в результатах поиска
5. **Обнаружение ключевых слов**: Находит посты, содержащие указанные ключевые слова
6. **Извлечение ссылок**: Извлекает ссылки из соответствующих постов
7. **Сохранение в файл**: Сохраняет все извлеченные ссылки в текстовый файл

## 📝 Вывод

Парсер создает текстовый файл, содержащий извлеченные ссылки на посты:

```
telegram_links_2025-01-15_14-30-45.txt
```

## ⚠️ Важные замечания

- **Ручная авторизация**: Вам нужно вручную войти в Telegram Web, когда откроется браузер
- **Ограничение по времени**: У вас есть 6 минут для завершения авторизации
- **Профиль браузера**: Ваш профиль браузера сохраняется в директории `telegram_profile/`
- **Отпечаток**: Отпечаток браузера сохраняется в `telegram_fingerprint.json`
- **Ограничение скорости**: Парсер включает случайные задержки для избежания обнаружения


## 📦 Зависимости

- **puppeteer-with-fingerprints**: Автоматизация браузера с отпечатками
- **fs/promises**: Операции с файловой системой

## 📄 Лицензия

Пользовательская лицензия - см. файл [LICENSE](LICENSE) для подробностей.

**Основные пункты:**
- ✅ Вы можете использовать, изменять и распространять этот код
- ✅ Вы должны включить уведомление об авторских правах
- ❌ Вы не можете выдавать этот код за свой
- ❌ Вы не можете продавать этот код как свой продукт без разрешения

## 🤝 Вклад в проект

Вклад приветствуется! Пожалуйста, не стесняйтесь отправлять Pull Request.

## 📧 Поддержка

Если вы столкнулись с проблемами или у вас есть вопросы, пожалуйста, откройте issue на GitHub.
