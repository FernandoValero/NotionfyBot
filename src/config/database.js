const mongoose = require('mongoose');
const { mongoUri } = require('../config');

class DatabaseConnection {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        try {
            const mongo_uri = mongoUri ;

            await mongoose.connect(mongo_uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            this.isConnected = true;
            console.log('✅ Conectado a MongoDB');

            mongoose.connection.on('error', (error) => {
                console.error('❌ Error de MongoDB:', error);
            });

            mongoose.connection.on('disconnected', () => {
                console.log('🔌 Desconectado de MongoDB');
                this.isConnected = false;
            });

        } catch (error) {
            console.error('❌ Error al conectar con MongoDB:', error);
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected) {
            return;
        }

        await mongoose.disconnect();
        this.isConnected = false;
        console.log('🔌 Desconectado de MongoDB');
    }
}

module.exports = new DatabaseConnection();