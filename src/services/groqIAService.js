const Groq = require('groq-sdk');
const { groqId } = require('../config');
const ChatMemoryService = require('./chatMemoryService');
class GroqIAService {

    constructor(userStatsService) {
        this.client = new Groq({ groqId });
        this.model = "meta-llama/llama-4-scout-17b-16e-instruct";
        this.userStatsService = userStatsService;
        this.chatMemoryService = ChatMemoryService.getInstance();
    }

    async evaluarRespuesta(pregunta, respuestaCorrecta, respuestaUsuario, tema, contexto = {}, chatId) {
        try {
            const username = await this.userStatsService.getUsername(chatId);
            const prompt = this.construirPromptRespuesta(pregunta, respuestaCorrecta, respuestaUsuario, tema, contexto, chatId, username);

            const completion = await this.client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.model,
                temperature: 0.3,
                max_tokens: 1024,
                top_p:1,
                stream:false,
                response_format:{"type": "json_object"},
            });

            const respuestaIA = completion.choices[0].message.content;
            return this.procesarRespuestaIA(respuestaIA);

        } catch (error) {
            console.error('❌ Error en GroqIAService:', error);
            return this.getFallbackEvaluation(respuestaUsuario);
        }
    }

    construirPromptRespuesta(pregunta, respuestaCorrecta, respuestaUsuario, tema, contexto, chatId, username) {
        const ejemploExtra = contexto.example ? `\nEJEMPLO DE REFERENCIA: ${contexto.example}` : '';
        const usoExtra = contexto.use ? `\nUSO/APLICACIÓN: ${contexto.use}` : '';
        const categoriaExtra = contexto.category ? `\nCATEGORÍA: ${contexto.category}` : '';

        return `
Eres un profesor experto en ${tema.toUpperCase()} que evalúa de forma justa y constructiva. Tu objetivo es reconocer el conocimiento del estudiante y ayudarlo a mejorar.

PRINCIPIO FUNDAMENTAL: Evalúa lo que el usuario SÍ sabe, no lo que le falta. La comprensión conceptual vale más que la perfección en los detalles. Llama al usuario por su nombre: ${username}

REGLAS PARA TELEGRAM:
- PROHIBIDO: asteriscos (*), guiones bajos (_), tildes invertidas (\`), caracteres especiales (|, ~, ^, &) en texto normal
- PERMITIDO en código: { } // () = + - [ ] @ # $ % y símbolos de programación
- ESTRUCTURA: Texto plano, saltos de línea, bloques de código bien formateados

DATOS DE EVALUACIÓN:
PREGUNTA: ${pregunta}
RESPUESTA DE REFERENCIA: ${respuestaCorrecta}
RESPUESTA DEL USUARIO: ${respuestaUsuario}${ejemploExtra}${usoExtra}${categoriaExtra}

DETECCIÓN DE SOLICITUDES DE AYUDA:
Identifica expresiones como: "no sé", "ayuda", "explícame", "ejemplo", "cómo se hace", "código", "programación", "sintaxis"

TIPOS DE SOLICITUDES:
1. SOLICITUD GENERAL: "no sé", "ayuda", "explícame"
   → Explicación conceptual + ejemplo básico

2. SOLICITUD DE CÓDIGO: "ejemplo en código", "programación", "sintaxis", "cómo programar", "dame código"
   → Explicación conceptual + código funcional completo + comentarios detallados

→ Para ambos tipos: puntuación 10-20, esCorrecta: false, mantener tono positivo

CRITERIOS DE EVALUACIÓN SIMPLIFICADOS:

1. EXCELENTE (85-100 puntos, esCorrecta: true)
   - Menciona todos los conceptos principales correctamente
   - Demuestra comprensión profunda del tema
   - Puede incluir ejemplos o detalles adicionales

2. BUENA (70-84 puntos, esCorrecta: true)
   - Conceptos principales correctos con palabras diferentes
   - Comprensión clara pero faltan algunos detalles menores
   - Esencia del concepto bien explicada

3. ACEPTABLE (60-69 puntos, esCorrecta: true)
   - Conceptos básicos correctos
   - Comprende la idea general
   - Explicación incompleta pero fundamentalmente correcta

4. PARCIAL (30-59 puntos, esCorrecta: false)
   - Comprensión parcial del concepto
   - Algunos elementos correctos mezclados con errores
   - Muestra esfuerzo pero necesita refuerzo

5. INSUFICIENTE (10-29 puntos, esCorrecta: false)
   - Conceptos incorrectos o muy confusos
   - Poco entendimiento del tema
   - Requiere explicación desde el principio

6. SOLICITUD DE AYUDA (10-20 puntos, esCorrecta: false)
   - AYUDA GENERAL: Explicación conceptual + ejemplo básico
   - AYUDA CON CÓDIGO: Explicación + código funcional completo + comentarios
   - Siempre reconocer la proactividad del estudiante

7. SIN RESPUESTA VÁLIDA (0-9 puntos, esCorrecta: false)
   - Respuestas sin sentido, vacías o inapropiadas

REGLA CRÍTICA DE PUNTUACIÓN:
Si el usuario demuestra que ENTIENDE EL CONCEPTO PRINCIPAL (aunque use palabras diferentes o le falten detalles), la puntuación MÍNIMA es 55 puntos y esCorrecta debe ser true.

FORMATO DE CÓDIGO EN FEEDBACK:

Para CUALQUIER solicitud de código o tema de programación, usa SIEMPRE este formato:

"Aquí tienes un ejemplo práctico completo:

\`\`\`javascript
// Comentarios explicativos detallados
class ClasePadre {
    constructor(parametro) {
        this.propiedad = parametro;
    }
    
    metodo() {
        // Explicación de qué hace este método
        return this.propiedad;
    }
}

// Clase que hereda (ejemplo de herencia)
class ClaseHija extends ClasePadre {
    constructor(parametro, nuevoParametro) {
        super(parametro); // Llama al constructor padre
        this.nuevaPropiedad = nuevoParametro;
    }
    
    nuevoMetodo() {
        // Método específico de la clase hija
        return this.nuevaPropiedad + this.propiedad;
    }
}

// Ejemplo de uso
let objeto = new ClaseHija('valor1', 'valor2');
console.log(objeto.metodo()); // Método heredado
console.log(objeto.nuevoMetodo()); // Método propio
\`\`\`

Este código demuestra [explicación detallada paso a paso]..."

REGLAS PARA CÓDIGO:
- SIEMPRE incluir comentarios explicativos en cada sección
- Código debe ser funcional y ejecutable
- Incluir ejemplo de uso al final
- Explicar qué hace cada parte después del código
- Para conceptos de POO: mostrar clases completas con herencia, constructores, métodos
- Para otros temas: adaptar el ejemplo al concepto específico

ESTRUCTURA DE RESPUESTA:
- Feedback positivo y constructivo
- Si es incorrecto: explicación clara del concepto con ejemplos
- Siempre mantener tono motivador
- Reconocer los aciertos antes de señalar mejoras

Responde EXACTAMENTE en este formato JSON:

{
    "esCorrecta": true/false,
    "puntuacion": 0-100,
    "feedback": "Texto del feedback siguiendo las reglas de formato para Telegram",
    "sugerencias": "Recomendaciones específicas para mejorar",
    "aspectosPositivos": "Reconocimiento de lo que hizo bien el usuario"
}

EJEMPLOS DE EVALUACIÓN CORRECTA:

1. RESPUESTA CONCEPTUAL CORRECTA:
"La herencia es un mecanismo por la cual una clase puede heredar atributos y métodos de otra, esto mejora la reutilización de código y una mejor organización"
→ Puntuación: 70-75, esCorrecta: true
→ Conceptos principales presentes, comprensión clara

2. SOLICITUD DE AYUDA GENERAL:
"No entiendo, ayúdame por favor"
→ Puntuación: 15, esCorrecta: false
→ Feedback: Explicación conceptual + ejemplo básico

3. SOLICITUD DE CÓDIGO:
"No entiendo me ayudarías con un ejemplo en código de programación por favor"
→ Puntuación: 15, esCorrecta: false  
→ Feedback: Explicación conceptual + código funcional completo + comentarios detallados + ejemplo de uso

DETECCIÓN ESPECÍFICA DE CÓDIGO:
Si la respuesta contiene palabras como: "código", "programación", "sintaxis", "programa", "script", "ejemplo de código", "cómo programar"
→ OBLIGATORIO incluir código funcional en el feedback

RECUERDA: Valora el conocimiento demostrado, no penalices por detalles menores faltantes.
`;
    }

    procesarRespuestaIA(respuestaIA) {
        try {
            const jsonMatch = respuestaIA.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const resultado = JSON.parse(jsonMatch[0]);

                if (typeof resultado.esCorrecta === 'boolean' &&
                    typeof resultado.puntuacion === 'number' &&
                    resultado.feedback && resultado.sugerencias) {
                    return resultado;
                }
            }

            throw new Error('Formato JSON inválido');

        } catch (parseError) {
            console.warn('⚠️ Error parseando respuesta IA, usando fallback');
            return this.getFallbackEvaluation(respuestaIA);
        }
    }

    getFallbackEvaluation(textoRespuesta = '') {
        const contienePalabrasPositivas = /correcto|bien|exacto|perfecto|sí|verdadero/i.test(textoRespuesta);
        const contienePalabrasNegativas = /incorrecto|mal|error|no|falso|equivocado/i.test(textoRespuesta);

        let esCorrecta = false;
        let puntuacion = 50;

        if (contienePalabrasPositivas && !contienePalabrasNegativas) {
            esCorrecta = true;
            puntuacion = 75;
        } else if (contienePalabrasNegativas) {
            esCorrecta = false;
            puntuacion = 25;
        }

        return {
            esCorrecta,
            puntuacion,
            feedback: textoRespuesta.substring(0, 200) || 'Respuesta evaluada correctamente.',
            sugerencias: 'Revisa los conceptos fundamentales y practica más ejercicios similares.',
            aspectosPositivos: esCorrecta ? 'Demuestras comprensión del tema.' : 'Sigue intentando, cada error es una oportunidad de aprender.'
        };
    }

    async mejorarRespuestaCorrecta(respuestaCorrecta, contexto = {}) {
        try {
            const tema = contexto.tema || "el tema";
            const esVocabularioIngles = tema.toLowerCase().includes('vocabulario') ||
                tema.toLowerCase().includes('ingles') ||
                tema.toLowerCase().includes('english');

            let instruccionesEspeciales = "";
            let pregunta = "";

            if (esVocabularioIngles) {
                pregunta = "¿Qué significa " + contexto.question + " en español?";
                console.log("SE pidio una pregunta")
                instruccionesEspeciales = `

ENFOQUE PARA VOCABULARIO INGLÉS:

ESTRUCTURA PRINCIPAL:
[Palabra en inglés] significa [traducción/significado en español]
[Contexto o información adicional que enriquezca la comprensión del significado]
Ejemplo: "[Oración en inglés]" ([Traducción al español])
[Ejemplo adicional o nota importante si mejora la comprensión]

PRINCIPIOS CLAVE:
Toda la explicación será en español
Traducción clara y directa del significado
Si hay múltiples significados, mencionar los más importantes
Siempre incluir al menos un ejemplo práctico con traducción
Para términos técnicos, explicar brevemente el contexto de uso
Organizar la información de forma clara y memorable

EJEMPLO DEL FORMATO:
Debugging significa depuración y se refiere al proceso de encontrar y corregir errores en el código de programación
Ejemplo: "I spent hours debugging this application" (Pasé horas depurando esta aplicación)

REGLAS ESTRICTAS PARA TELEGRAM:
- PROHIBIDO: asteriscos (*), guiones bajos (_), tildes invertidas (\`), caracteres especiales (|, ~, ^, &)
- PERMITIDO: guiones (-) para listas, números (1., 2., 3.), MAYÚSCULAS para énfasis
- Usa texto plano y estructura clara con saltos de línea
- Mantén formato simple y compatible con Telegram
            `;
            } else {
                pregunta = contexto.question;
                instruccionesEspeciales = `

ENFOQUE GENERAL PARA MEJORAR RESPUESTAS:
- Asegúrate de que la respuesta sea completa y pedagógicamente sólida
- Organiza la información de lo general a lo específico
- Incluye ejemplos prácticos cuando sean útiles para la comprensión
- Mantén un lenguaje claro y accesible según el nivel del tema
- Si la respuesta original es técnica, verifica que sea precisa y completa

REGLAS ESTRICTAS PARA TELEGRAM:
- PROHIBIDO: asteriscos (*), guiones bajos (_), tildes invertidas (\`), caracteres especiales (|, ~, ^, &)
- PERMITIDO: guiones (-) para listas, números (1., 2., 3.), MAYÚSCULAS para énfasis
- Usa texto plano y estructura clara con saltos de línea
- Mantén formato simple y compatible con Telegram

PRINCIPIOS DE MEJORA:
- Si la respuesta es clara y completa, manténla tal cual
- Si falta claridad, reorganiza o amplía la explicación
- Si falta contexto importante, agrégalo sin cambiar el sentido original
- Si hay términos técnicos, considera si necesitan explicación adicional
            `;
            }

            const prompt = `
Eres un profesor experto en ${tema.toUpperCase()} con amplia experiencia pedagógica.

Tu tarea es analizar la respuesta modelo proporcionada y mejorarla ÚNICAMENTE si crees que puede enriquecerse para facilitar la comprensión del estudiante y responder mejor la pregunta planteada.

REGLA FUNDAMENTAL: SIEMPRE respeta y parte de la respuesta original. NO elimines información valiosa ni cambies el sentido o enfoque fundamental de la respuesta.

CRITERIOS PARA DECIDIR SI MEJORAR:
- ¿La respuesta actual es suficientemente clara y completa?
- ¿Podría beneficiarse de mejor organización o estructura?
- ¿Faltan ejemplos que facilitarían la comprensión?
- ¿Hay términos que podrían necesitar más contexto?
- ¿La explicación fluye de manera lógica y pedagógica?

SI LA RESPUESTA YA ES ÓPTIMA: Devuélvela exactamente igual.
SI PUEDE MEJORARSE: Enriquécela manteniendo toda la información original.

${instruccionesEspeciales}

RESPUESTA ORIGINAL A ANALIZAR:
${respuestaCorrecta}

PREGUNTA CORRESPONDIENTE:
${pregunta}

INSTRUCCIÓN FINAL: Devuelve únicamente la respuesta mejorada o la misma respuesta original. No agregues comentarios, explicaciones adicionales, ni texto que no forme parte directa de la respuesta a la pregunta.
        `;

            const completion = await this.client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.model,
                temperature: 0.3,
                max_tokens: esVocabularioIngles ? 600 : 500
            });

            const respuestaMejorada = completion.choices[0].message.content.trim();
            return respuestaMejorada;

        } catch (error) {
            console.error('❌ Error mejorando respuesta correcta:', error);
            return respuestaCorrecta;
        }
    }

    async testConnection() {
        try {
            const test = await this.client.chat.completions.create({
                messages: [{ role: "user", content: "Responde solo: OK" }],
                model: this.model,
                max_tokens: 10
            });

            return test.choices[0]?.message?.content?.includes('OK');
        } catch (error) {
            console.error('Test de conexión falló:', error);
            return false;
        }
    }


    async generarRespuestaLibre(mensaje, chatId) {
        try {
            const username = await this.userStatsService.getUsername(chatId);
            const historialMensajes = this.chatMemoryService.getMessages(chatId);

            let contextoConversacion = '';
            if (historialMensajes.length > 0) {
                contextoConversacion = '\n## Contexto de conversación anterior:\n';

                const mensajesRecientes = historialMensajes.slice(-8);
                mensajesRecientes.forEach(msg => {
                    const roleLabel = msg.role === 'user' ? 'Usuario' : 'Asistente';
                    contextoConversacion += `${roleLabel}: ${msg.content}\n`;
                });
                contextoConversacion += '\n## Mensaje actual:\n';
            }

            const mensajeConContexto = `${contextoConversacion}**Mensaje del usuario:** ${mensaje}`;

            const response = await this.client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente educativo especializado en programación (Angular, Java) y aprendizaje de idiomas (inglés), pero también eres una compañía conversacional versátil.

Llama al usuario por su nombre: ${username}

## Modo de Respuesta según el Contexto:

### 📚 **Consultas Educativas:**
- **Programación**: Proporciona ejemplos de código claros, explica conceptos paso a paso
- **Inglés**: Incluye ejemplos de uso, pronunciación y tips prácticos
- **Otras materias**: Mantén un enfoque pedagógico y estructurado

### 💬 **Conversación Casual:**
- **Amigable y cercano**: Usa un tono relajado y natural
- **Divertido**: Incorpora humor apropiado, chistes suaves o comentarios ingeniosos
- **Bromista**: Usa ironía ligera, juegos de palabras o referencias divertidas cuando encaje
- **Empático**: Adapta el tono al estado de ánimo del usuario (serio si está preocupado, alegre si está contento)

### 🎭 **Adaptación Contextual:**
- Si detectas aburrimiento → Sé más dinámico y entretenido
- Si hay estrés/preocupación → Sé comprensivo y tranquilizador
- Si hay celebración/alegría → Comparte el entusiasmo
- Si hay curiosidad → Sé intrigante y estimulante

## Instrucciones Generales:
- Responde en español de manera natural y conversacional
- Usa emojis ocasionalmente para dar vida a la conversación
- No seas excesivamente formal en conversaciones casuales
- Mantén siempre un tono respetuoso, pero ajusta la energía al contexto
- Si no estás seguro del tono, inclínate hacia lo amigable y ligeramente divertido
- Mantén coherencia con la conversación anterior cuando se proporcione contexto

Analiza el contexto proporcionado y responde apropiadamente.`
                    },
                    {
                        role: "user",
                        content: mensajeConContexto
                    }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 800
            });

            const respuestaIA = response.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta en este momento.";

            this.chatMemoryService.addMessage(chatId, 'user', mensaje);
            this.chatMemoryService.addMessage(chatId, 'assistant', respuestaIA);

            return respuestaIA;

        } catch (error) {
            console.error('Error en generarRespuestaLibre:', error);
            throw new Error('Error al generar respuesta libre');
        }
    }

    getMemoryStats() {
        return this.chatMemoryService.getMemoryStats();
    }

    clearChatMemory(chatId) {
        this.chatMemoryService.clearChat(chatId);
    }
}

module.exports = GroqIAService;