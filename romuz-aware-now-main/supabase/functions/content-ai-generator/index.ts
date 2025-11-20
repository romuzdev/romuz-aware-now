/**
 * M13.1 - Content Hub: AI Content Generator
 * 
 * Edge Function لتوليد المحتوى باستخدام Lovable AI
 * - توليد مقالات من موضوعات
 * - إنشاء وصف للإنفوجرافيك
 * - ترجمة المحتوى (AR ↔ EN)
 * - اقتراح الوسوم والتصنيفات
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface GenerateRequest {
  action: 'generate_article' | 'translate' | 'suggest_tags' | 'generate_infographic_description' | 'rewrite' | 'generate_image';
  topic?: string;
  content?: string;
  sourceLanguage?: 'ar' | 'en';
  targetLanguage?: 'ar' | 'en';
  contentType?: string;
  tone?: 'formal' | 'casual' | 'technical' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  prompt?: string;
  language?: 'ar' | 'en';
}

serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body: GenerateRequest = await req.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'generate_article':
        result = await generateArticle(body);
        break;
      case 'translate':
        result = await translateContent(body);
        break;
      case 'suggest_tags':
        result = await suggestTags(body);
        break;
      case 'generate_infographic_description':
        result = await generateInfographicDescription(body);
        break;
      case 'rewrite':
        result = await rewriteContent(body);
        break;
      case 'generate_image':
        result = await generateImage(body);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Generate Article من موضوع معين
 */
