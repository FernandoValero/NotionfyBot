if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_ACTIONS) {
    require('dotenv').config();
}

module.exports = {
    notionToken: process.env.NOTION_TOKEN,
    databaseId: process.env.NOTION_DATABASE_ID,
    telegramToken: process.env.TELEGRAM_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
};