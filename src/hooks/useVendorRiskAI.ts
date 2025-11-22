/**
 * Vendor Risk AI Hook
 * Custom hook for AI-powered vendor risk analysis
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorAnalysisResult {
  security_risks: string[];
  compliance_risks: string[];
  operational_risks: string[];
  financial_risks: string[];
  reputational_risks: string[];
  recommendations: string[];
  overall_assessment: string;
}

export interface RiskScoresResult {
  security_risk_score: number;
  compliance_risk_score: number;
  operational_risk_score: number;
  financial_risk_score: number;
  reputational_risk_score: number;
  overall_risk_score: number;
  overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
}

export interface RecommendationsResult {
  immediate_actions: string[];
  short_term_actions: string[];
  long_term_actions: string[];
  monitoring_points: string[];
  priority_level: 'low' | 'medium' | 'high' | 'critical';
}

export function useVendorRiskAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeVendor = async (vendorData: any): Promise<VendorAnalysisResult | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-risk-ai', {
        body: {
          type: 'analyze_vendor',
          vendorData,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('تم تحليل المخاطر بنجاح');
        return data.result;
      }

      throw new Error('فشل التحليل');
    } catch (error) {
      console.error('AI analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل تحليل المخاطر';
      
      if (errorMessage.includes('429')) {
        toast.error('تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.');
      } else if (errorMessage.includes('402')) {
        toast.error('يرجى إضافة رصيد إلى حساب Lovable AI.');
      } else {
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateRiskScores = async (vendorData: any): Promise<RiskScoresResult | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-risk-ai', {
        body: {
          type: 'calculate_risk_scores',
          vendorData,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('تم حساب درجات المخاطر بنجاح');
        return data.result;
      }

      throw new Error('فشل الحساب');
    } catch (error) {
      console.error('AI calculation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل حساب درجات المخاطر';
      
      if (errorMessage.includes('429')) {
        toast.error('تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.');
      } else if (errorMessage.includes('402')) {
        toast.error('يرجى إضافة رصيد إلى حساب Lovable AI.');
      } else {
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRecommendations = async (assessmentData: any): Promise<RecommendationsResult | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-risk-ai', {
        body: {
          type: 'generate_recommendations',
          assessmentData,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('تم توليد التوصيات بنجاح');
        return data.result;
      }

      throw new Error('فشل توليد التوصيات');
    } catch (error) {
      console.error('AI recommendations error:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل توليد التوصيات';
      
      if (errorMessage.includes('429')) {
        toast.error('تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.');
      } else if (errorMessage.includes('402')) {
        toast.error('يرجى إضافة رصيد إلى حساب Lovable AI.');
      } else {
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analyzeVendor,
    calculateRiskScores,
    generateRecommendations,
  };
}