async function generateArticle(body: GenerateRequest) {
  const { topic, tone = 'formal', length = 'medium', contentType = 'article' } = body;

  if (!topic) {
    throw new Error('Topic is required');
  }

  const lengthInstructions = {
    short: 'قصيرة (200-300 كلمة)',
    medium: 'متوسطة (500-700 كلمة)',
    long: 'طويلة (1000-1500 كلمة)',
  };

  const toneInstructions = {
    formal: 'رسمي وأكاديمي',
    casual: 'غير رسمي وودود',
    technical: 'تقني ومتخصص',
    friendly: 'ودود وسهل الفهم',
  };

  const prompt = `
أنت كاتب محتوى توعوي متخصص في الأمن السيبراني والوعي التقني.

المطلوب: اكتب مقالة ${lengthInstructions[length]} بأسلوب ${toneInstructions[tone]} عن الموضوع التالي:

الموضوع: ${topic}

متطلبات المقالة:
1. عنوان جذاب ومختصر
2. مقدمة تشويقية
3. محتوى مقسم إلى أقسام واضحة مع عناوين فرعية
4. أمثلة عملية وواقعية
5. نصائح قابلة للتطبيق
6. خاتمة تلخيصية
7. استخدام لغة عربية سليمة وواضحة

الصيغة المطلوبة:
{
  "title": "العنوان هنا",
  "introduction": "المقدمة هنا",
  "sections": [
    {
      "heading": "عنوان القسم",
      "content": "محتوى القسم"
    }
  ],
  "conclusion": "الخاتمة هنا",
  "key_points": ["نقطة 1", "نقطة 2", "نقطة 3"]
}
`;

  const response = await callLovableAI(prompt, 'google/gemini-2.5-flash');
  
  return {
    article: response,
    wordCount: countWords(response),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Translate Content بين العربية والإنجليزية
 */
async function translateContent(body: GenerateRequest) {
  const { content, sourceLanguage, targetLanguage } = body;

  if (!content || !sourceLanguage || !targetLanguage) {
    throw new Error('Content, sourceLanguage, and targetLanguage are required');
  }

  const languageNames = {
    ar: 'العربية',
    en: 'الإنجليزية',
  };

  const prompt = `
أنت مترجم متخصص في المحتوى التقني والتوعوي.

المطلوب: ترجم النص التالي من ${languageNames[sourceLanguage]} إلى ${languageNames[targetLanguage]}

مع مراعاة:
1. الحفاظ على المعنى والسياق
2. استخدام المصطلحات التقنية الصحيحة
3. الحفاظ على الأسلوب والنبرة
4. التأكد من الدقة والوضوح

النص المراد ترجمته:
${content}

قدم الترجمة فقط بدون أي شرح أو تعليق.
`;

  const translation = await callLovableAI(prompt, 'google/gemini-2.5-pro');

  return {
    translatedContent: translation.trim(),
    sourceLanguage,
    targetLanguage,
    translatedAt: new Date().toISOString(),
  };
}

/**
 * Suggest Tags اقتراح الوسوم والتصنيفات
 */
async function suggestTags(body: GenerateRequest) {
  const { content, contentType } = body;

  if (!content) {
    throw new Error('Content is required');
  }

  const prompt = `
أنت خبير في تصنيف وتنظيم المحتوى التوعوي.

المطلوب: بناءً على المحتوى التالي، اقترح:
1. تصنيف رئيسي مناسب
2. 5-7 وسوم (tags) ذات صلة
3. 3-5 كلمات مفتاحية SEO

المحتوى:
${content.substring(0, 1000)}...

نوع المحتوى: ${contentType || 'مقالة'}

قدم الاقتراحات بصيغة JSON:
{
  "category": "التصنيف الرئيسي",
  "tags": ["وسم1", "وسم2", "وسم3"],
  "seoKeywords": ["كلمة1", "كلمة2", "كلمة3"]
}
`;

  const suggestions = await callLovableAI(prompt, 'google/gemini-2.5-flash');

  return JSON.parse(suggestions);
}

/**
 * Generate Infographic Description
 */
async function generateInfographicDescription(body: GenerateRequest) {
  const { topic } = body;

  if (!topic) {
    throw new Error('Topic is required');
  }

  const prompt = `
أنت مصمم محتوى بصري متخصص في الأمن السيبراني.

المطلوب: صمم وصف تفصيلي لإنفوجرافيك عن الموضوع التالي:

الموضوع: ${topic}

الوصف يجب أن يتضمن:
1. عنوان الإنفوجرافيك
2. الأقسام الرئيسية (3-5 أقسام)
3. العناصر المرئية المقترحة (أيقونات، رسوم، ألوان)
4. الإحصائيات أو الأرقام الرئيسية
5. نصائح سريعة (3-5 نصائح)

قدم الوصف بصيغة JSON:
{
  "title": "العنوان",
  "sections": [
    {
      "title": "عنوان القسم",
      "description": "وصف القسم",
      "visualElements": ["عنصر1", "عنصر2"]
    }
  ],
  "keyStatistics": ["إحصائية1", "إحصائية2"],
  "quickTips": ["نصيحة1", "نصيحة2"],
  "colorScheme": ["#color1", "#color2"]
}
`;

  const description = await callLovableAI(prompt, 'google/gemini-2.5-flash');

  return JSON.parse(description);
}

/**
 * Rewrite Content لتحسين الصياغة
 */
async function rewriteContent(body: GenerateRequest) {
  const { content, tone = 'formal' } = body;

  if (!content) {
    throw new Error('Content is required');
  }

  const toneInstructions = {
    formal: 'رسمي وأكاديمي',
    casual: 'غير رسمي وودود',
    technical: 'تقني ومتخصص',
    friendly: 'ودود وسهل الفهم',
  };

  const prompt = `
أنت محرر محتوى محترف.

المطلوب: أعد صياغة النص التالي بأسلوب ${toneInstructions[tone]}

مع مراعاة:
1. تحسين الصياغة والوضوح
2. تصحيح الأخطاء اللغوية
3. تحسين التنظيم والتسلسل
4. الحفاظ على المعنى الأصلي

النص الأصلي:
${content}

قدم النص المحسن فقط بدون أي شرح.
`;

  const rewritten = await callLovableAI(prompt, 'google/gemini-2.5-pro');

  return {
    originalContent: content,
    rewrittenContent: rewritten.trim(),
    tone,
    rewrittenAt: new Date().toISOString(),
  };
}

/**
 * Call Lovable AI Gateway
 */
async function callLovableAI(prompt: string, model: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.');
    }
    if (response.status === 402) {
      throw new Error('يرجى إضافة رصيد إلى حساب Lovable AI الخاص بك.');
    }
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate Image using Nano banana model
 */
async function generateImage(body: GenerateRequest) {
  const { prompt, language = 'ar' } = body;

  if (!prompt) {
    throw new Error('Prompt is required');
  }

  const AI_ENDPOINT = 'https://ai.gateway.lovable.dev/v1/chat/completions';

  const systemPrompt = language === 'ar' 
    ? 'أنت مولد صور احترافي. قم بإنشاء صور عالية الجودة ومناسبة للمحتوى التوعوي.'
    : 'You are a professional image generator. Create high-quality images suitable for awareness content.';

  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.');
    }
    if (response.status === 402) {
      throw new Error('يرجى إضافة رصيد إلى حساب Lovable AI الخاص بك.');
    }
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // Extract the base64 image
  const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageUrl) {
    throw new Error('No image generated');
  }

  return {
    success: true,
    image_url: imageUrl,
    model: 'google/gemini-2.5-flash-image',
  };
}

/**
 * Helper: Count Words
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}
