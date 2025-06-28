
const { obtenerTipAleatorio } = require('./services/notionService');
const { enviarTip } = require('./services/messagingService');

(async () => {
    try {
        console.log("🚀 Iniciando envío de tip diario...");

        // Debug: mostrar el entorno
        console.log("🔍 Entorno:", process.env.GITHUB_ACTIONS ? "GitHub Actions" : "Local");

        // Verificar que las variables de entorno estén configuradas
        const requiredEnvVars = ['NOTION_TOKEN', 'TELEGRAM_TOKEN'];
        const databaseId = process.env.NOTION_DATABASE_ID || process.env.DATABASE_ID;
        const chatId = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (!databaseId) missingVars.push('NOTION_DATABASE_ID o DATABASE_ID');
        if (!chatId) missingVars.push('TELEGRAM_CHAT_ID o CHAT_ID');

        if (missingVars.length > 0) {
            console.error(`❌ Faltan variables de entorno: ${missingVars.join(', ')}`);
            console.log("🔍 Variables disponibles que empiezan con TELEGRAM:",
                Object.keys(process.env).filter(key => key.includes('TELEGRAM')));
            console.log("🔍 Variables disponibles que empiezan con NOTION:",
                Object.keys(process.env).filter(key => key.includes('NOTION')));
            process.exit(1);
        }

        console.log("✅ Variables de entorno verificadas");
        console.log(`📱 Chat ID: ${process.env.CHAT_ID}`);
        console.log(`🤖 Token configurado: ${process.env.TELEGRAM_TOKEN ? 'Sí' : 'No'}`);

        // Obtener tip aleatorio de Notion
        const mensaje = await obtenerTipAleatorio();
        console.log("📝 Tip obtenido:", mensaje.substring(0, 50) + "...");

        if (mensaje.includes("problema") || mensaje.includes("No hay tips")) {
            console.error("❌ Error al obtener el tip:", mensaje);
            process.exit(1);
        }

        // Enviar tip por Telegram
        await enviarTip(mensaje);

        console.log("✅ Proceso completado exitosamente");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error en el proceso:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
})();