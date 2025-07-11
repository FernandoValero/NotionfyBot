const { Client } = require('@notionhq/client');
const { notionToken, databaseIdEnglishVocabulary } = require('../config');

const notion = new Client({ auth: notionToken });

const LEVEL_TO_DAYS = {
    1: 1,  // Muy importante -> cada 1 día
    2: 3,  // Importante -> cada 3 días
    3: 4,  // Moderado -> cada 4 días
    4: 5,  // Poco importante -> cada 5 días
    5: 7   // Nada importante -> cada 7 días
};

function extractRichText(richTextArray) {
    if (!richTextArray || richTextArray.length === 0) return "";
    return richTextArray.map(part => part.text.content).join("");
}

function getDaysFromLastAppearance(lastAppearanceDate) {
    if (!lastAppearanceDate) return Infinity;

    const today = new Date();
    const lastDate = new Date(lastAppearanceDate);
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

function calculateScore(tip) {
    const level = parseInt(tip.level) || 5;
    const daysSinceLastAppearance = getDaysFromLastAppearance(tip.lastAppearance);

    const levelPriority = (6 - level) * 100;
    const timePriority = Math.min(daysSinceLastAppearance, 30);

    return levelPriority + timePriority;
}

async function updateLastAppearance(pageId, type) {
    try {
        const today = new Date().toISOString().split('T')[0];

        const dateProperty = type === 'question'
            ? 'Last Appearance Question'
            : 'Last Appearance Tip';

        const properties = {};
        properties[dateProperty] = {
            date: {
                start: today
            }
        };

        await notion.pages.update({
            page_id: pageId,
            properties
        });
        console.log(`✅ Actualizada fecha de última aparición (${dateProperty}) para ${type} con ID: ${pageId}`);
    } catch (error) {
        console.error(`❌ Error al actualizar Last Appearance para ${pageId}:`, error.message);
    }
}

async function getEnglishVocabularyTip(type = 'tip') {
    try {
        const response = await notion.databases.query({ database_id: databaseIdEnglishVocabulary });

        if (response.results.length === 0) {
            console.log(`⚠️ No hay ${type}s de inglés cargados en Notion.`);
            return null;
        }

        const tips = response.results.map(page => {
            const props = page.properties;

            const lastAppearanceField = type === 'question'
                ? 'Last Appearance Question'
                : 'Last Appearance Tip';

            return {
                pageId: page.id,
                question: props.Word?.title?.map(t => t.text.content).join('') || "No question",
                correctAnswer: extractRichText(props.Definition?.rich_text),
                example: extractRichText(props["Example Sentence"]?.rich_text) || "No example",
                usage: "Vocabulario",
                category: props.Category?.multi_select?.map(cat => cat.name).join(', ') || "No category",
                level: props["Level of Importance"]?.select?.name || "5",
                theme: props.Theme?.select?.name || "Vocabulario de Ingles",
                lastAppearance: props[lastAppearanceField]?.date?.start || null
            };
        });

        const availableTips = tips.filter(tip => {
            const level = parseInt(tip.level) || 5;
            const requiredDays = LEVEL_TO_DAYS[level] || 7;
            const daysSinceLastAppearance = getDaysFromLastAppearance(tip.lastAppearance);
            return !tip.lastAppearance || daysSinceLastAppearance >= requiredDays;
        });

        let selectedTip;

        if (availableTips.length > 0) {
            const tipsByLevel = {};
            availableTips.forEach(tip => {
                const level = parseInt(tip.level) || 5;
                if (!tipsByLevel[level]) tipsByLevel[level] = [];
                tipsByLevel[level].push(tip);
            });

            for (let level = 1; level <= 5; level++) {
                if (tipsByLevel[level] && tipsByLevel[level].length > 0) {
                    selectedTip = tipsByLevel[level][Math.floor(Math.random() * tipsByLevel[level].length)];
                    break;
                }
            }
        } else {
            console.log(`⚠️ No hay ${type}s de inglés que cumplan exactamente las reglas. Seleccionando el mejor disponible...`);


            tips.forEach(tip => {
                tip.score = calculateScore(tip);
            });

            tips.sort((a, b) => b.score - a.score);

            const maxScore = tips[0].score;

            const topTips = tips.filter(tip => tip.score === maxScore);

            selectedTip = topTips[Math.floor(Math.random() * topTips.length)];
        }

        if (selectedTip) {
            await updateLastAppearance(selectedTip.pageId, type);
            console.log(`📝 ${type.charAt(0).toUpperCase() + type.slice(1)} de inglés seleccionado - Nivel: ${selectedTip.level}, Última aparición: ${selectedTip.lastAppearance || 'Primera vez'}`);
            return selectedTip;
        }

        console.log(`⚠️ No se pudo seleccionar un ${type} de inglés.`);
        return null;

    } catch (error) {
        console.error(`❌ Error al obtener el ${type} de inglés:`, error.message);
        return null;
    }
}

module.exports = { getEnglishVocabularyTip };