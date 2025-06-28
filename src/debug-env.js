console.log("🔍 === DEBUG DE VARIABLES DE ENTORNO ===");
console.log("🌍 Entorno:", process.env.GITHUB_ACTIONS ? "GitHub Actions" : "Local");
console.log("📅 Fecha:", new Date().toISOString());

// Cargar config
const config = require('./config');

console.log("\n📋 Variables desde config:");
console.log("- NOTION_TOKEN:", config.notionToken ? `✅ (${config.notionToken.length} chars)` : "❌ undefined");
console.log("- DATABASE_ID:", config.databaseId ? `✅ (${config.databaseId.length} chars)` : "❌ undefined");
console.log("- TELEGRAM_TOKEN:", config.telegramToken ? `✅ (${config.telegramToken.length} chars)` : "❌ undefined");
console.log("- CHAT_ID:", config.chatId ? `✅ (${config.chatId})` : "❌ undefined");

console.log("\n🔍 Variables directas desde process.env:");
console.log("- NOTION_TOKEN:", process.env.NOTION_TOKEN ? `✅ (${process.env.NOTION_TOKEN.length} chars)` : "❌ undefined");
console.log("- DATABASE_ID:", process.env.DATABASE_ID ? `✅ (${process.env.DATABASE_ID.length} chars)` : "❌ undefined");
console.log("- TELEGRAM_TOKEN:", process.env.TELEGRAM_TOKEN ? `✅ (${process.env.TELEGRAM_TOKEN.length} chars)` : "❌ undefined");
console.log("- CHAT_ID:", process.env.CHAT_ID ? `✅ (${process.env.CHAT_ID})` : "❌ undefined");

console.log("\n🔍 Todas las variables que contienen 'TELEGRAM':");
Object.keys(process.env)
    .filter(key => key.includes('TELEGRAM'))
    .forEach(key => console.log(`- ${key}:`, process.env[key] ? `✅ (${process.env[key].length} chars)` : "❌ undefined"));

console.log("\n🔍 Todas las variables que contienen 'NOTION':");
Object.keys(process.env)
    .filter(key => key.includes('NOTION'))
    .forEach(key => console.log(`- ${key}:`, process.env[key] ? `✅ (${process.env[key].length} chars)` : "❌ undefined"));

// Test específico de Telegram Token
if (process.env.TELEGRAM_TOKEN) {
    console.log("\n🤖 Análisis del Telegram Token:");
    console.log("- Longitud:", process.env.TELEGRAM_TOKEN.length);
    console.log("- Empieza con número:", /^\d/.test(process.env.TELEGRAM_TOKEN));
    console.log("- Contiene ':':", process.env.TELEGRAM_TOKEN.includes(':'));
    console.log("- Formato típico (9-10 dígitos:AAF...):", /^\d{9,10}:[\w-]{35}$/.test(process.env.TELEGRAM_TOKEN));
}