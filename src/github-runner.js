const { obtenerTipAleatorio } = require('./services/notionService');
const { enviarTip } = require('./services/messagingService');
const config = require("./config");

(async () => {
    try {
        console.log("🚀 Iniciando envío de tip diario...");
        console.log("\n📋 Variables desde config:");
        console.log("- NOTION_TOKEN:", config.notionToken ? `✅ (${config.notionToken.length} chars)` : "❌ undefined");
        console.log("- DATABASE_ID:", config.databaseId ? `✅ (${config.databaseId.length} chars)` : "❌ undefined");
        console.log("- TELEGRAM_TOKEN:", config.telegramToken ? `✅ (${config.telegramToken.length} chars)` : "❌ undefined");
        console.log("- CHAT_ID:", config.chatId ? `✅ (${config.chatId})` : "❌ undefined");

        // Obtener tip aleatorio de Notion
        const mensaje = await obtenerTipAleatorio();
        console.log("📝 Tip obtenido:", mensaje.substring(0, 50) + "...");

        // Enviar tip por Telegram
        await enviarTip(mensaje);

        console.log("✅ Proceso completado exitosamente");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error en el proceso:", error.message);
        process.exit(1);
    }
})();