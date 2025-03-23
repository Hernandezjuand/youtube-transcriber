import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const loggedRequest = await request.json();
  console.log('POST /api/transcribe received:', { url: loggedRequest.url });

  try {
    const { url, customApiKey } = loggedRequest;

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Use custom API key if provided, otherwise use environment variable
    const apiKey = customApiKey || process.env.SUPADATA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is missing. Please provide your SUPADATA API key.' },
        { status: 401 }
      );
    }

    console.log('Request body:', { url });

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
          'Accept': 'application/json',
          'x-api-key': apiKey,
        },
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
