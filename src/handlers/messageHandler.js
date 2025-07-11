class MessageHandler {
    constructor(bot, iaService, userStatsService) {
        this.bot = bot;
        this.iaService = iaService;
        this.userStatsService = userStatsService;
    }

    async handleMessage(msg) {
        const chatId = msg.chat.id;
        const texto = msg.text;

        if (texto.startsWith('/')) return;

        try {
            const isFreeChatMode = await this.userStatsService.isInFreeChatMode(chatId);

            if (isFreeChatMode) {
                await this.handleFreeChatMessage(chatId, texto);
                return;
            }

            const currentQuestion = await this.userStatsService.getCurrentQuestion(chatId);

            if (!currentQuestion || !currentQuestion.question) {
                await this.sendHelpMessage(chatId);
                return;
            }

            await this.evaluateAnswer(chatId, texto, currentQuestion);

        } catch (error) {
            console.error('Error handling message:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al procesar tu mensaje.");
        }
    }

    async handleFreeChatMessage(chatId, texto) {
        try {
            if (texto.toLowerCase().includes('salir') || texto.toLowerCase().includes('exit')) {
                await this.userStatsService.setFreeChatMode(chatId, false);
                await this.bot.enviarMensaje(chatId,
                    "👋 Has salido del modo chat libre. Usa `/help` para ver los comandos disponibles."
                );
                return;
            }

            const response = await this.iaService.generarRespuestaLibre(texto, chatId);
            await this.bot.enviarMensaje(chatId,
                `🤖 ${response}\n\n_💡 Escribe "salir" para volver al modo normal_`
            );
        } catch (error) {
            console.error('Error in free chat message:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al generar respuesta.");
        }
    }

    async evaluateAnswer(chatId, userAnswer, currentQuestion) {
        const { question, correctAnswer, example, usage, category, theme } = currentQuestion;

        try {
            const evaluacion = await this.iaService.evaluarRespuesta(
                question,
                correctAnswer,
                userAnswer,
                theme,
                {
                    example: example,
                    use: usage,
                    category: category
                },
                chatId
            );

            let respuestaCorrectaMejorada = "";
            if (evaluacion.puntuacion < 60) {
                console.log("🛑 Mejorando la respuesta...");
                respuestaCorrectaMejorada = await this.iaService.mejorarRespuestaCorrecta(
                    correctAnswer,
                    { tema: theme, question }
                );
            }

            await this.userStatsService.updateStats(chatId, evaluacion.esCorrecta);

            await this.bot.enviarFeedback(chatId, evaluacion, {
                respuestaCorrecta: respuestaCorrectaMejorada,
                example,
                usage,
                category
            });

            await this.userStatsService.clearCurrentQuestion(chatId);

        } catch (error) {
            console.error('Error evaluating answer:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al evaluar tu respuesta.");
        }
    }

    async sendHelpMessage(chatId) {
        const helpMessage =
            "💡 **¿Qué puedes hacer?**\n\n" +
            "📚 **Preguntas:**\n" +
            "/vocabulary\\_english\\_question - Pregunta de vocabulario\n" +
            "/angular\\_question - Pregunta sobre Angular\n" +
            "/java\\_question - Pregunta sobre Java\n\n" +
            "💡 **Tips:**\n" +
            "/vocabulary\\_english\\_tip - Tip de vocabulario\n" +
            "/angular\\_tip - Tip de Angular\n" +
            "/java\\_tip - Tip de Java\n\n" +
            "💬 **Chat libre:**\n" +
            "/chat [mensaje] - Conversa con la IA\n\n" +
            "📊 **Estadísticas:**\n"  +
            "/stats - Ver estadísticas\n\n" +
            "❓ **Ayuda:**\n" +
            "/help - Ver ayuda completa";

        await this.bot.enviarMensaje(chatId, helpMessage);
    }
}

module.exports = MessageHandler;