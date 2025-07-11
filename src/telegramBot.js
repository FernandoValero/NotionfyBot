require('dotenv').config();
const TelegramService = require('./services/telegramService');
const GroqIAService = require('./services/groqIAService');
const UserStatsService = require('./services/userStatsService');
const CronService = require('./tasks/cronService');
const CommandHandler = require('./handlers/commandHandler');
const MessageHandler = require('./handlers/messageHandler');

const { telegramToken } = require('./config');
const DatabaseConnection = require('./config/database');

class TelegramBot {
    constructor() {
        this.initializeDatabase();
        this.bot = new TelegramService(telegramToken);
        this.userStatsService = new UserStatsService();
        this.iaService = new GroqIAService(this.userStatsService);
        this.commandHandler = new CommandHandler(this.bot, this.iaService, this.userStatsService);
        this.messageHandler = new MessageHandler(this.bot, this.iaService, this.userStatsService);

        this.cronService = new CronService(this.bot, this.userStatsService);

        this.initializeBot();
    }

    async initializeDatabase() {
        try {
            await DatabaseConnection.connect();
        } catch (error) {
            console.error('Failed to connect to database:', error);
            process.exit(1);
        }
    }

    initializeBot() {
        this.setupCommands();
        this.setupMessageHandler();
        this.setupAdminCommands();
        this.setupGracefulShutdown();
    }

    setupCommands() {
        this.bot.onCommand('angular_question', (msg) =>
            this.commandHandler.handleQuestion(msg, 'angular')
        );

        this.bot.onCommand('java_question', (msg) =>
            this.commandHandler.handleQuestion(msg, 'java')
        );

        this.bot.onCommand('vocabulary_english_question', (msg) =>
            this.commandHandler.handleQuestion(msg, 'vocabulary_english')
        );

        this.bot.onCommand('angular_tip', (msg) =>
            this.commandHandler.handleTip(msg, 'angular')
        );

        this.bot.onCommand('java_tip', (msg) =>
            this.commandHandler.handleTip(msg, 'java')
        );

        this.bot.onCommand('vocabulary_english_tip', (msg) =>
            this.commandHandler.handleTip(msg, 'vocabulary_english')
        );

        this.bot.onCommand('stats', (msg) =>
            this.commandHandler.handleStats(msg)
        );

        this.bot.onCommand('chat', (msg) =>
            this.commandHandler.handleFreeChat(msg)
        );

        this.bot.onCommand('help', (msg) =>
            this.commandHandler.handleHelp(msg)
        );

        this.bot.onCommand('start', (msg) =>
            this.commandHandler.handleStart(msg)
        );

        this.bot.onCommand('name_user', (msg) =>
            this.commandHandler.handleUserName(msg)
        );
    }

    setupAdminCommands() {
        this.bot.onCommand('admin_stats', async (msg) => {
            await this.handleAdminStats(msg);
        });

        this.bot.onCommand('admin_test_cron', async (msg) => {
            await this.handleTestCron(msg);
        });

        this.bot.onCommand('admin_cron_status', async (msg) => {
            await this.handleCronStatus(msg);
        });

        this.bot.onCommand('admin_stop_cron', async (msg) => {
            await this.handleStopCron(msg);
        });

        this.bot.onCommand('admin_start_cron', async (msg) => {
            await this.handleStartCron(msg);
        });
    }

    async handleAdminStats(msg) {
        const chatId = msg.chat.id;

        try {
            const stats = await this.userStatsService.getUsersStats();
            await this.bot.enviarEstadisticasBot(chatId, stats);
        } catch (error) {
            console.error('Error getting admin stats:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al obtener estadísticas administrativas.");
        }
    }

    async handleTestCron(msg) {
        const chatId = msg.chat.id;
        const text = msg.text.split(' ');

        if (text.length < 3) {
            await this.bot.enviarMensaje(chatId,
                "🔧 **Comando de prueba de cron:**\n\n" +
                "Uso: `/admin_test_cron [subject] [type]`\n\n" +
                "**Subjects:** angular, java, vocabulary_english\n" +
                "**Types:** tip, question\n\n" +
                "**Ejemplo:** `/admin_test_cron angular tip`"
            );
            return;
        }

        const subject = text[1];
        const type = text[2];

        try {
            await this.cronService.testSendContent(subject, type);
            await this.bot.enviarMensaje(chatId,
                `✅ Test de cron ejecutado: ${type} de ${subject}`
            );
        } catch (error) {
            console.error('Error testing cron:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al ejecutar test de cron.");
        }
    }

    async handleCronStatus(msg) {
        const chatId = msg.chat.id;

        try {
            const status = this.cronService.getJobsStatus();
            const activeJobs = status.filter(job => job.running).length;
            const totalJobs = status.length;

            const message =
                `⏰ **Estado de Cron Jobs**\n\n` +
                `📊 **Resumen:**\n` +
                `• Jobs activos: ${activeJobs}/${totalJobs}\n` +
                `• Jobs programados: ${status.filter(job => job.scheduled).length}\n\n` +
                `🕐 **Horarios programados:**\n` +
                `**Tips:**\n` +
                `• Inglés: 09:00, 16:00\n` +
                `• Java: 11:00, 18:00\n` +
                `• Angular: 13:00, 20:00\n\n` +
                `**Preguntas:**\n` +
                `• Inglés: 10:00, 15:00\n` +
                `• Java: 12:00, 17:00\n` +
                `• Angular: 14:00, 19:00\n\n` +
                `⏰ Timezone: America/Argentina/Buenos_Aires`;

            await this.bot.enviarMensaje(chatId, message);
        } catch (error) {
            console.error('Error getting cron status:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al obtener estado de cron.");
        }
    }

    async handleStopCron(msg) {
        const chatId = msg.chat.id;

        try {
            this.cronService.stopAllJobs();
            await this.bot.enviarMensaje(chatId, "🛑 Todos los cron jobs han sido detenidos.");
        } catch (error) {
            console.error('Error stopping cron jobs:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al detener cron jobs.");
        }
    }

    async handleStartCron(msg) {
        const chatId = msg.chat.id;

        try {
            this.cronService.startAllJobs();
            await this.bot.enviarMensaje(chatId, "▶️ Todos los cron jobs han sido iniciados.");
        } catch (error) {
            console.error('Error starting cron jobs:', error);
            await this.bot.enviarMensaje(chatId, "❌ Error al iniciar cron jobs.");
        }
    }

    setupMessageHandler() {
        this.bot.onMessage((msg) =>
            this.messageHandler.handleMessage(msg)
        );
    }

    setupGracefulShutdown() {
        process.on('SIGINT', async () => {
            console.log("🛑 Cerrando bot...");

            try {
                if (this.cronService) {
                    this.cronService.stopAllJobs();
                }

                this.bot.stop();
                await DatabaseConnection.disconnect();
                console.log("✅ Bot cerrado correctamente");
            } catch (error) {
                console.error("❌ Error al cerrar:", error);
            }

            process.exit(0);
        });
    }
}

const telegramBot = new TelegramBot();

module.exports = TelegramBot;