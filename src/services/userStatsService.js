const User = require('../models/User');

class UserStatsService {
    constructor() {
        this.User = User;
    }

    /**
     * Obtener usuarios activos (que han interactuado en los últimos 7 días)
     * @returns {Promise<Array>} Array de usuarios activos
     */
    async getActiveUsers() {
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const activeUsers = await User.find({
                'activity.ultimaActividad': { $gte: weekAgo }
            }).select('chatId username activity.ultimaActividad');

            console.log(`📊 Usuarios activos encontrados: ${activeUsers.length}`);
            return activeUsers;
        } catch (error) {
            console.error('❌ Error obteniendo usuarios activos:', error);
            return [];
        }
    }

    /**
     * Obtener todos los usuarios registrados
     * @returns {Promise<Array>} Array de todos los usuarios
     */
    async getAllUsers() {
        try {
            const allUsers = await User.find({})
                .select('chatId username activity.fechaRegistro activity.ultimaActividad');

            console.log(`📊 Total de usuarios registrados: ${allUsers.length}`);
            return allUsers;
        } catch (error) {
            console.error('❌ Error obteniendo todos los usuarios:', error);
            return [];
        }
    }

    /**
     * Obtener estadísticas de usuarios
     * @returns {Promise<Object>} Estadísticas generales
     */
    async getUsersStats() {
        try {
            const total = await User.countDocuments();
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const active = await User.countDocuments({
                'activity.ultimaActividad': { $gte: weekAgo }
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const newToday = await User.countDocuments({
                'activity.fechaRegistro': { $gte: today }
            });

            return {
                total,
                active,
                newToday,
                activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de usuarios:', error);
            return { total: 0, active: 0, newToday: 0, activePercentage: 0 };
        }
    }

    /**
     * Establece el nombre de usuario
     * @param {string} chatId - ID del chat
     * @param {string} username - Nombre del usuario
     */
    async setUsername(chatId, username) {
        try {
            const user = await this.User.findOneAndUpdate(
                { chatId: chatId.toString() },
                {
                    username: username,
                    'activity.ultimaActividad': new Date()
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            console.log(`✅ Nombre de usuario establecido para el usuario ${chatId}: ${username}`);
            return user;
        } catch (error) {
            console.error(`❌ Error al establecer el nombre de usuario para el usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene las estadísticas del usuario incluyendo el nombre
     * @param {string} chatId - ID del chat
     * @returns {Object} - Estadísticas del usuario
     */
    async getUserStats(chatId) {
        try {
            let user = await this.User.findOne({ chatId: chatId.toString() });

            if (!user) {
                user = new this.User({
                    chatId: chatId.toString(),
                    stats: {
                        correctas: 0,
                        incorrectas: 0,
                        total: 0
                    }
                });
                await user.save();
            }

            user.activity.ultimaActividad = new Date();
            await user.save();

            return {
                username: user.username || null,
                correctas: user.stats.correctas,
                incorrectas: user.stats.incorrectas,
                total: user.stats.total,
                porcentajeAciertos: user.getAccuracyPercentage(),
                fechaRegistro: user.activity.fechaRegistro,
                ultimaActividad: user.activity.ultimaActividad,
                sesionesCompletadas: user.activity.sesionesCompletadas,
                esUsuarioActivo: user.isActiveUser()
            };
        } catch (error) {
            console.error(`❌ Error al obtener las estadísticas del usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene la información completa del usuario
     * @param {string} chatId - ID del chat
     * @returns {Object|null} - Datos del usuario o null si no existe
     */
    async getUser(chatId) {
        try {
            const user = await this.User.findOne({ chatId: chatId.toString() });
            return user;
        } catch (error) {
            console.error(`❌ Error al obtener el usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene el nombre de usuario
     * @param {string} chatId - ID del chat
     * @returns {string|null} - Nombre del usuario o null si no existe
     */
    async getUsername(chatId) {
        try {
            const user = await this.User.findOne({ chatId: chatId.toString() });
            return user?.username || null;
        } catch (error) {
            console.error(`❌ Error al obtener el nombre de usuario para el usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza las estadísticas del usuario
     * @param {string} chatId - ID del chat
     * @param {boolean} esCorrecta - Si la respuesta fue correcta
     */
    async updateStats(chatId, esCorrecta) {
        try {
            const updateQuery = {
                $inc: {
                    'stats.total': 1
                },
                $set: {
                    'activity.ultimaActividad': new Date()
                }
            };

            if (esCorrecta) {
                updateQuery.$inc['stats.correctas'] = 1;
            } else {
                updateQuery.$inc['stats.incorrectas'] = 1;
            }

            await this.User.findOneAndUpdate(
                { chatId: chatId.toString() },
                updateQuery,
                { upsert: true, setDefaultsOnInsert: true }
            );

            console.log(`📊 Estadísticas actualizadas para el usuario ${chatId}: ${esCorrecta ? 'Correcta' : 'Incorrecta'}`);
        } catch (error) {
            console.error(`❌ Error al actualizar las estadísticas del usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Establece la pregunta actual del usuario
     * @param {string} chatId - ID del chat
     * @param {Object} questionData - Datos de la pregunta
     */
    async setCurrentQuestion(chatId, questionData) {
        try {
            await this.User.findOneAndUpdate(
                { chatId: chatId.toString() },
                {
                    currentQuestion: {
                        ...questionData,
                        timestamp: new Date()
                    },
                    'activity.ultimaActividad': new Date()
                },
                { upsert: true, setDefaultsOnInsert: true }
            );

            console.log(`❓ Pregunta actual establecida para el usuario ${chatId}`);
        } catch (error) {
            console.error(`❌ Error al establecer la pregunta actual para el usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene la pregunta actual del usuario
     * @param {string} chatId - ID del chat
     * @returns {Object|null} - Pregunta actual o null
     */
    async getCurrentQuestion(chatId) {
        try {
            const user = await this.User.findOne({ chatId: chatId.toString() });
            return user?.currentQuestion || null;
        } catch (error) {
            console.error(`❌ Error al obtener la pregunta actual del usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Limpia la pregunta actual del usuario
     * @param {string} chatId - ID del chat
     */
    async clearCurrentQuestion(chatId) {
        try {
            await this.User.findOneAndUpdate(
                { chatId: chatId.toString() },
                {
                    $unset: { currentQuestion: 1 },
                    'activity.ultimaActividad': new Date()
                }
            );

            console.log(`🧹 Pregunta actual limpiada para el usuario ${chatId}`);
        } catch (error) {
            console.error(`❌ Error al limpiar la pregunta actual del usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Establece el modo de chat libre
     * @param {string} chatId - ID del chat
     * @param {boolean} isFreeChatMode - Estado del modo chat libre
     */
    async setFreeChatMode(chatId, isFreeChatMode) {
        try {
            await this.User.findOneAndUpdate(
                { chatId: chatId.toString() },
                {
                    isFreeChatMode: isFreeChatMode,
                    'activity.ultimaActividad': new Date()
                },
                { upsert: true, setDefaultsOnInsert: true }
            );

            console.log(`💬 Modo chat libre ${isFreeChatMode ? 'activado' : 'desactivado'} para el usuario ${chatId}`);
        } catch (error) {
            console.error(`❌ Error al establecer el modo chat libre para el usuario ${chatId}:`, error);
            throw error;
        }
    }

    /**
     * Verifica si el usuario está en modo chat libre
     * @param {string} chatId - ID del chat
     * @returns {boolean} - Estado del modo chat libre
     */
    async isInFreeChatMode(chatId) {
        try {
            const user = await this.User.findOne({ chatId: chatId.toString() });
            return user?.isFreeChatMode || false;
        } catch (error) {
            console.error(`❌ Error al verificar el modo chat libre del usuario ${chatId}:`, error);
            return false;
        }
    }
}

module.exports = UserStatsService;