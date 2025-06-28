const TelegramBot = require('node-telegram-bot-api');
const { telegramToken, chatId } = require('../config');

const bot = new TelegramBot(telegramToken);

async function enviarTip(mensaje) {
    try {
        await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
        console.log("✅ Tip enviado a Telegram.");
    } catch (error) {
        console.error("❌ Error al enviar el mensaje por Telegram:", error.message);
    }
}

module.exports = { enviarTip };
