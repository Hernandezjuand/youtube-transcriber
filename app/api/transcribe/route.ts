import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('Received POST request to /api/transcribe');
  
  try {
    const body = await req.json();
    const { url } = body;

    console.log('Request body:', { url });

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
    console.log('API Key present:', !!SUPADATA_API_KEY);
    
    if (!SUPADATA_API_KEY) {
      console.error('API key is missing');
      return NextResponse.json({ 
        error: 'API configuration error - Missing API key' 
      }, { status: 500 });
    }

    try {
      console.log('Making request to SUPADATA API...');

      // Construir la URL con los parámetros
      const apiUrl = new URL('https://api.supadata.ai/v1/youtube/transcript');
      apiUrl.searchParams.append('url', url);
      apiUrl.searchParams.append('text', 'true');

      console.log('Request URL:', apiUrl.toString().replace(url, '[VIDEO_URL]'));

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-api-key': SUPADATA_API_KEY,
          'Accept': 'application/json'
        }
      });

      console.log('SUPADATA API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        
        // Manejar errores específicos
        if (response.status === 401) {
          return NextResponse.json({ 
            error: 'Invalid API key' 
          }, { status: 401 });
        }
        
        if (response.status === 404) {
          return NextResponse.json({ 
            error: 'No transcript available for this video' 
          }, { status: 404 });
        }

        throw new Error(errorData?.message || 'Failed to get transcript');
      }

      const data = await response.json();
      console.log('Response data received:', {
        hasContent: !!data?.content,
        lang: data?.lang,
        availableLangs: data?.availableLangs
      });

      if (!data?.content) {
        console.error('Invalid response format:', data);
        return NextResponse.json({ 
          error: 'Invalid response from transcription service' 
        }, { status: 500 });
      }

      return NextResponse.json(data);

    } catch (error) {
      console.error('API request failed:', error);

      if (error instanceof Error) {
        return NextResponse.json({
          error: 'Transcription service error',
          details: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        error: 'Unknown error occurred',
        message: 'Failed to process request'
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
