class ChatMemoryService {
    constructor() {
        if (ChatMemoryService.instance) {
            console.log('🔄 Reutilizando instancia existente de ChatMemoryService');
            return ChatMemoryService.instance;
        }

        console.log('🆕 Creando nueva instancia de ChatMemoryService');
        this.chatMemories = new Map();
        this.MAX_MESSAGES_PER_CHAT = 1000; // 1000 mensajes
        this.MEMORY_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 días
        this.CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 1 día
        this.MAX_ACTIVE_CHATS = 5;

        this.startCleanupTimer();

        ChatMemoryService.instance = this;
        console.log('✅ ChatMemoryService inicializado correctamente');
    }

    static getInstance() {
        if (!ChatMemoryService.instance) {
            console.log('Creando primera instancia de ChatMemoryService');
            ChatMemoryService.instance = new ChatMemoryService();
        } else {
            console.log('Devolviendo instancia existente de ChatMemoryService');
        }
        return ChatMemoryService.instance;
    }

    addMessage(chatId, role, content, timestamp = Date.now()) {
        const chatIdStr = String(chatId); // Asegurar que sea string
        console.log(`💾 [${new Date().toLocaleTimeString()}] Guardando mensaje para chat ${chatIdStr}:`);
        console.log(`   - Role: ${role}`);
        console.log(`   - Content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);

        console.log(`📊 Estado actual: ${this.chatMemories.size} chats activos`);

        if (!this.chatMemories.has(chatIdStr) && this.chatMemories.size >= this.MAX_ACTIVE_CHATS) {
            console.log(`🚨 Límite de chats alcanzado (${this.MAX_ACTIVE_CHATS}), eliminando el más antiguo`);
            this.removeOldestChat();
        }

        if (!this.chatMemories.has(chatIdStr)) {
            this.chatMemories.set(chatIdStr, {
                messages: [],
                lastActivity: timestamp,
                createdAt: timestamp
            });
            console.log(`🆕 Nuevo chat creado: ${chatIdStr}`);
        }

        const chatMemory = this.chatMemories.get(chatIdStr);
        const newMessage = {
            role,
            content: content.substring(0, 3000),
            timestamp,
            id: Date.now() + Math.random()
        };

        chatMemory.messages.push(newMessage);
        chatMemory.lastActivity = timestamp;

        if (chatMemory.messages.length > this.MAX_MESSAGES_PER_CHAT) {
            const removedCount = chatMemory.messages.length - this.MAX_MESSAGES_PER_CHAT;
            chatMemory.messages = chatMemory.messages.slice(-this.MAX_MESSAGES_PER_CHAT);
            console.log(`✂️ Eliminados ${removedCount} mensajes antiguos del chat ${chatIdStr}`);
        }

        this.chatMemories.set(chatIdStr, chatMemory);
        console.log(`✅ Mensaje guardado. Total en chat ${chatIdStr}: ${chatMemory.messages.length}`);

        console.log(`📋 Últimos 3 mensajes en chat ${chatIdStr}:`);
        chatMemory.messages.slice(-3).forEach((msg, idx) => {
            console.log(`   ${idx + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
        });
    }

    getMessages(chatId) {
        const chatIdStr = String(chatId);
        console.log(`📖 [${new Date().toLocaleTimeString()}] Solicitud de mensajes para chat ${chatIdStr}`);

        const chatMemory = this.chatMemories.get(chatIdStr);
        if (!chatMemory) {
            console.log(`❌ No hay memoria para chat ${chatIdStr}`);
            console.log(`📊 Chats disponibles: [${Array.from(this.chatMemories.keys()).join(', ')}]`);
            return [];
        }

        const now = Date.now();
        const timeSinceLastActivity = now - chatMemory.lastActivity;
        console.log(`⏰ Tiempo desde última actividad: ${Math.round(timeSinceLastActivity / 1000 / 60)} minutos`);

        if (timeSinceLastActivity > this.MEMORY_EXPIRATION) {
            console.log(`🕐 Chat ${chatIdStr} expirado (${Math.round(this.MEMORY_EXPIRATION / 1000 / 60 / 60)}h), eliminando`);
            this.chatMemories.delete(chatIdStr);
            return [];
        }

        console.log(`✅ Devolviendo ${chatMemory.messages.length} mensajes para chat ${chatIdStr}`);

        console.log(`📋 Mensajes recuperados:`);
        chatMemory.messages.forEach((msg, idx) => {
            console.log(`   ${idx + 1}. [${msg.role}] ${msg.content.substring(0, 60)}...`);
        });

        return [...chatMemory.messages];
    }

