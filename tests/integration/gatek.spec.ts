import { describe, it, expect, beforeAll } from "vitest";
import {
  getKpiTrendsMonthly,
  getKpiMonthlyFlags,
  getRcaTopContributors,
  getRecommendations,
  generateRecommendations,
  getQuarterlyInsights,
  generateQuarterlyInsights,
} from "@/integrations/supabase/gatek";

describe("Gate-K Integration Tests", () => {
  describe("KPI Trends", () => {
    it("should fetch monthly trends", async () => {
      const trends = await getKpiTrendsMonthly({
        kpi_key: "kpi_completion_rate",
        trend_window: "M6",
      });

      expect(Array.isArray(trends)).toBe(true);
      if (trends.length > 0) {
        expect(trends[0]).toHaveProperty("kpi_key");
        expect(trends[0]).toHaveProperty("month");
        expect(trends[0]).toHaveProperty("avg_value");
      }
    });

    it("should fetch monthly flags", async () => {
      const flags = await getKpiMonthlyFlags({
        kpi_key: "kpi_completion_rate",
        trend_window: "M6",
      });

      expect(Array.isArray(flags)).toBe(true);
      if (flags.length > 0) {
        expect(flags[0]).toHaveProperty("flag");
        expect(["ok", "warn", "alert", "no_ref"]).toContain(flags[0].flag);
      }
    });
  });

  describe("RCA Contributors", () => {
    it("should fetch top contributors for a KPI", async () => {
      const contributors = await getRcaTopContributors({
        kpi_key: "kpi_completion_rate",
        month: "2025-09-01",
        top_n: 5,
      });

      expect(Array.isArray(contributors)).toBe(true);
      if (contributors.length > 0) {
        expect(contributors[0]).toHaveProperty("dim_key");
        expect(contributors[0]).toHaveProperty("dim_value");
        expect(contributors[0]).toHaveProperty("contribution_score");
        expect(contributors.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("Recommendations", () => {
    it("should generate recommendations", async () => {
      const count = await generateRecommendations({
        month: "2025-09-01",
        limit: 10,
      });

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should fetch recommendations list", async () => {
      const recommendations = await getRecommendations({
        month: "2025-09-01",
      });

      expect(Array.isArray(recommendations)).toBe(true);
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty("title_ar");
        expect(recommendations[0]).toHaveProperty("body_ar");
        expect(recommendations[0]).toHaveProperty("action_type_code");
        expect(recommendations[0]).toHaveProperty("impact_level");
      }
    });
  });

  describe("Quarterly Insights", () => {
    const testYear = 2025;
    const testQuarter = 3;

    it("should generate quarterly insights", async () => {
      const result = await generateQuarterlyInsights({
        year: testYear,
        quarter: testQuarter,
        limit: 100,
      });

      expect(result).toHaveProperty("year", testYear);
      expect(result).toHaveProperty("quarter", testQuarter);
      expect(result).toHaveProperty("created");
      expect(result).toHaveProperty("kpis_count");
      expect(result).toHaveProperty("initiatives_count");
    });

    it("should fetch quarterly insights", async () => {
      const insights = await getQuarterlyInsights({
        year: testYear,
        quarter: testQuarter,
      });

      expect(Array.isArray(insights)).toBe(true);
      if (insights.length > 0) {
        expect(insights[0]).toHaveProperty("kpis_summary");
        expect(insights[0]).toHaveProperty("top_initiatives");
        expect(typeof insights[0].kpis_summary).toBe("object");
        expect(Array.isArray(insights[0].top_initiatives)).toBe(true);
      }
    });
  });

  describe("Data Quality Checks", () => {
    it("should have non-null delta_pct when previous data exists", async () => {
      const flags = await getKpiMonthlyFlags({ trend_window: "M6" });
      
      const withPrevData = flags.filter(f => f.prev_avg !== null);
      
      if (withPrevData.length > 0) {
        const nullDeltaCount = withPrevData.filter(f => f.delta_pct === null).length;
        const nullDeltaRate = nullDeltaCount / withPrevData.length;
        
        // Less than 50% should have null delta_pct
        expect(nullDeltaRate).toBeLessThan(0.5);
      }
    });

    it("should have consistent z-scores in anomaly detection", async () => {
      const flags = await getKpiMonthlyFlags({ trend_window: "M6" });
      
      const withZScore = flags.filter(f => f.zscore !== null);
      
      if (withZScore.length > 0) {
        // Z-scores should be within reasonable range (-10, 10)
        withZScore.forEach(f => {
          expect(Math.abs(f.zscore!)).toBeLessThan(10);
        });
      }
    });
  });
});
