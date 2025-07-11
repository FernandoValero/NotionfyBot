const { getAngularTip } = require('../services/notionAngularService');
const { getJavaTip } = require('../services/notionJavaService');
const { getEnglishVocabularyTip } = require('../services/notionEnglishVocabularyService');

class CommandHandler {
    constructor(bot, iaService, userStatsService) {
        this.bot = bot;
        this.iaService = iaService;
        this.userStatsService = userStatsService;

        this.contentServices = {
            angular: getAngularTip,
            java: getJavaTip,
            vocabulary_english: getEnglishVocabularyTip
        };

        this.verifyServices();
    }

    async verifyServices() {
        try {
            const isWorking = await this.iaService.testConnection();
            if (isWorking) {
                console.log('✅ GroqIA service is working');
            } else {
                console.warn('⚠️ GroqIA service test failed');
            }
        } catch (error) {
            console.error('❌ Error verifying GroqIA service:', error);
        }
    }

    async handleQuestion(msg, subject) {
        const chatId = msg.chat.id;
        const type = "question";

        try {
            const questionData = await this.contentServices[subject](type);

            if (questionData) {
                await this.bot.enviarPregunta(chatId, questionData);
                await this.userStatsService.setCurrentQuestion(chatId, questionData);
            } else {
                await this.bot.enviarMensaje(chatId, "⚠️ No hay preguntas disponibles en este momento.");
            }
        } catch (error) {
            console.error(`Error getting ${subject} question:`, error);
            await this.bot.enviarMensaje(chatId, "❌ Error al obtener la pregunta. Intenta nuevamente.");
        }
    }

    async handleTip(msg, subject) {
        const chatId = msg.chat.id;
        const type = "tip";

        try {
            const tipData = await this.contentServices[subject](type);

            if (tipData) {
                await this.bot.enviarTip(chatId, tipData);
            } else {
                await this.bot.enviarMensaje(chatId, "⚠️ No hay tips disponibles en este momento.");
            }
        } catch (error) {
            console.error(`Error getting ${subject} tip:`, error);
            await this.bot.enviarMensaje(chatId, "❌ Error al obtener el tip. Intenta nuevamente.");
        }
    }

