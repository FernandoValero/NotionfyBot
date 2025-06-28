const TelegramBot = require('node-telegram-bot-api');
const { telegramToken, chatId } = require('../config');

console.log("🔍 Debug del servicio de mensajería:");
console.log("📱 Chat ID:", chatId);
console.log("🤖 Telegram Token existe:", !!telegramToken);
console.log("🤖 Telegram Token longitud:", telegramToken ? telegramToken.length : 0);
console.log("🤖 Telegram Token empieza con número:", telegramToken ? /^\d/.test(telegramToken) : false);

// Verificar que el token esté presente antes de crear el bot
if (!telegramToken) {
    console.error('❌ TELEGRAM_TOKEN no está configurado en las variables de entorno');
    console.error('❌ Variable recibida:', telegramToken);
    throw new Error('TELEGRAM_TOKEN no está configurado en las variables de entorno');
}

if (!chatId) {
    console.error('❌ CHAT_ID no está configurado en las variables de entorno');
    console.error('❌ Variable recibida:', chatId);
    throw new Error('CHAT_ID no está configurado en las variables de entorno');
}

let bot;
try {
    bot = new TelegramBot(telegramToken);
    console.log("✅ Bot de Telegram inicializado correctamente");
} catch (error) {
    console.error("❌ Error al inicializar el bot de Telegram:", error.message);
    throw error;
}

async function enviarTip(mensaje) {
    try {
        console.log(`📤 Enviando mensaje al chat ${chatId}...`);
        console.log(`📝 Mensaje: ${mensaje.substring(0, 100)}...`);

        const result = await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
        console.log("✅ Tip enviado a Telegram exitosamente");
        console.log("📊 Resultado del envío:", result.message_id);

    } catch (error) {
        console.error("❌ Error al enviar el mensaje por Telegram:", error.message);
        console.error("❌ Código de error:", error.code);
        console.error("❌ Respuesta completa:", error.response?.body);
        throw error;
    }
}

module.exports = { enviarTip };