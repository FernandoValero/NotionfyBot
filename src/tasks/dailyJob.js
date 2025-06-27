process.env.TZ = 'America/Argentina/Buenos_Aires';
require('dotenv').config();
const cron = require('node-cron');
const { obtenerTipAleatorio } = require('../services/notionService');
const { enviarTip } = require('../services/messagingService');

function programarEnvioDiario() {
    // 01:15 todos los días
    cron.schedule('15 01 * * *', () => {
        const horaArgentina = new Date().toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour12: false
        });
        console.log(`⏰ Ejecutando tarea programada a las ${horaArgentina} (Argentina)`);
        enviarTip();
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });

    cron.schedule('00 10 * * *', async () => {
        console.log("⏰ Ejecutando tarea programada: Enviar tip");
        const tip = await obtenerTipAleatorio();
        await enviarTip(tip);
    });
}

// Función para verificar zona horaria
function verificarZonaHoraria() {
    const ahora = new Date();
    console.log("🌍 Hora del servidor (UTC):", ahora.toISOString());
    console.log("🇦🇷 Hora en Argentina:", ahora.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour12: false
    }));
}

// Ejecutar al iniciar
verificarZonaHoraria();

module.exports = { programarEnvioDiario };
