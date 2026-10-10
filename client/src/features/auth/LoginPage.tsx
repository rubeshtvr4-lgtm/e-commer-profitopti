import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('seller@profitpilot.com');
    setPassword('DemoPass123!');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#17191C]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/welcome" className="inline-flex items-center gap-2 group mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] border border-[#D2ECE1] flex items-center justify-center text-[#176B57] transition-transform group-hover:scale-105">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191C] tracking-tight">
          Sign In to ProfitPilot
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#737983] font-medium">
          Access your e-commerce profit & loss intelligence command center
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] rounded-2xl sm:px-8 border border-[#E7E9ED]">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#FDF2F2] border border-[#FCE4E4] text-[#C84B4B] text-xs flex items-start gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Merchant Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@yourbrand.com"
                className="w-full px-3.5 py-2.5 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] font-semibold focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-[#176B57] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Store
            </Button>
          </form>

          {/* Quick Demo Credential Fill */}
          <div className="mt-5 pt-4 border-t border-[#E7E9ED] text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#176B57] hover:text-[#125645] bg-[#EAF5F0] px-3 py-1.5 rounded-lg border border-[#D2ECE1] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill Demo Evaluation Credentials
            </button>
          </div>

          <div className="mt-5 text-center text-xs text-[#737983] border-t border-[#E7E9ED] pt-4">
            Don't have a store account?{' '}
            <Link to="/register" className="font-bold text-[#176B57] hover:underline">
              Create seller account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/welcome" className="text-xs text-[#737983] hover:text-[#17191C] font-medium transition-colors">
            ← Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
};
