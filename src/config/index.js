if (!process.env.GITHUB_ACTIONS) {
    try {
        require('dotenv').config();
    } catch (error) {
        console.log("ℹ️ No se encontró archivo .env ");
    }
}
module.exports = {
    notionToken: process.env.NOTION_TOKEN,
    databaseId: process.env.NOTION_DATABASE_ID || process.env.DATABASE_ID, // POR ALGUNA RAZON NO RECONOCE LOS SECRETS CON EL NOMBRE CORRECTO (NO TOCAR O DEJA DE FUNCIONAR XD)
    telegramToken: process.env.TELEGRAM_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID // POR ALGUNA RAZON NO RECONOCE LOS SECRETS CON EL NOMBRE CORRECTO (NO TOCAR O DEJA DE FUNCIONAR XD)
};