/**
 * Document OCR Edge Function
 * M10: Smart Documents Enhancement
 * 
 * Uses Lovable AI (Google Gemini 2.5 Flash) for OCR processing
 * Extracts text from images and PDF documents
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRRequest {
  documentId: string;
  storagePath: string;
  mimeType: string;
}

interface OCRResponse {
  text: string;
  confidence?: number;
  language?: string;
  page_count?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Document OCR: Starting request processing');

    // Parse request body
    const body: OCRRequest = await req.json();
    const { documentId, storagePath, mimeType } = body;

    console.log('📄 Document OCR: Processing document', {
      documentId,
      storagePath,
      mimeType,
    });

    // Validate input
    if (!documentId || !storagePath || !mimeType) {
      throw new Error('Missing required fields: documentId, storagePath, or mimeType');
    }

    // Check if file type is supported
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/bmp',
      'application/pdf',
    ];

    if (!supportedTypes.includes(mimeType.toLowerCase())) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📥 Document OCR: Downloading file from storage');

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(storagePath);

    if (downloadError) {
      console.error('❌ Document OCR: Download error', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    console.log('✅ Document OCR: File downloaded successfully');

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log('🤖 Document OCR: Calling Lovable AI for OCR processing');

    // Call Lovable AI for OCR
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this document image. Return only the extracted text, without any additional commentary or formatting. If the document is in Arabic, preserve the Arabic text exactly as it appears. If there is no readable text, return an empty string.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Document OCR: AI API error', errorText);
      throw new Error(`Lovable AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const extractedText = aiResult.choices?.[0]?.message?.content || '';

    console.log('✅ Document OCR: Text extracted successfully', {
      textLength: extractedText.length,
      hasText: extractedText.length > 0,
    });

    // Prepare response
    const response: OCRResponse = {
      text: extractedText.trim(),
      confidence: extractedText.length > 0 ? 0.9 : 0,
      language: detectLanguage(extractedText),
      page_count: mimeType === 'application/pdf' ? 1 : undefined,
    };

    console.log('📤 Document OCR: Sending response');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('❌ Document OCR: Error', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

/**
 * Simple language detection based on character ranges
 */
function detectLanguage(text: string): string {
  if (!text || text.length === 0) return 'unknown';

  const arabicCharCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  if (totalChars === 0) return 'unknown';

  const arabicRatio = arabicCharCount / totalChars;

  if (arabicRatio > 0.3) return 'ar';
  return 'en';
}
