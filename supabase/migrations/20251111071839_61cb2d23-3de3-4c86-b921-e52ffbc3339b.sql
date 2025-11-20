-- Patch v6.1: Add missing trigger for quarterly_insights.updated_at

-- Create trigger function if not exists (reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for quarterly_insights
DROP TRIGGER IF EXISTS trg_quarterly_insights_touch ON public.quarterly_insights;
CREATE TRIGGER trg_quarterly_insights_touch
  BEFORE UPDATE ON public.quarterly_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();