if (!process.env.GITHUB_ACTIONS) {
    try {
        require('dotenv').config();
        console.log("📄 Archivo .env cargado para desarrollo local");
    } catch (error) {
        console.log("ℹ️ No se encontró archivo .env (normal en GitHub Actions)");
    }
} else {
    console.log("🚀 Ejecutándose en GitHub Actions - usando secrets");
}

module.exports = {
    notionToken: process.env.NOTION_TOKEN,
    databaseId: process.env.NOTION_DATABASE_ID || process.env.DATABASE_ID,
    telegramToken: process.env.TELEGRAM_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID
};