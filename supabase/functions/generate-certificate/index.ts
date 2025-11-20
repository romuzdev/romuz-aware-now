/**
 * LMS Certificate PDF Generation Edge Function
 * 
 * Generates a PDF certificate for completed courses
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎓 Certificate generation request received');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { enrollment_id } = await req.json();
    
    if (!enrollment_id) {
      throw new Error('Missing enrollment_id');
    }

    console.log(`📋 Fetching enrollment: ${enrollment_id}`);

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('lms_enrollments')
      .select(`
        id,
        user_id,
        completed_at,
        final_score,
        course:lms_courses(
          id,
          title,
          duration_hours,
          instructor_name
        )
      `)
      .eq('id', enrollment_id)
      .eq('status', 'completed')
      .single();

    if (enrollmentError || !enrollment) {
      console.error('❌ Enrollment error:', enrollmentError);
      throw new Error('Enrollment not found or not completed');
    }

    if (enrollment.user_id !== user.id) {
      throw new Error('Unauthorized access');
    }

    // TypeScript helper: treat course as single object, not array
    const course = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
    if (!course) {
      throw new Error('Course data not found');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const studentName = profile?.full_name || user.email?.split('@')[0] || 'Student';
    const certNumber = `CERT-${enrollment.id.substring(0, 8).toUpperCase()}`;
    const completionDate = new Date(enrollment.completed_at).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log('🎨 Generating PDF...');

    const pdf = generatePDF({
      studentName,
      courseName: course.title,
      completionDate,
      certNumber,
      instructor: course.instructor_name,
      hours: course.duration_hours,
      score: enrollment.final_score,
    });

    console.log('✅ Certificate generated');

    return new Response(pdf as any, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generatePDF(data: any): Uint8Array {
  const encoder = new TextEncoder();
  
  const content = `BT
/F1 40 Tf
1 0 0 1 100 750 Tm
(CERTIFICATE OF COMPLETION) Tj
ET

BT
/F2 14 Tf
1 0 0 1 200 700 Tm
(This certifies that) Tj
ET

BT
/F1 24 Tf
1 0 0 1 150 660 Tm
(${esc(data.studentName)}) Tj
ET

BT
/F2 14 Tf
1 0 0 1 150 620 Tm
(successfully completed) Tj
ET

BT
/F1 20 Tf
1 0 0 1 100 580 Tm
(${esc(data.courseName)}) Tj
ET

BT
/F2 12 Tf
1 0 0 1 150 530 Tm
(Date: ${esc(data.completionDate)}) Tj
ET

${data.hours ? `BT
/F2 12 Tf
1 0 0 1 150 510 Tm
(Duration: ${data.hours} hours) Tj
ET
` : ''}

${data.score ? `BT
/F2 12 Tf
1 0 0 1 150 490 Tm
(Score: ${data.score}%) Tj
ET
` : ''}

BT
/F2 10 Tf
1 0 0 1 150 450 Tm
(Certificate: ${data.certNumber}) Tj
ET

${data.instructor ? `BT
/F2 12 Tf
1 0 0 1 150 350 Tm
(Instructor: ${esc(data.instructor)}) Tj
ET
` : ''}

BT
/F1 14 Tf
1 0 0 1 150 300 Tm
(Training Platform) Tj
ET

0.5 w
20 20 555 802 re
S`;

  const contentLen = encoder.encode(content).length;
  
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length ${contentLen} >>
stream
${content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000260 00000 n
0000000${(360 + contentLen).toString().padStart(3, '0')} 00000 n
0000000${(430 + contentLen).toString().padStart(3, '0')} 00000 n
trailer
<< /Size 7 /Root 1 0 R >>
startxref
${490 + contentLen}
%%EOF`;

  return encoder.encode(pdf);
}

function esc(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\n\r]/g, ' ')
    .substring(0, 80);
}
