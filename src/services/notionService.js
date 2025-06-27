const { Client } = require('@notionhq/client');
const { notionToken, databaseId } = require('../config');

const notion = new Client({ auth: notionToken });

function extraerTextoRichText(richTextArray) {
    if (!richTextArray || richTextArray.length === 0) return "";
    return richTextArray.map(part => part.text.content).join("");
}

async function obtenerTipAleatorio() {
    try {
        const response = await notion.databases.query({ database_id: databaseId });

        const tips = response.results.map(page => {
            const props = page.properties;

            const word = props.Word?.title?.map(t => t.text.content).join('') || "Sin palabra";
            const definition = extraerTextoRichText(props.Definition?.rich_text);
            const example = extraerTextoRichText(props["Example Sentence"]?.rich_text);
            const category = props.Category?.select?.name || "Sin categoría";
            const level = props.Level?.select?.name || "Sin nivel";
            const date = props.Date?.date?.start || "";

            return `📝 *${word}*\n\n*Definición:* ${definition}\n\n*Ejemplo:* _${example}_\n\n*Categoría:* ${category}\n*Nivel:* ${level}\n*Fecha:* ${date}`;
        });

        if (tips.length === 0) return "No hay tips cargados en Notion aún.";

        return tips[Math.floor(Math.random() * tips.length)];

    } catch (error) {
        console.error("❌ Error al obtener los tips desde Notion:", error.message);
        return "Hubo un problema al obtener el tip de Notion.";
    }
}

module.exports = { obtenerTipAleatorio };
