import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNewsById, getNewsSummary, saveNewsSummary } from '@/lib/db';
import { extractArticleContent, prepareForSummarization } from '@/lib/articleExtractor';
import Groq from 'groq-sdk';
import { rateLimitByIp, rateLimitByKey } from '@/lib/rateLimit';

// Lazy-initialize Groq client (avoid build-time errors when env is missing)
let groq: Groq | null = null;
function getGroq(): Groq {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groq;
}

// Generate AI summary for a news article
export async function POST(request: NextRequest) {
  try {
    const ipLimit = rateLimitByIp(request, 'summary', 30, 60 * 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many summary requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
      );
    }

    // Check authentication (keeps rate limiting reasonable)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please log in to use this feature' },
        { status: 401 }
      );
    }

    const userLimit = rateLimitByKey('summary-user', session.user.id, 60, 60 * 60);
    if (!userLimit.allowed) {
      return NextResponse.json(
        { error: 'Hourly summary limit reached. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(userLimit.retryAfter) } }
      );
    }

    const body = await request.json();
    const { newsId, language = 'en' } = body;

    if (!newsId) {
      return NextResponse.json(
        { error: 'News ID is required' },
        { status: 400 }
      );
    }

    // Check if we already have a cached summary
    const existingSummary = getNewsSummary(newsId);
    const langField = language === 'zh' ? 'summary_zh' :
                      language === 'ms' ? 'summary_ms' : 'summary_en';

    if (existingSummary && existingSummary[langField]) {
      return NextResponse.json({
        summary: existingSummary[langField],
        cached: true
      });
    }

    // Get the news article
    const news = getNewsById(newsId);
    if (!news) {
      return NextResponse.json(
        { error: 'News article not found' },
        { status: 404 }
      );
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Get the title in the requested language
    const title = language === 'zh' && news.title_zh ? news.title_zh :
                  language === 'ms' && news.title_ms ? news.title_ms : news.title;

    // Fetch actual article content from source URL
    console.log('Fetching article content from:', news.source_url);
    const { content: articleContent, success: fetchSuccess, error: fetchError } =
      await extractArticleContent(news.source_url);

    if (fetchSuccess) {
      console.log('Successfully extracted article content:', articleContent.substring(0, 200) + '...');
    } else {
      console.log('Could not fetch article content:', fetchError);
    }

    // Prepare content for summarization
    const contentForAI = fetchSuccess
      ? prepareForSummarization(articleContent, news.title)
      : '';

    // Generate summary using Groq
    const languageInstructions = {
      en: 'Respond in English.',
      zh: 'Respond in Simplified Chinese (简体中文).',
      ms: 'Respond in Bahasa Malaysia.'
    };

    // Build the prompt based on available content
    const hasContent = contentForAI.length > 100;
    const userPrompt = hasContent
      ? `Please summarize this news article:

Title: ${title}
Source: ${news.source_name}
Published: ${news.published_at || news.created_at}

Article Content:
${contentForAI}

Create a brief, informative summary based on the article content above.`
      : `Please summarize this news article:

Title: ${title}
Source: ${news.source_name}
Published: ${news.published_at || news.created_at}

Note: Full article content could not be retrieved. Please create a summary based on the title and source information.`;

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a professional news summarizer. Create concise, informative summaries of news articles. ${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en}

Guidelines:
- Summarize in 2-3 sentences (max 100 words)
- Focus on the key facts: who, what, when, where, why
- Use neutral, journalistic tone
- Do not add opinions or speculation
- Base the summary on the actual article content when available`
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 250
    });

    const summary = completion.choices[0]?.message?.content?.trim() || '';

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Cache the summary in database
    const summaryData: Record<string, string> = {};
    summaryData[langField] = summary;
    saveNewsSummary(newsId, summaryData);

    return NextResponse.json({
      summary,
      cached: false
    });

  } catch (error) {
    console.error('Error generating summary:', error);

    // Handle specific Groq errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again in a moment.' },
          { status: 429 }
        );
      }
      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please contact administrator.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate summary. Please try again.' },
      { status: 500 }
    );
  }
}
