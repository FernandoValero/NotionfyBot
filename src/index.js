const { obtenerTipAleatorio } = require('./services/notionService');
const { enviarTip } = require('./services/messagingService');
const { notionToken } = require('./config');
const { programarEnvioDiario } = require('./tasks/dailyJob');

(async () => {
    const mensaje = await obtenerTipAleatorio();
    console.log("Token:", notionToken);
    console.log("👋 Bot iniciado correctamente. Tip de prueba:\n", mensaje);
})();

programarEnvioDiario();
