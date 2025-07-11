const cron = require('node-cron');
const { getAngularTip } = require('../services/notionAngularService');
const { getJavaTip } = require('../services/notionJavaService');
const { getEnglishVocabularyTip } = require('../services/notionEnglishVocabularyService');

class CronService {
    constructor(bot, userStatsService) {
        this.bot = bot;
        this.userStatsService = userStatsService;
        this.jobs = [];

        this.contentServices = {
            angular: getAngularTip,
            java: getJavaTip,
            vocabulary_english: getEnglishVocabularyTip
        };

        this.setupCronJobs();
    }

    setupCronJobs() {
        // TIPS
        // English Tips - 09:00 y 16:00
        this.jobs.push(
            cron.schedule('0 9 * * *', () => {
                this.sendScheduledContent('vocabulary_english', 'tip', '🌅 Buenos días');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        this.jobs.push(
            cron.schedule('0 16 * * *', () => {
                this.sendScheduledContent('vocabulary_english', 'tip', '🌇 Buenas tardes');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        // Java Tips - 11:00 y 18:00
        this.jobs.push(
            cron.schedule('0 11 * * *', () => {
                this.sendScheduledContent('java', 'tip', '☕ A media mañana');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        this.jobs.push(
            cron.schedule('0 18 * * *', () => {
                this.sendScheduledContent('java', 'tip', '🌆 Al final del día');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        // Angular Tips - 13:00 y 20:00
        this.jobs.push(
            cron.schedule('0 13 * * *', () => {
                this.sendScheduledContent('angular', 'tip', '🍽️ Hora del almuerzo');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        this.jobs.push(
            cron.schedule('0 20 * * *', () => {
                this.sendScheduledContent('angular', 'tip', '🌙 Por la noche');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        // PREGUNTAS
        // English Questions - 10:00 y 15:00
        this.jobs.push(
            cron.schedule('00 10 * * *', () => {
                this.sendScheduledContent('vocabulary_english', 'question', '📚 Hora de practicar');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        this.jobs.push(
            cron.schedule('0 15 * * *', () => {
                this.sendScheduledContent('vocabulary_english', 'question', '🎯 Desafío de la tarde');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        // Java Questions - 12:00 y 17:00
        this.jobs.push(
            cron.schedule('0 12 * * *', () => {
                this.sendScheduledContent('java', 'question', '🚀 Desafío del mediodía');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        this.jobs.push(
            cron.schedule('0 17 * * *', () => {
                this.sendScheduledContent('java', 'question', '💻 Práctica vespertina');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        // Angular Questions - 14:00 y 19:00
        this.jobs.push(
            cron.schedule('0 14 * * *', () => {
                this.sendScheduledContent('angular', 'question', '⚡ Desafío post-almuerzo');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        this.jobs.push(
            cron.schedule('0 19 * * *', () => {
                this.sendScheduledContent('angular', 'question', '🎨 Práctica nocturna');
            }, {
                scheduled: true,
                timezone: "America/Argentina/Buenos_Aires"
            })
        );

        console.log('✅ Cron jobs configurados exitosamente');
        console.log(`📅 Total de trabajos programados: ${this.jobs.length}`);
    }

    async sendScheduledContent(subject, type, greeting) {
        try {
            console.log(`🔄 Enviando ${type} programado de ${subject} - ${greeting}`);

            const activeUsers = await this.userStatsService.getActiveUsers();

            if (activeUsers.length === 0) {
                console.log('📭 No hay usuarios activos para enviar contenido');
                return;
            }

            const contentData = await this.contentServices[subject](type);

            if (!contentData) {
                console.log(`⚠️ No se pudo obtener ${type} de ${subject}`);
                return;
            }

            const sendPromises = activeUsers.map(async (user) => {
                try {
                    const chatId = user.chatId;
                    const username = user.username || 'Usuario';

                    let introMessage = '';
                    if (type === 'tip') {
                        introMessage = `${greeting}, ${username}! 💡\n\n🎯 **Tip automático de ${this.getSubjectName(subject)}**\n\n`;
                    } else {
                        introMessage = `${greeting}, ${username}! 🎯\n\n🎯 **Pregunta automática de ${this.getSubjectName(subject)}**\n\n`;
                    }

                    if (type === 'question') {
                        await this.bot.enviarPregunta(chatId, contentData, introMessage);
                        await this.userStatsService.setCurrentQuestion(chatId, contentData);
                    } else {
                        await this.bot.enviarTip(chatId, contentData, introMessage);
                    }

                    await this.delay(100);

                } catch (userError) {
                    console.error(`❌ Error enviando a usuario ${user.chatId}:`, userError);
                }
            });

            await Promise.allSettled(sendPromises);

            console.log(`✅ ${type} de ${subject} enviado a ${activeUsers.length} usuarios activos`);

        } catch (error) {
            console.error(`❌ Error en envío programado de ${subject} ${type}:`, error);
        }
    }


    getSubjectName(subject) {
        const names = {
            'angular': 'Angular',
            'java': 'Java',
            'vocabulary_english': 'Vocabulario Inglés'
        };
        return names[subject] || subject;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Método para obtener el estado de los cron jobs
    getJobsStatus() {
        return this.jobs.map((job, index) => ({
            index,
            running: job.running,
            scheduled: job.scheduled
        }));
    }

    // Método para detener todos los cron jobs
    stopAllJobs() {
        this.jobs.forEach(job => {
            if (job.running) {
                job.stop();
            }
        });
        console.log('🛑 Todos los cron jobs han sido detenidos');
    }

    // Método para iniciar todos los cron jobs
    startAllJobs() {
        this.jobs.forEach(job => {
            if (!job.running) {
                job.start();
            }
        });
        console.log('▶️ Todos los cron jobs han sido iniciados');
    }

    // Método para testing - enviar contenido inmediatamente
    async testSendContent(subject, type) {
        console.log(`🧪 Test: Enviando ${type} de ${subject}`);
        await this.sendScheduledContent(subject, type, '🔧 Mensaje de prueba');
    }
}

module.exports = CronService;