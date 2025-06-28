process.env.TZ = 'America/Argentina/Buenos_Aires';
require('dotenv').config();
const cron = require('node-cron');
const { obtenerTipAleatorio } = require('../services/notionService');
const { enviarTip } = require('../services/messagingService');


//ESTA FUNCION SOLO SE USA PARA PRUEBAS LOCALES
function programarEnvioDiario() {
    // 01:15 todos los días
    cron.schedule('03 22 * * *', async () => {
        const horaArgentina = new Date().toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour12: false
        });
        console.log(`⏰ Ejecutando tarea programada a las ${horaArgentina} (Argentina)`);
        const tip = await obtenerTipAleatorio();
        await enviarTip(tip);
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });

    cron.schedule('30 14 * * *', async () => {
        const horaArgentina = new Date().toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour12: false
        });
        console.log(`⏰ Ejecutando tarea programada a las ${horaArgentina} (Argentina)`);
        const tip = await obtenerTipAleatorio();
        await enviarTip(tip);
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });

    cron.schedule('00 10 * * *', async () => {
        const horaArgentina = new Date().toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour12: false
        });
        console.log(`⏰ Ejecutando tarea programada a las ${horaArgentina} (Argentina)`);
        const tip = await obtenerTipAleatorio();
        await enviarTip(tip);
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });

    cron.schedule('00 21 * * *', async () => {
        const horaArgentina = new Date().toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour12: false
        });
        console.log(`⏰ Ejecutando tarea programada a las ${horaArgentina} (Argentina)`);
        const tip = await obtenerTipAleatorio();
        await enviarTip(tip);
    }, {
        timezone: "America/Argentina/Buenos_Aires"
    });
}

module.exports = { programarEnvioDiario };
