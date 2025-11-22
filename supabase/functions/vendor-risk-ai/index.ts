import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, vendorData, assessmentData } = await req.json();
    console.log('AI Analysis request:', { type });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    let systemPrompt = '';
    let userPrompt = '';
    let tools: any[] = [];

    if (type === 'analyze_vendor') {
      // تحليل المخاطر الذكي للمورد
      systemPrompt = `أنت خبير في تحليل مخاطر الموردين والأطراف الثالثة. قم بتحليل المعلومات المقدمة عن المورد وحدد المخاطر المحتملة.`;
      
      userPrompt = `قم بتحليل المورد التالي وحدد المخاطر:
      
الاسم: ${vendorData.vendor_name_ar}
النوع: ${vendorData.vendor_type || 'غير محدد'}
البلد: ${vendorData.country || 'غير محدد'}
مستوى المخاطر الحالي: ${vendorData.overall_risk_level || 'غير محدد'}
الدرجة الإجمالية: ${vendorData.overall_risk_score || 0}/10

قم بتحليل شامل وحدد:
1. المخاطر الأمنية المحتملة
2. مخاطر الامتثال
3. المخاطر التشغيلية
4. المخاطر المالية
5. المخاطر السمعية
6. توصيات للتخفيف من المخاطر`;

      tools = [
        {
          type: "function",
          function: {
            name: "analyze_vendor_risks",
            description: "تحليل شامل لمخاطر المورد",
            parameters: {
              type: "object",
              properties: {
                security_risks: {
                  type: "array",
                  items: { type: "string" },
                  description: "قائمة بالمخاطر الأمنية"
                },
                compliance_risks: {
                  type: "array",
                  items: { type: "string" },
                  description: "قائمة بمخاطر الامتثال"
                },
                operational_risks: {
                  type: "array",
                  items: { type: "string" },
                  description: "قائمة بالمخاطر التشغيلية"
                },
                financial_risks: {
                  type: "array",
                  items: { type: "string" },
                  description: "قائمة بالمخاطر المالية"
                },
                reputational_risks: {
                  type: "array",
                  items: { type: "string" },
                  description: "قائمة بالمخاطر السمعية"
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                  description: "توصيات للتخفيف من المخاطر"
                },
                overall_assessment: {
                  type: "string",
                  description: "التقييم الشامل"
                }
              },
              required: ["security_risks", "compliance_risks", "operational_risks", "financial_risks", "reputational_risks", "recommendations", "overall_assessment"],
              additionalProperties: false
            }
          }
        }
      ];

    } else if (type === 'generate_recommendations') {
      // توليد توصيات تلقائية بناءً على التقييم
      systemPrompt = `أنت خبير في إدارة مخاطر الموردين. قم بتوليد توصيات عملية بناءً على نتائج تقييم المخاطر.`;
      
      userPrompt = `بناءً على تقييم المخاطر التالي، قم بتوليد توصيات عملية:

المورد: ${assessmentData.vendor_name || 'غير محدد'}
نوع التقييم: ${assessmentData.assessment_type}
المخاطر الأمنية: ${assessmentData.security_risk_score}/10
مخاطر الامتثال: ${assessmentData.compliance_risk_score}/10
المخاطر التشغيلية: ${assessmentData.operational_risk_score}/10
المخاطر المالية: ${assessmentData.financial_risk_score}/10
المخاطر السمعية: ${assessmentData.reputational_risk_score}/10
الدرجة الإجمالية: ${assessmentData.overall_risk_score}/10
مستوى المخاطر: ${assessmentData.overall_risk_level}

قدم توصيات محددة وعملية للتعامل مع هذه المخاطر.`;

      tools = [
        {
          type: "function",
          function: {
            name: "generate_recommendations",
            description: "توليد توصيات عملية",
            parameters: {
              type: "object",
              properties: {
                immediate_actions: {
                  type: "array",
                  items: { type: "string" },
                  description: "إجراءات فورية يجب اتخاذها"
                },
                short_term_actions: {
                  type: "array",
                  items: { type: "string" },
                  description: "إجراءات قصيرة المدى (1-3 أشهر)"
                },
                long_term_actions: {
                  type: "array",
                  items: { type: "string" },
                  description: "إجراءات طويلة المدى (6+ أشهر)"
                },
                monitoring_points: {
                  type: "array",
                  items: { type: "string" },
                  description: "نقاط المراقبة المستمرة"
                },
                priority_level: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                  description: "مستوى الأولوية"
                }
              },
              required: ["immediate_actions", "short_term_actions", "long_term_actions", "monitoring_points", "priority_level"],
              additionalProperties: false
            }
          }
        }
      ];

    } else if (type === 'calculate_risk_scores') {
      // حساب تلقائي لدرجات المخاطر
      systemPrompt = `أنت خبير في تقييم المخاطر. قم بحساب درجات المخاطر المختلفة بناءً على معلومات المورد.`;
      
      userPrompt = `بناءً على المعلومات التالية عن المورد، قم بحساب درجات المخاطر:

النوع: ${vendorData.vendor_type || 'غير محدد'}
البلد: ${vendorData.country || 'غير محدد'}
الصناعة: ${vendorData.industry || 'غير محدد'}
قيمة العقد: ${vendorData.contract_value || 0}

قم بتقييم كل فئة من فئات المخاطر على مقياس من 0 إلى 10.`;

      tools = [
        {
          type: "function",
          function: {
            name: "calculate_risk_scores",
            description: "حساب درجات المخاطر",
            parameters: {
              type: "object",
              properties: {
                security_risk_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 10,
                  description: "درجة المخاطر الأمنية"
                },
                compliance_risk_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 10,
                  description: "درجة مخاطر الامتثال"
                },
                operational_risk_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 10,
                  description: "درجة المخاطر التشغيلية"
                },
                financial_risk_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 10,
                  description: "درجة المخاطر المالية"
                },
                reputational_risk_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 10,
                  description: "درجة المخاطر السمعية"
                },
                overall_risk_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 10,
                  description: "الدرجة الإجمالية"
                },
                overall_risk_level: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                  description: "مستوى المخاطر الإجمالي"
                },
                rationale: {
                  type: "string",
                  description: "التبرير للدرجات المحسوبة"
                }
              },
              required: ["security_risk_score", "compliance_risk_score", "operational_risk_score", "financial_risk_score", "reputational_risk_score", "overall_risk_score", "overall_risk_level", "rationale"],
              additionalProperties: false
            }
          }
        }
      ];
    } else {
      throw new Error('Invalid analysis type');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: tools,
        tool_choice: { type: "function", function: { name: tools[0].function.name } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يرجى إضافة رصيد إلى حساب Lovable AI الخاص بك.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const aiResponse = await response.json();
    console.log('AI Response received');

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vendor-risk-ai:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});