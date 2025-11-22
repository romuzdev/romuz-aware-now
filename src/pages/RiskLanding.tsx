/**
 * Risk Management Landing Page
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Shield, ChartBar, Users, FileText, ArrowLeft } from 'lucide-react';

export default function RiskLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/risk/vendors');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Cyber Zone GRC</h1>
              <p className="text-sm text-muted-foreground">إدارة مخاطر الموردين</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/risk-auth/signin')}>
              تسجيل الدخول
            </Button>
            <Button onClick={() => navigate('/risk-auth/signup')}>
              إنشاء حساب
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            نظام متكامل لإدارة مخاطر الموردين
          </h2>
          <p className="text-xl text-muted-foreground">
            قم بتقييم ومراقبة مخاطر الطرف الثالث بكفاءة عالية مع تحليلات ذكية مدعومة بالذكاء الاصطناعي
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/risk-auth/signup')}>
              ابدأ مجاناً
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/risk-auth/signin')}>
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">إدارة الموردين</h3>
            <p className="text-sm text-muted-foreground">
              قاعدة بيانات شاملة لجميع الموردين ومعلومات الاتصال والتصنيفات
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <ChartBar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">تقييم المخاطر</h3>
            <p className="text-sm text-muted-foreground">
              تحليل متعدد الأبعاد للمخاطر الأمنية والامتثال والتشغيلية والمالية
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">إدارة العقود</h3>
            <p className="text-sm text-muted-foreground">
              تتبع كامل لدورة حياة العقود مع تنبيهات تلقائية للتجديد والانتهاء
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">ذكاء اصطناعي</h3>
            <p className="text-sm text-muted-foreground">
              تحليلات ذكية وتوصيات آلية لتحسين إدارة المخاطر
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="p-12 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-3xl font-bold">جاهز للبدء؟</h3>
            <p className="text-lg text-muted-foreground">
              انضم إلى المؤسسات الرائدة التي تستخدم منصتنا لإدارة مخاطر الموردين
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/risk-auth/signup')}>
                إنشاء حساب مجاني
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Cyber Zone GRC. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
