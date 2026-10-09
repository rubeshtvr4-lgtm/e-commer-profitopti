import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Lightbulb,
  Info,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { AiInsightsResult, AiRecommendation } from '../../types';
import { Button } from '../../components/ui/Button';

export const AiInsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<AiInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await api.post<{ insights: AiInsightsResult }>('/ai/insights', {});
      setInsights(res.insights);
    } catch (err) {
      console.error('Failed to load AI insights', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getCardTheme = (type: AiRecommendation['type']) => {
    switch (type) {
      case 'danger':
        return {
          border: 'border-red-200 bg-red-50/40',
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertOctagon className="w-5 h-5 text-red-600" />,
        };
      case 'warning':
        return {
          border: 'border-amber-200 bg-amber-50/40',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        };
      case 'opportunity':
        return {
          border: 'border-emerald-200 bg-emerald-50/40',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <Lightbulb className="w-5 h-5 text-emerald-600" />,
        };
      default:
        return {
          border: 'border-sky-200 bg-sky-50/40',
          badge: 'bg-sky-100 text-sky-800 border-sky-200',
          icon: <Info className="w-5 h-5 text-sky-600" />,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Financial Advisor</h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {insights?.source === 'ai_llm' ? 'Gemini AI Powered' : 'Deterministic Rules Engine'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated auditing of margin leakage, return spikes, courier freight, and CAC efficiency
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchInsights}
          loading={loading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Re-Analyze Store Data
        </Button>
      </div>

      {/* Info notice about deterministic fallback if active */}
      {insights?.isFallback && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3 text-xs text-sky-900">
          <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Operating on Deterministic Rules-Based Engine</p>
            <p className="mt-0.5 text-sky-700">
              ProfitPilot's embedded financial rules engine evaluated your unit economics directly from
              real database records. (To enable Gemini LLM responses, set{' '}
              <code className="bg-sky-100 px-1 py-0.5 rounded font-mono text-[11px]">AI_API_KEY</code>{' '}
              in your server environment).
            </p>
          </div>
        </div>
      )}

      {/* Summary Highlights */}
      {insights?.summaryHighlights && insights.summaryHighlights.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Audit Executive Summary
          </span>
          <div className="space-y-2">
            {insights.summaryHighlights.map((hl, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{hl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      ) : !insights || insights.recommendations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
          No optimization warnings found for the current period. Your unit economics are healthy!
        </div>
      ) : (
        <div className="space-y-4">
          {insights.recommendations.map((rec) => {
            const theme = getCardTheme(rec.type);
            return (
              <div
                key={rec.id}
                className={`bg-white border rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all ${theme.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{theme.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${theme.badge}`}
                        >
                          {rec.type}
                        </span>
                        {rec.metricImpact && (
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {rec.metricImpact}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{rec.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-start gap-2 bg-white/60 p-3 rounded-xl">
                  <ArrowRight className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">Recommended Action: </span>
                    <span className="text-xs text-slate-700">{rec.recommendedAction}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory Disclaimer */}
      {insights?.disclaimer && (
        <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-2xl text-[11px] text-slate-500 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
          <span>{insights.disclaimer}</span>
        </div>
      )}
    </div>
  );
};
