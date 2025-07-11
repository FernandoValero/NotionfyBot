const TelegramBot = require('node-telegram-bot-api');
const GroqIAService = require('./groqIAService');

const iaService = new GroqIAService();

class TelegramService {

    constructor(token) {
        this.bot = new TelegramBot(token, { polling: true });
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        this.bot.on('error', (error) => {
            console.error('❌ Error en TelegramService:', error);
        });

        this.bot.on('polling_error', (error) => {
            console.error('❌ Error de polling:', error);
        });
    }


    async enviarMensaje(chatId, mensaje, opciones = {}, esFallback = false) {
        try {
            await this.bot.sendMessage(chatId, mensaje, {
                parse_mode: 'Markdown',
                ...opciones
            });
            console.error('Mensaje enviado:', mensaje);
            return true;
        } catch (error) {
            console.error('❌ Error enviando mensaje con Markdown:', error);
            console.error('🪐 Mensaje que falló:', mensaje);

            if (!esFallback) {
                try {
                    await this.bot.sendMessage(chatId, mensaje, {
                        ...opciones
                    });
                    console.error('✅ Mensaje reenviado SIN parse_mode tras error de parseo.');
                    return true;
                } catch (error2) {
                    console.error('❌ Error reenviando mensaje sin parse_mode:', error2);
                    this.enviarMensaje(chatId, "Error al procesar la respuesta, vuelve a intentarlo 🙏.", {}, true);
                    return false;
                }
            } else {
                return false;
            }
        }
    }


    async enviarTip(chatId, tipData, opciones = {}) {
        let headerEmoji = '🅰️';
        let respuestaLabel = '*Respuesta:*';

        if (tipData.theme === 'Java') headerEmoji = '☕️';
        if (tipData.theme === 'Vocabulario de Ingles') {
            headerEmoji = '🇬🇧';
            respuestaLabel = '*Significado:*';
        }

        const respuestaCorrectaMejorada = await iaService.mejorarRespuestaCorrecta(
            tipData.correctAnswer,
            {
                theme: tipData.theme,
                question: tipData.question
            }
        );

        let mensaje = '';

        if (opciones && typeof opciones === 'string' && opciones.includes('**Tip automático de')) {
            mensaje = `${opciones}${headerEmoji} *${tipData.question}*

${respuestaLabel} ${respuestaCorrectaMejorada}

*Ejemplo:* _${tipData.example}_

*Uso:* _${tipData.usage}_

*Categoría:* ${tipData.category}
*Nivel de Importancia:* ${tipData.level}`;
        } else {
            mensaje = `${headerEmoji} *${tipData.question}*

${respuestaLabel} ${respuestaCorrectaMejorada}

*Ejemplo:* _${tipData.example}_

*Uso:* _${tipData.usage}_

*Categoría:* ${tipData.category}
*Nivel de Importancia:* ${tipData.level}`;
        }

        return await this.enviarMensaje(chatId, mensaje,
            typeof opciones === 'string' ? {} : opciones
        );
    }

    async enviarPregunta(chatId, preguntaData, opciones = {}) {
        let headerEmoji = '🅰️';
        let questionLine = `*${preguntaData.question}*`;

        if (preguntaData.theme === 'Java') headerEmoji = '☕️';
        if (preguntaData.theme === 'Vocabulario de Ingles') {
            headerEmoji = '🇬🇧';
            questionLine = `*¿Cuál es el significado de ${preguntaData.question}? Escribe una oración de ejemplo.*`;
        }

        let mensaje = '';

        if (opciones && typeof opciones === 'string' && opciones.includes('**Pregunta automática de')) {
            mensaje = `${opciones}${headerEmoji} *${preguntaData.category}* | Nivel: ${preguntaData.level}

❓ ${questionLine}

💭 Escribe tu respuesta...`;
        } else {
            mensaje = `${headerEmoji} *${preguntaData.category}* | Nivel: ${preguntaData.level}

❓ ${questionLine}

💭 Escribe tu respuesta...`;
        }

        return await this.enviarMensaje(chatId, mensaje,
            typeof opciones === 'string' ? {} : opciones
        );
    }



