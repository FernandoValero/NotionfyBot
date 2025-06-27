const { obtenerTipAleatorio } = require('./services/notionService');
const { enviarTip } = require('./services/messagingService');

(async () => {
    try {
        console.log("🚀 Iniciando envío de tip diario...");

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