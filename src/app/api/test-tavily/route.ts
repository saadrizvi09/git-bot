import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'TAVILY_API_KEY not found in environment variables' 
    }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: 'which version of fastapi is latest',
        search_depth: 'advanced',
        include_answer: true,
        max_results: 2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: `Tavily API error: ${response.statusText}`,
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tavily is working!',
      resultsCount: data.results?.length || 0,
      hasAnswer: !!data.answer,
      sample: {
        answer: data.answer?.slice(0, 100),
        firstResult: data.results?.[0]?.title
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
