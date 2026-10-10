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
  Bot,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { AiInsightsResult, AiRecommendation } from '../../types';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../contexts/ToastContext';

export const AiInsightsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [insights, setInsights] = useState<AiInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await api.post<{ insights: AiInsightsResult }>('/ai/insights', {});
      setInsights(res.insights);
      success('Audit Complete', 'Store profitability recommendations refreshed.');
    } catch (err: any) {
      console.error('Failed to load AI insights', err);
      toastError('Audit Failed', err?.message || 'Could not fetch AI insights');
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
          border: 'border-[#FCE4E4] bg-white',
          badge: 'bg-[#FDF2F2] text-[#C84B4B] border-[#FCE4E4]',
          icon: <AlertOctagon className="w-5 h-5 text-[#C84B4B]" />,
        };
      case 'warning':
        return {
          border: 'border-[#FDEECC] bg-white',
          badge: 'bg-[#FEF7EC] text-[#D97706] border-[#FDEECC]',
          icon: <AlertTriangle className="w-5 h-5 text-[#D97706]" />,
        };
      case 'opportunity':
        return {
          border: 'border-[#D2ECE1] bg-white',
          badge: 'bg-[#EAF5F0] text-[#16835D] border-[#D2ECE1]',
          icon: <Lightbulb className="w-5 h-5 text-[#16835D]" />,
        };
      default:
        return {
          border: 'border-[#E0EBF7] bg-white',
          badge: 'bg-[#F0F5FA] text-[#0284C7] border-[#E0EBF7]',
          icon: <Info className="w-5 h-5 text-[#0284C7]" />,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title="AI Financial Advisory"
        description="Automated auditing of margin leakage, return spikes, courier freight, and CAC efficiency"
        badge={
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAF5F0] text-[#176B57] border border-[#D2ECE1] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {insights?.source === 'ai_llm' ? 'Gemini AI Intelligence' : 'Deterministic Audit Engine'}
          </span>
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInsights}
          loading={loading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Re-Analyze Store Data
        </Button>
      </PageHeader>

      {/* Info notice about deterministic engine vs LLM */}
      {insights?.isFallback && (
        <div className="p-4 bg-[#F0F5FA] border border-[#E0EBF7] rounded-2xl flex items-start gap-3 text-xs text-[#0F4C81]">
          <Info className="w-5 h-5 text-[#0284C7] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-bold text-[#17191C]">
              Operating on Deterministic Mathematical Rules Engine
            </p>
            <p className="mt-0.5 text-[#555C68]">
              ProfitPilot's embedded financial audit engine computed your unit economics directly from verified database records. To enable real-time Gemini LLM generative advisory, configure <code className="bg-white px-1.5 py-0.5 rounded border border-[#E0EBF7] font-mono text-[11px] text-[#0284C7]">AI_API_KEY</code> in your backend environment.
            </p>
          </div>
        </div>
      )}

      {/* Audit Executive Summary Highlights */}
      {insights?.summaryHighlights && insights.summaryHighlights.length > 0 && (
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737983] block mb-3">
            Audit Executive Summary
          </span>
          <div className="space-y-2">
            {insights.summaryHighlights.map((hl, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs font-medium text-[#17191C]">
                <CheckCircle2 className="w-4 h-4 text-[#16835D] flex-shrink-0 mt-0.5" />
                <span>{hl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-36 bg-white border border-[#E7E9ED] rounded-2xl" />
          <div className="h-36 bg-white border border-[#E7E9ED] rounded-2xl" />
          <div className="h-36 bg-white border border-[#E7E9ED] rounded-2xl" />
        </div>
      ) : !insights || insights.recommendations.length === 0 ? (
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-10 text-center text-xs text-[#737983]">
          No margin risks or return anomalies identified for the audited period. Your unit economics are healthy!
        </div>
      ) : (
        <div className="space-y-4">
          {insights.recommendations.map((rec) => {
            const theme = getCardTheme(rec.type);
            return (
              <div
                key={rec.id}
                className={`rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border transition-all ${theme.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-[#F7F8FA] border border-[#E7E9ED] mt-0.5">
                      {theme.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${theme.badge}`}
                        >
                          {rec.type}
                        </span>
                        {rec.metricImpact && (
                          <span className="text-xs font-bold text-[#17191C] bg-[#F1F3F6] px-2 py-0.5 rounded-md border border-[#E7E9ED] tabular-nums">
                            {rec.metricImpact}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#17191C]">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-[#555C68] mt-1.5 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="mt-4 pt-3.5 border-t border-[#E7E9ED] flex items-start gap-2.5 bg-[#F7F8FA] p-3 rounded-xl">
                  <ArrowRight className="w-4 h-4 text-[#176B57] flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-[#17191C]">Recommended Action: </span>
                    <span className="text-[#555C68]">{rec.recommendedAction}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory Disclaimer */}
      {insights?.disclaimer && (
        <div className="p-4 bg-[#F7F8FA] border border-[#E7E9ED] rounded-2xl text-[11px] text-[#737983] flex items-start gap-2.5 leading-relaxed">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#9DA3AE]" />
          <span>{insights.disclaimer}</span>
        </div>
      )}
    </div>
  );
};
