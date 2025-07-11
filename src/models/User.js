const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    chatId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    stats: {
        correctas: { type: Number, default: 0 },
        incorrectas: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    currentQuestion: {
        question: String,
        correctAnswer: String,
        example: String,
        usage: String,
        category: String,
        theme: String,
        level: String,
        timestamp: Date
    },
    isFreeChatMode: { type: Boolean, default: false },
    preferences: {
        language: { type: String, default: 'es' },
        difficulty: { type: String, default: 'medium' },
        subjects: [{ type: String }]
    },
    activity: {
        fechaRegistro: { type: Date, default: Date.now },
        ultimaActividad: { type: Date, default: Date.now },
        sesionesCompletadas: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

userSchema.index({ 'activity.ultimaActividad': -1 });
userSchema.index({ 'stats.total': -1 });

userSchema.methods.getAccuracyPercentage = function() {
    if (this.stats.total === 0) return 0;
    return Math.round((this.stats.correctas / this.stats.total) * 100);
};

userSchema.methods.isActiveUser = function() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.activity.ultimaActividad > weekAgo;
};

userSchema.methods.getUsername = function() {
    return this.username;
};

const User = mongoose.model('User', userSchema);

module.exports = User;