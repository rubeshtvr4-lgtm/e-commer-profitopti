import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<any>('/auth/forgot-password', { email });
      setMessage(res.message || 'Password reset link generated.');
      if (res.demoResetToken) {
        setResetToken(res.demoResetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
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
          Reset Password
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#737983] font-medium">
          Enter your registered merchant email to receive recovery instructions
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

          {message && (
            <div className="mb-5 p-4 rounded-xl bg-[#EAF5F0] border border-[#D2ECE1] text-[#16835D] text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#16835D]" />
                <span>{message}</span>
              </div>
              {resetToken && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-[#D2ECE1] text-xs">
                  <p className="font-semibold text-[#17191C] mb-1">Demo Recovery Token:</p>
                  <code className="bg-[#F7F8FA] p-1.5 rounded font-mono text-[11px] break-all select-all block text-[#17191C] border border-[#E7E9ED]">
                    {resetToken}
                  </code>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="mt-2.5 inline-block font-bold text-[#176B57] hover:underline"
                  >
                    Click here to set new password &rarr;
                  </Link>
                </div>
              )}
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

            <Button type="submit" loading={loading} className="w-full mt-2" size="md">
              Send Reset Instructions
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[#737983] border-t border-[#E7E9ED] pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-[#176B57] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
