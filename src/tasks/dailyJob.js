const cron = require('node-cron');
const { obtenerTipAleatorio } = require('../services/notionService');
const { enviarTip } = require('../services/messagingService');

function programarEnvioDiario() {
    // 21:19 todos los días
    cron.schedule('22 00 * * *', async () => {
        console.log("⏰ Ejecutando tarea programada: Enviar tip");
        const tip = await obtenerTipAleatorio();
        await enviarTip(tip);
    });
}

module.exports = { programarEnvioDiario };
