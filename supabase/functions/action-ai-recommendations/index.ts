/**
 * Action AI Recommendations Edge Function
 * M11: AI-powered action suggestions using Lovable AI
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action_id: string;
  analysis_type: 'suggestions' | 'risk_assessment' | 'optimization' | 'next_steps';
  tenant_id: string;
}

interface ActionData {
  id: string;
  title_ar: string;
  desc_ar: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  progress?: number;
  milestones?: any[];
  dependencies?: any[];
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    console.log('AI Recommendations request:', body);

    const { action_id, analysis_type, tenant_id } = body;

    if (!action_id || !analysis_type || !tenant_id) {
      throw new Error('Missing required fields: action_id, analysis_type, tenant_id');
    }

    // Fetch action data
    const { data: action, error: actionError } = await supabase
      .from('gate_h_actions')
      .select('*')
      .eq('id', action_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (actionError || !action) {
      throw new Error('Action not found');
    }

    // Fetch related data
    const { data: milestones } = await supabase
      .from('action_plan_milestones')
      .select('*')
      .eq('action_id', action_id)
      .eq('tenant_id', tenant_id);

    const { data: dependencies } = await supabase
      .from('action_plan_dependencies')
      .select('*')
      .or(`source_action_id.eq.${action_id},target_action_id.eq.${action_id}`)
      .eq('tenant_id', tenant_id);

    const { data: tracking } = await supabase
      .from('action_plan_tracking')
      .select('*')
      .eq('action_id', action_id)
      .eq('tenant_id', tenant_id)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .single();

    // Prepare AI context
    const actionData: ActionData = {
      ...action,
      progress: tracking?.progress_pct || 0,
      milestones: milestones || [],
      dependencies: dependencies || [],
    };

    // Generate recommendations based on analysis type
    let recommendations;
    switch (analysis_type) {
      case 'suggestions':
        recommendations = await generateSuggestions(actionData);
        break;
      case 'risk_assessment':
        recommendations = await assessRisks(actionData, tracking);
        break;
      case 'optimization':
        recommendations = await suggestOptimizations(actionData);
        break;
      case 'next_steps':
        recommendations = await suggestNextSteps(actionData);
        break;
      default:
        throw new Error(`Unknown analysis type: ${analysis_type}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action_id,
        analysis_type,
        recommendations,
        generated_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI Recommendations error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Generate improvement suggestions using Lovable AI
 */
