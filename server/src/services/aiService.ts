import { ENV } from '../config/env.js';
import { StoreFinancialSummary } from './financialEngine.js';

export interface AiInsightRecommendation {
  id: string;
  type: 'danger' | 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  metricImpact?: string;
  recommendedAction: string;
}

export interface AiInsightsResult {
  source: 'ai_llm' | 'deterministic_engine';
  periodAnalysed: string;
  summaryHighlights: string[];
  recommendations: AiInsightRecommendation[];
  disclaimer: string;
  isFallback: boolean;
  message?: string;
}

export class AiInsightsService {
  /**
   * Generates AI or rules-based recommendations using purely aggregated, anonymized metrics.
   */
  public static async generateInsights(
    summary: StoreFinancialSummary,
    productRankings: any[],
    returnAnalytics: any,
    expenseBreakdown: any[]
  ): Promise<AiInsightsResult> {
    const periodAnalysed = summary.period.startDate && summary.period.endDate
      ? `${summary.period.startDate.toISOString().split('T')[0]} to ${summary.period.endDate.toISOString().split('T')[0]}`
      : 'All-time historical performance';

    // 1. If AI API Key is present, attempt LLM call
    if (ENV.AI_API_KEY) {
      try {
        const llmResult = await this.callGeminiApi(
          summary,
          productRankings,
          returnAnalytics,
          expenseBreakdown,
          periodAnalysed
        );
        if (llmResult) {
          return {
            ...llmResult,
            source: 'ai_llm',
            isFallback: false,
            periodAnalysed,
            disclaimer:
              'AI recommendations are advisory insights derived from aggregate business trends and do not constitute certified tax or accounting audit advice.',
          };
        }
      } catch (err) {
        console.warn('⚠️ Gemini AI request failed, falling back to deterministic engine:', err);
      }
    }

    // 2. Deterministic Fallback Engine (Runs when no API key is provided or on network error)
    return this.generateDeterministicInsights(
      summary,
      productRankings,
      returnAnalytics,
      expenseBreakdown,
      periodAnalysed,
      !ENV.AI_API_KEY
    );
  }