    clearChat(chatId) {
        const chatIdStr = String(chatId);
        const existed = this.chatMemories.has(chatIdStr);
        this.chatMemories.delete(chatIdStr);
        console.log(`🧹 Chat ${chatIdStr} ${existed ? 'eliminado' : 'no existía'}`);
        return existed;
    }

    removeOldestChat() {
        let oldestChatId = null;
        let oldestTime = Date.now();

        for (const [chatId, memory] of this.chatMemories.entries()) {
            if (memory.lastActivity < oldestTime) {
                oldestTime = memory.lastActivity;
                oldestChatId = chatId;
            }
        }

        if (oldestChatId) {
            console.log(`🗑️ Eliminando chat más antiguo: ${oldestChatId}`);
            this.chatMemories.delete(oldestChatId);
        }
    }

    cleanupExpiredMemories() {
        const now = Date.now();
        const expiredChats = [];

        for (const [chatId, memory] of this.chatMemories.entries()) {
            if (now - memory.lastActivity > this.MEMORY_EXPIRATION) {
                expiredChats.push(chatId);
            }
        }

        expiredChats.forEach(chatId => this.chatMemories.delete(chatId));

        if (expiredChats.length > 0) {
            console.log(`🧹 Limpiados ${expiredChats.length} chats expirados: [${expiredChats.join(', ')}]`);
        }
    }

    startCleanupTimer() {
        setInterval(() => {
            console.log('🔄 Ejecutando limpieza automática de memoria...');
            this.cleanupExpiredMemories();
        }, this.CLEANUP_INTERVAL);

        console.log(`⏰ Timer de limpieza iniciado (cada ${this.CLEANUP_INTERVAL / 1000 / 60} minutos)`);
    }

    getMemoryStats() {
        let totalMessages = 0;
        let totalMemoryEstimate = 0;

        for (const [chatId, memory] of this.chatMemories.entries()) {
            totalMessages += memory.messages.length;
            totalMemoryEstimate += memory.messages.reduce((sum, msg) =>
                sum + msg.content.length + 100, 0);
        }

        return {
            activeChatCount: this.chatMemories.size,
            totalMessages,
            estimatedMemoryKB: Math.round(totalMemoryEstimate / 1024),
            maxActiveChats: this.MAX_ACTIVE_CHATS,
            memoryExpirationHours: this.MEMORY_EXPIRATION / (60 * 60 * 1000),
            maxMessagesPerChat: this.MAX_MESSAGES_PER_CHAT,
            cleanupIntervalMinutes: this.CLEANUP_INTERVAL / (60 * 1000),
            chatsInfo: Array.from(this.chatMemories.entries()).map(([chatId, memory]) => ({
                chatId,
                messageCount: memory.messages.length,
                lastActivity: new Date(memory.lastActivity).toLocaleString(),
                ageMinutes: Math.round((Date.now() - memory.createdAt) / 1000 / 60)
            }))
        };
    }

    testMemory(chatId) {
        const chatIdStr = String(chatId);
        console.log(`🧪 Iniciando test de memoria para chat ${chatIdStr}`);

        this.addMessage(chatIdStr, 'user', 'Mensaje de test');
        this.addMessage(chatIdStr, 'assistant', 'Respuesta de test');

        const messages = this.getMessages(chatIdStr);

        console.log(`🧪 Test completado. Mensajes recuperados: ${messages.length}`);
        return {
            success: messages.length >= 2,
            messageCount: messages.length,
            messages: messages.map(msg => `[${msg.role}] ${msg.content.substring(0, 30)}...`)
        };
    }
}

ChatMemoryService.resetInstance = function() {
    console.log('🔄 Reseteando instancia singleton de ChatMemoryService');
    ChatMemoryService.instance = null;
};

module.exports = ChatMemoryService;