    async handleStats(msg) {
        const chatId = msg.chat.id;

        try {
            const stats = await this.userStatsService.getUserStats(chatId);
            await this.bot.enviarEstadisticas(chatId, stats);
        } catch (error) {
            console.error('Error getting stats:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al obtener estadísticas.");
        }
    }

    async handleFreeChat(msg) {
        const chatId = msg.chat.id;
        const fullText = msg.text || '';
        const message = fullText.replace('/chat', '').trim();

        if (!message) {
            await this.bot.enviarMensaje(chatId,
                "💬 Para chatear conmigo, usa: `/chat tu mensaje`\n\n" +
                "Ejemplo: `/chat ¿Cuál es la diferencia entre let y var en JavaScript?`"
            );
            return;
        }

        try {
            if (!this.iaService) {
                throw new Error('Servicio de IA no disponible');
            }

            await this.userStatsService.setFreeChatMode(chatId, true);

            try {
                await this.bot.sendChatAction(chatId, 'typing');
            } catch (actionError) {
            }

            const response = await this.iaService.generarRespuestaLibre(message,chatId);

            if (!response || response.trim() === '') {
                throw new Error('Respuesta vacía de la IA');
            }

            await this.bot.enviarMensaje(chatId, `🤖 ${response.trim()}`);

        } catch (error) {
            console.error('Error in free chat:', error);

            let errorMessage = "❌ Error al procesar tu mensaje.";

            if (error.message.includes('autenticación') || error.message.includes('API key')) {
                errorMessage = "❌ Error de configuración del servicio de IA.";
            } else if (error.message.includes('límite') || error.message.includes('rate limit')) {
                errorMessage = "⏰ Límite de uso alcanzado. Intenta en unos minutos.";
            } else if (error.message.includes('conexión') || error.message.includes('network')) {
                errorMessage = "🌐 Error de conexión. Verifica tu internet e intenta nuevamente.";
            }

            await this.bot.enviarMensaje(chatId, errorMessage);
        }
    }

    async handleHelp(msg) {
        const chatId = msg.chat.id;
        const helpMessage =
            "🤖 **Comandos disponibles:**\n\n" +
            "📚 **Preguntas:**\n" +
            "/angular\\_question - Pregunta sobre Angular\n" +
            "/java\\_question - Pregunta sobre Java\n" +
            "/vocabulary\\_english\\_question - Pregunta de vocabulario en inglés\n\n" +
            "💡 **Tips:**\n" +
            "/angular\\_tip - Tip sobre Angular\n" +
            "/java\\_tip - Tip sobre Java\n" +
            "/vocabulary\\_english\\_tip - Tip de vocabulario en inglés\n\n" +
            "💬 **Chat libre:**\n" +
            "/chat [mensaje] - Conversa libremente con la IA\n" +
            "Ejemplo: `/chat explícame qué es un array`\n\n" +
            "👤 **Perfil:**\n" +
            "/name\\_user [nombre] - Establece tu nombre de usuario\n" +
            "Ejemplo: `/name_user Juan Pérez`\n\n" +
            "📊 **Otros:**\n" +
            "/stats - Ver tus estadísticas\n" +
            "/help - Mostrar esta ayuda";

        await this.bot.enviarMensaje(chatId, helpMessage);
    }

    async handleStart(msg) {
        const chatId = msg.chat.id;
        const welcomeMessage =
            "🎉 **¡Bienvenido al Bot de Aprendizaje!**\n\n" +
            "Puedo ayudarte a aprender Angular, Java y vocabulario en inglés.\n\n" +
            "**Nuevas funciones:**\n" +
            "💬 Ahora puedes chatear libremente conmigo usando `/chat`\n" +
            "📊 Todas tus estadísticas se guardan permanentemente\n" +
            "👤 Puedes establecer tu nombre con `/name_user [tu nombre]`\n\n" +
            "Usa `/help` para ver todos los comandos disponibles.\n\n" +
            "¡Empecemos a aprender! 🚀";

        await this.bot.enviarMensaje(chatId, welcomeMessage);
    }

    async handleUserName(msg) {
        const chatId = msg.chat.id;
        const fullText = msg.text || '';
        const username = fullText.replace('/name_user', '').trim();

        try {
            if (!username) {
                await this.bot.enviarMensaje(chatId,
                    "👤 **Para establecer tu nombre de usuario:**\n\n" +
                    "Usa: `/name\\_user [tu nombre]`\n\n" +
                    "**Ejemplos:**\n" +
                    "• `/name\\_user Juan Pérez`\n" +
                    "• `/name\\_user María García`\n" +
                    "• `/name\\_user Alex`\n\n" +
                    "💡 Tu nombre se guardará y aparecerá en tus estadísticas."
                );
                return;
            }

            if (username.length > 50) {
                await this.bot.enviarMensaje(chatId,
                    "⚠️ El nombre es demasiado largo. Por favor, usa un nombre de máximo 50 caracteres."
                );
                return;
            }

            const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-_.0-9]+$/;
            if (!nameRegex.test(username)) {
                await this.bot.enviarMensaje(chatId,
                    "⚠️ El nombre contiene caracteres no válidos. Solo se permiten letras, números, espacios, guiones y puntos."
                );
                return;
            }

            const currentUser = await this.userStatsService.getUser(chatId);
            const previousName = currentUser?.username;

            await this.userStatsService.setUsername(chatId, username);

            let confirmationMessage = `✅ **¡Nombre guardado exitosamente!**\n\n👤 Tu nombre: **${username}**`;

            if (previousName && previousName !== username) {
                confirmationMessage += `\n\n🔄 Nombre anterior: ${previousName}`;
            }

            confirmationMessage += "\n\n💡 Tu nombre aparecerá ahora en tus estadísticas y será recordado para futuras sesiones.";

            await this.bot.enviarMensaje(chatId, confirmationMessage);

        } catch (error) {
            console.error('Error setting username:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al guardar tu nombre. Intenta nuevamente.");
        }
    }
}

module.exports = CommandHandler;