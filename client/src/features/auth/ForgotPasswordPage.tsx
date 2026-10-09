import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 mx-auto flex items-center justify-center text-white shadow-lg">
          <Zap className="w-6 h-6 fill-current" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-white">Reset Password</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email to receive recovery instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{message}</span>
              </div>
              {resetToken && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200 text-xs">
                  <p className="font-semibold text-slate-700 mb-1">Demo Recovery Token:</p>
                  <code className="bg-slate-100 p-1 rounded font-mono text-[11px] break-all select-all block text-slate-900">
                    {resetToken}
                  </code>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="mt-2 inline-block font-bold text-emerald-700 underline"
                  >
                    Click here to set new password &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@brand.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Send Reset Instructions
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-5">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
