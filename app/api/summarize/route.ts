import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Eres un experto generador de resúmenes que convierte transcripciones de videos en contenido atractivo y fácil de digerir.

Por favor, analiza la transcripción y genera un resumen estructurado en formato JSON con los siguientes campos:

{
  "title": "Título atractivo que capture la esencia del video",
  "quickSummary": "Resumen en 2-3 oraciones capturando la esencia",
  "mainPoints": [
    {
      "point": "Punto clave 1",
      "description": "Descripción detallada"
    }
  ],
  "highlights": [
    {
      "moment": "Descripción del momento destacado",
      "timestamp": "Timestamp si está disponible (opcional)"
    }
  ],
  "keyConclusions": "Resumen de los takeaways más importantes",
  "references": [
    {
      "type": "Tipo de referencia (libro, link, recurso)",
      "description": "Descripción del recurso mencionado"
    }
  ]
}

Instrucciones específicas:
1. Identifica el tema principal y subtemas
2. Detecta los puntos clave y momentos destacados
3. Reconoce términos técnicos que necesiten explicación
4. Identifica ejemplos o casos de estudio mencionados
5. Usa un tono conversacional pero profesional
6. Simplifica conceptos complejos
7. Evita jerga innecesaria
8. Mantén un flujo lógico y coherente

La salida DEBE ser un objeto JSON válido siguiendo exactamente la estructura proporcionada.`;

export async function POST(req: Request) {
  console.log('Received POST request to /api/summarize');
  
  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    console.log('API Key present:', !!DEEPSEEK_API_KEY);
    
    if (!DEEPSEEK_API_KEY) {
      console.error('API key is missing');
      return NextResponse.json({ 
        error: 'API configuration error - Missing API key' 
      }, { status: 500 });
    }

    try {
      console.log('Making request to DEEPSEEK API...');
      
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            {
              role: "user",
              content: `Por favor, analiza y resume la siguiente transcripción de video siguiendo el formato JSON especificado:\n\n${transcript}`
            }
          ],
          response_format: {
            type: 'json_object'
          },
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('DEEPSEEK API error:', errorData);
        throw new Error(errorData?.error?.message || 'Failed to generate summary');
      }

      const data = await response.json();
      console.log('Summary generated successfully');

      return NextResponse.json({
        summary: data.choices[0].message.content
      });

    } catch (error) {
      console.error('API request failed:', error);
      return NextResponse.json({
        error: 'Summary generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json({
      error: 'Request processing failed',
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