    async enviarFeedback(chatId, evaluacion, preguntaData) {
        const emoji = evaluacion.puntuacion >= 60 ? '✅' : '❌';
        const status = evaluacion.puntuacion >= 60 ? 'CORRECTA' : 'INCORRECTA';
        const respuestaModelo = `${preguntaData.respuestaCorrecta}`;

        const respuestaModeloSection = evaluacion.puntuacion < 60
            ? `\n📚 *Respuesta modelo:*\n${respuestaModelo}\n`
            : '';

        const mensaje = `${emoji} *Respuesta ${status}*
🎯 Puntuación: ${evaluacion.puntuacion}/100

💬 *Feedback:*
${evaluacion.feedback}

💡 *Sugerencias:*
${evaluacion.sugerencias}
${respuestaModeloSection}
---
Usa los siguientes comandos para: \n
📚 **Preguntas:** 
/vocabulary\\_english\\_question - Pregunta de vocabulario 
/angular\\_question - Pregunta sobre Angular
/java\\_question - Pregunta sobre Java\n
💡 **Tips:**
/vocabulary\\_english\\_tip - Tip de vocabulario
/angular\\_tip - Tip de Angular
/java\\_tip - Tip de Java\n
💬 **Chat libre:**
/chat [mensaje] - Conversación libre\n
📊 /stats - Ver estadísticas\n
❓ /help - Ver ayuda completa`;
        return await this.enviarMensaje(chatId, mensaje);
    }




    async enviarEstadisticas(chatId, stats) {
        try {
            const {
                username,
                correctas,
                incorrectas,
                total,
                porcentajeAciertos,
                fechaRegistro,
                ultimaActividad,
                sesionesCompletadas,
                esUsuarioActivo
            } = stats;

            const fechaRegistroFormatted = fechaRegistro.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const ultimaActividadFormatted = ultimaActividad.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let emojiRendimiento = '📊';
            if (porcentajeAciertos >= 80) emojiRendimiento = '🏆';
            else if (porcentajeAciertos >= 60) emojiRendimiento = '⭐';
            else if (porcentajeAciertos >= 40) emojiRendimiento = '📈';
            else emojiRendimiento = '💪';

            let message = `${emojiRendimiento} *Tus Estadísticas*\n\n`;

            if (username) {
                message += `👤 *Usuario:* ${username}\n\n`;
            } else {
                message += `👤 *Usuario:* Sin nombre establecido\n`;
                message += `💡 Usa /name\\_user [tu nombre] para establecer tu nombre\n\n`;
            }

            message += `📈 *Rendimiento:*\n`;
            message += `✅ Correctas: *${correctas}*\n`;
            message += `❌ Incorrectas: *${incorrectas}*\n`;
            message += `📊 Total: *${total}*\n`;
            message += `🎯 Precisión: *${porcentajeAciertos}%*\n\n`;

            message += `📅 *Actividad:*\n`;
            message += `📝 Registro: ${fechaRegistroFormatted}\n`;
            message += `⏰ Última actividad: ${ultimaActividadFormatted}\n`;
            message += `🎮 Sesiones: ${sesionesCompletadas}\n`;
            message += `${esUsuarioActivo ? '🟢' : '🟡'} Estado: ${esUsuarioActivo ? 'Activo' : 'Inactivo'}\n\n`;

            if (total === 0) {
                message += `🚀 ¡Comienza tu aventura de aprendizaje!`;
            } else if (porcentajeAciertos >= 80) {
                message += `🏆 ¡Excelente trabajo, sigues mejorando!`;
            } else if (porcentajeAciertos >= 60) {
                message += `👍 ¡Buen progreso, sigue practicando!`;
            } else {
                message += `💪 ¡No te rindas, la práctica hace al maestro!`;
            }

            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown'
            });

        } catch (error) {
            console.error('Error sending statistics:', error);
            await this.bot.sendMessage(chatId, "❌ Error al enviar estadísticas.");
        }
    }

    async enviarEstadisticasBot(chatId, stats) {
        try {
            const message =
                `📊 **Estadísticas del Bot**\n\n` +
                `👥 **Usuarios:**\n` +
                `• Total registrados: ${stats.total}\n` +
                `• Usuarios activos: ${stats.active}\n` +
                `• Nuevos hoy: ${stats.newToday}\n` +
                `• Porcentaje activo: ${stats.activePercentage}%\n\n` +
                `🕐 **Último reporte:** ${new Date().toLocaleString('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires'
                })}`;

            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown'
            });

        } catch (error) {
            console.error('❌ Error enviando estadísticas del bot:', error);
            await this.enviarMensaje(chatId, "❌ Error al enviar las estadísticas.");
        }
    }

    onCommand(command, callback) {
        this.bot.onText(new RegExp(`/${command}`), callback);
    }

    onMessage(callback) {
        this.bot.on('message', callback);
    }

    stop() {
        this.bot.stopPolling();
    }
}

module.exports = TelegramService;