async function generateSuggestions(action: ActionData) {
  const prompt = `
أنت خبير في إدارة خطط العمل والحوكمة. قم بتحليل الإجراء التالي وقدم 3-5 توصيات محددة لتحسينه:

**الإجراء:**
- العنوان: ${action.title_ar}
- الوصف: ${action.desc_ar || 'غير متوفر'}
- الحالة: ${action.status}
- الأولوية: ${action.priority}
- الموعد النهائي: ${action.due_date || 'غير محدد'}
- نسبة الإنجاز: ${action.progress}%
- عدد المعالم: ${action.milestones?.length || 0}
- عدد التبعيات: ${action.dependencies?.length || 0}

قدم توصيات في النقاط التالية:
1. تحسين الكفاءة
2. تقليل المخاطر
3. تحسين التنسيق
4. تحسين الجودة
5. تسريع التنفيذ

يجب أن تكون كل توصية:
- محددة وقابلة للتنفيذ
- مرتبطة بالوضع الحالي
- مختصرة (جملة أو جملتين)

قدم الإجابة بصيغة JSON فقط بدون أي نص إضافي:
{
  "suggestions": [
    { "title": "العنوان", "description": "الوصف", "priority": "high|medium|low", "impact": "الأثر المتوقع" }
  ]
}
`;

  try {
    const response = await fetch('https://api.lovable.app/v1/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_AI_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        prompt,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';
    
    // Parse AI response
    const parsed = JSON.parse(content);
    return parsed.suggestions || [];
  } catch (error) {
    console.error('AI generation error:', error);
    return getFallbackSuggestions(action);
  }
}

/**
 * Assess risks using AI analysis
 */
async function assessRisks(action: ActionData, tracking: any) {
  const prompt = `
قم بتحليل المخاطر المحتملة لهذا الإجراء:

**الإجراء:**
- العنوان: ${action.title_ar}
- الحالة: ${action.status}
- الأولوية: ${action.priority}
- الموعد النهائي: ${action.due_date || 'غير محدد'}
- نسبة الإنجاز: ${action.progress}%
- صحة الإجراء: ${tracking?.health_score || 'غير متوفر'}
- في خطر: ${tracking?.is_at_risk ? 'نعم' : 'لا'}
- متأخر: ${tracking?.is_overdue ? 'نعم' : 'لا'}

حدد 3-5 مخاطر محتملة مع:
- شدة الخطر (critical, high, medium, low)
- احتمالية الحدوث (high, medium, low)
- الإجراء الوقائي المقترح

قدم الإجابة بصيغة JSON فقط:
{
  "risks": [
    {
      "title": "عنوان الخطر",
      "description": "وصف الخطر",
      "severity": "critical|high|medium|low",
      "likelihood": "high|medium|low",
      "mitigation": "الإجراء الوقائي"
    }
  ]
}
`;

  try {
    const response = await fetch('https://api.lovable.app/v1/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_AI_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        prompt,
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return parsed.risks || [];
  } catch (error) {
    console.error('Risk assessment error:', error);
    return getFallbackRisks(action, tracking);
  }
}

/**
 * Suggest optimizations
 */
async function suggestOptimizations(action: ActionData) {
  return [
    {
      title: 'تحسين تقسيم المهام',
      description: 'قم بتقسيم الإجراء إلى معالم أصغر وأكثر قابلية للإدارة',
      effort: 'low',
      impact: 'high',
    },
    {
      title: 'أتمتة التذكيرات',
      description: 'فعّل التذكيرات التلقائية لضمان عدم فوات المواعيد',
      effort: 'low',
      impact: 'medium',
    },
    {
      title: 'مراجعة التبعيات',
      description: 'تحقق من التبعيات لتحديد الاختناقات المحتملة',
      effort: 'medium',
      impact: 'high',
    },
  ];
}

/**
 * Suggest next steps
 */
async function suggestNextSteps(action: ActionData) {
  const steps = [];

  if (action.status === 'new') {
    steps.push({
      order: 1,
      action: 'بدء التنفيذ',
      description: 'قم بتحديث حالة الإجراء إلى "قيد التنفيذ" وابدأ العمل',
      priority: 'high',
    });
  }

  if (!action.milestones || action.milestones.length === 0) {
    steps.push({
      order: 2,
      action: 'إضافة معالم',
      description: 'قم بتقسيم الإجراء إلى معالم قابلة للقياس',
      priority: 'high',
    });
  }

  if (action.progress && action.progress < 100) {
    steps.push({
      order: 3,
      action: 'تحديث التقدم',
      description: 'قم بتحديث نسبة الإنجاز بناءً على العمل المنجز',
      priority: 'medium',
    });
  }

  steps.push({
    order: 4,
    action: 'مراجعة دورية',
    description: 'قم بجدولة مراجعة أسبوعية للتقدم والمعوقات',
    priority: 'medium',
  });

  return steps;
}

/**
 * Fallback suggestions when AI fails
 */
function getFallbackSuggestions(action: ActionData) {
  return [
    {
      title: 'تحسين التوثيق',
      description: 'أضف وصفاً تفصيلياً للإجراء يوضح الأهداف والخطوات المطلوبة',
      priority: 'medium',
      impact: 'تحسين الوضوح والتنسيق',
    },
    {
      title: 'تحديد المعالم',
      description: 'قم بتقسيم الإجراء إلى معالم صغيرة قابلة للقياس',
      priority: 'high',
      impact: 'تحسين التتبع والمراقبة',
    },
    {
      title: 'مراجعة الموعد النهائي',
      description: 'تأكد من أن الموعد النهائي واقعي بناءً على الموارد المتاحة',
      priority: 'medium',
      impact: 'تقليل مخاطر التأخير',
    },
  ];
}

/**
 * Fallback risks when AI fails
 */
function getFallbackRisks(action: ActionData, tracking: any) {
  const risks = [];

  if (tracking?.is_overdue) {
    risks.push({
      title: 'تجاوز الموعد النهائي',
      description: 'الإجراء متأخر عن الموعد المحدد',
      severity: 'high',
      likelihood: 'high',
      mitigation: 'إعادة تقييم الموارد والجدول الزمني',
    });
  }

  if (!action.milestones || action.milestones.length === 0) {
    risks.push({
      title: 'عدم وجود معالم',
      description: 'صعوبة تتبع التقدم بدون معالم محددة',
      severity: 'medium',
      likelihood: 'high',
      mitigation: 'إضافة معالم قابلة للقياس',
    });
  }

  if (action.progress && action.progress < 30) {
    risks.push({
      title: 'تقدم بطيء',
      description: 'نسبة الإنجاز منخفضة مقارنة بالوقت المنقضي',
      severity: 'medium',
      likelihood: 'medium',
      mitigation: 'تخصيص موارد إضافية أو إعادة التقييم',
    });
  }

  return risks;
}