  /**
   * Direct, secure Gemini REST API integration using minimum anonymized aggregated metrics.
   */
  private static async callGeminiApi(
    summary: StoreFinancialSummary,
    products: any[],
    returns: any,
    expenses: any[],
    periodAnalysed: string
  ): Promise<any | null> {
    const anonymizedPayload = {
      period: periodAnalysed,
      overview: {
        totalOrders: summary.totalOrders,
        deliveredOrders: summary.deliveredOrders,
        netRevenueINR: summary.netRevenue,
        productCostINR: summary.totalProductCost,
        shippingPaidINR: summary.totalShipping,
        advertisingCostINR: summary.totalAdvertising,
        overheadINR: summary.totalOverhead,
        netProfitINR: summary.netProfit,
        profitMarginPercent: summary.profitMargin,
        returnRatePercent: summary.returnRatePercent,
      },
      topProducts: products.slice(0, 10).map((p) => ({
        SKU: p.SKU,
        name: p.name,
        unitsSold: p.unitsSold,
        marginPercent: p.profitMargin,
        returnRatePercent: p.returnRate,
        netProfitINR: p.netProfit,
      })),
      returns: {
        totalReturns: returns.totalReturns,
        totalRefundsINR: returns.totalRefunds,
        reasons: returns.byReason,
      },
      expenses: expenses.map((e) => ({
        category: e.category,
        amountINR: e.amount,
        percentage: e.percentage,
      })),
    };

    const prompt = `You are a world-class senior e-commerce financial analyst reviewing anonymized store data.
Data:
${JSON.stringify(anonymizedPayload, null, 2)}

Provide structured actionable optimization insights. Return STRICTLY valid JSON with no markdown wrapping and no backticks matching this TypeScript format:
{
  "summaryHighlights": ["highlight 1", "highlight 2"],
  "recommendations": [
    {
      "id": "rec-1",
      "type": "danger" | "warning" | "opportunity" | "info",
      "title": "Title here",
      "description": "Analysis of the specific metric",
      "metricImpact": "e.g. Saves estimated ₹12,000 / month",
      "recommendedAction": "Actionable instruction for the store owner"
    }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${ENV.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${ENV.AI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(12000), // 12 second strict timeout
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = (await response.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return parsed;
  }

  /**
   * Deterministic Rules-Based Fallback Engine.
   * Produces intelligent, metric-grounded business insights without external LLM calls.
   */
  private static generateDeterministicInsights(
    summary: StoreFinancialSummary,
    products: any[],
    returns: any,
    expenses: any[],
    periodAnalysed: string,
    noApiKeyConfigured: boolean
  ): AiInsightsResult {
    const highlights: string[] = [];
    const recommendations: AiInsightRecommendation[] = [];

    // Highlight 1: Overall Profitability
    if (summary.totalOrders === 0) {
      highlights.push('Store has no recorded orders yet for this timeframe.');
      recommendations.push({
        id: 'rec-onboarding',
        type: 'info',
        title: 'Initial Store Setup & Order Ingestion',
        description: 'Connect your channels or create orders to establish baseline unit economics.',
        metricImpact: 'Enables real-time P&L visibility',
        recommendedAction: 'Click "Seed Demo Store Data" or create your first order in the Orders tab.',
      });
      return {
        source: 'deterministic_engine',
        isFallback: true,
        periodAnalysed,
        summaryHighlights: highlights,
        recommendations,
        disclaimer: 'Advisory insights. Professional review recommended.',
        message: noApiKeyConfigured
          ? 'AI API key not configured. Using deterministic rules-based insights engine.'
          : 'AI service temporarily unavailable. Fallback engine activated.',
      };
    }

    highlights.push(
      `Store generated ₹${summary.netRevenue.toLocaleString('en-IN')} net revenue across ${summary.totalOrders} orders with an aggregate net margin of ${summary.profitMargin}%.`
    );

    // Rule 1: High Sales but Low Margin Products
    const lowMarginHighVolume = products.filter(
      (p) => p.unitsSold >= 3 && p.profitMargin < 18
    );
    if (lowMarginHighVolume.length > 0) {
      const topOffender = lowMarginHighVolume[0];
      recommendations.push({
        id: 'rec-low-margin-product',
        type: 'danger',
        title: `Margin Leakage on High-Volume SKU: ${topOffender.SKU}`,
        description: `"${topOffender.name}" has sold ${topOffender.unitsSold} units, but yields only a ${topOffender.profitMargin}% profit margin (Unit Cost: ₹${topOffender.unitCost}, Selling: ₹${topOffender.sellingPrice}). Courier and packaging expenses easily turn these sales negative.`,
        metricImpact: `Potential margin uplift of +8% to 15%`,
        recommendedAction: `Increase selling price from ₹${topOffender.sellingPrice} to ₹${(topOffender.sellingPrice * 1.15).toFixed(0)} or renegotiate supplier unit cost below ₹${(topOffender.unitCost * 0.85).toFixed(0)}.`,
      });
    }

    // Rule 2: High Return Rate Products
    const highReturnProducts = products.filter(
      (p) => p.unitsSold >= 3 && p.returnRate > 15
    );
    if (highReturnProducts.length > 0) {
      const p = highReturnProducts[0];
      recommendations.push({
        id: 'rec-high-return-rate',
        type: 'warning',
        title: `Elevated Return Rate on SKU: ${p.SKU} (${p.returnRate}%)`,
        description: `Product "${p.name}" has a return rate of ${p.returnRate}%, surpassing the healthy e-commerce benchmark of 8-10%. Reverse logistics fees and damaged stock are eroding margin.`,
        metricImpact: `Save reverse courier fees and avoid stock write-offs`,
        recommendedAction: `Inspect recent return reasons. Review product sizing charts, packaging protection, and image accuracy on your storefront.`,
      });
    }

    // Rule 3: Shipping Cost Ratio
    const shippingRatio = summary.netRevenue > 0
      ? (summary.totalShipping / summary.netRevenue) * 100
      : 0;
    if (shippingRatio > 20) {
      recommendations.push({
        id: 'rec-shipping-ratio',
        type: 'warning',
        title: 'Elevated Shipping Cost Burden',
        description: `Seller-paid outward and reverse freight accounts for ${shippingRatio.toFixed(1)}% of net revenue (₹${summary.totalShipping.toLocaleString('en-IN')}).`,
        metricImpact: 'Estimated 3-5% margin recovery',
        recommendedAction: 'Institute a minimum order threshold for free delivery (e.g. ₹999) or introduce nominal delivery fees on lower basket sizes.',
      });
    } else {
      highlights.push(`Shipping costs remain controlled at ${shippingRatio.toFixed(1)}% of net revenue.`);
    }

    // Rule 4: Advertising Expenditure Ratio
    const adRatio = summary.netRevenue > 0
      ? (summary.totalAdvertising / summary.netRevenue) * 100
      : 0;
    if (adRatio > 30) {
      recommendations.push({
        id: 'rec-high-ad-spend',
        type: 'danger',
        title: 'High Customer Acquisition Cost (CAC)',
        description: `Advertising expenditure comprises ${adRatio.toFixed(1)}% of net revenue (₹${summary.totalAdvertising.toLocaleString('en-IN')}). High ad spend without repeat purchases threatens cash flow.`,
        metricImpact: 'Directly lowers customer acquisition burn',
        recommendedAction: 'Pause bottom-performing ad sets with ROAS < 2.5x and implement post-purchase WhatsApp/email retention campaigns.',
      });
    }

    // Rule 5: Top-Performing Products to Scale
    const starProducts = products.filter((p) => p.profitMargin > 35 && p.unitsSold >= 2);
    if (starProducts.length > 0) {
      const star = starProducts[0];
      recommendations.push({
        id: 'rec-scale-star-product',
        type: 'opportunity',
        title: `Scale High-Profit Performer: ${star.SKU}`,
        description: `"${star.name}" demonstrates a healthy ${star.profitMargin}% margin and generated ₹${star.netProfit.toLocaleString('en-IN')} in pure net profit.`,
        metricImpact: 'High-conviction revenue accelerator',
        recommendedAction: `Allocate higher ad budget and feature this item on hero homepage banners and bundle promotions.`,
      });
    }

    return {
      source: 'deterministic_engine',
      isFallback: true,
      periodAnalysed,
      summaryHighlights: highlights,
      recommendations,
      disclaimer:
        'Deterministic financial heuristics derived from deterministic backend accounting metrics. Always perform human business evaluation before executing major pricing adjustments.',
      message: noApiKeyConfigured
        ? 'AI API key not configured. Using deterministic rules-based insights engine.'
        : 'Fallback engine active.',
    };
  }
}
