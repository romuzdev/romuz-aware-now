/**
 * M17: Knowledge Hub + RAG - Edge Function
 * Function: knowledge-search
 * Purpose: Semantic search across knowledge documents using vector similarity
 * 
 * This function performs intelligent semantic search by:
 * 1. Converting the search query to vector embedding
 * 2. Finding similar documents using cosine similarity
 * 3. Ranking results by relevance
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  documentType?: string;
  category?: string;
  limit?: number;
  threshold?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 knowledge-search: Starting semantic search');
    
    const {
      query,
      documentType,
      category,
      limit = 10,
      threshold = 0.7,
    }: SearchRequest = await req.json();

    if (!query || query.trim().length === 0) {
      throw new Error('Query is required and cannot be empty');
    }

    // Get authorization token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Initialize Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user's tenant_id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid or missing authentication token');
    }

    console.log(`👤 User authenticated: ${user.id}`);

    // Step 1: Generate embedding for the query
    console.log(`📝 Generating embedding for query: "${query.substring(0, 50)}..."`);
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('❌ Embedding API error:', embeddingResponse.status, errorText);
      
      if (embeddingResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Failed to generate query embedding: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log(`✅ Query embedding generated (${queryEmbedding.length} dimensions)`);

    // Step 2: Get tenant_id for RLS filtering
    const { data: userTenants, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (tenantError || !userTenants) {
      throw new Error('Unable to determine user tenant');
    }

    const tenantId = userTenants.tenant_id;
    console.log(`🏢 Tenant ID: ${tenantId}`);

    // Step 3: Perform vector search using the database function
    console.log(`🔎 Searching for similar documents (threshold: ${threshold}, limit: ${limit})`);
    
    const { data: results, error: searchError } = await supabase.rpc(
      'match_knowledge_documents',
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit,
        p_tenant_id: tenantId,
        p_document_type: documentType || null,
      }
    );

    if (searchError) {
      console.error('❌ Vector search error:', searchError);
      throw new Error(`Search failed: ${searchError.message}`);
    }

    console.log(`✅ Found ${results?.length || 0} matching documents`);

    // Step 4: Apply additional filters if needed
    let filteredResults = results || [];
    
    if (category) {
      filteredResults = filteredResults.filter((doc: any) => doc.category === category);
      console.log(`📂 Filtered by category '${category}': ${filteredResults.length} results`);
    }

    // Note: View count tracking can be implemented in the frontend
    // or via a separate database function if needed

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: filteredResults,
        count: filteredResults.length,
        threshold,
        filters: {
          documentType: documentType || null,
          category: category || null,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in knowledge-search:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
