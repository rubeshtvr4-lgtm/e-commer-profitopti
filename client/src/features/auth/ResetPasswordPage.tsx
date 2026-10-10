import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Token may be expired.');
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
          Create New Password
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#737983] font-medium">
          Enter your verification recovery token and secure new password
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

          {success && (
            <div className="mb-5 p-4 rounded-xl bg-[#EAF5F0] border border-[#D2ECE1] text-[#16835D] text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#16835D]" />
              <span>Password reset successfully! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Recovery Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="64-character verification token"
                className="w-full px-3.5 py-2.5 border border-[#E7E9ED] rounded-lg text-xs font-mono text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={success}
              className="w-full mt-2"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Update Password & Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[#737983] border-t border-[#E7E9ED] pt-4">
            <Link to="/login" className="font-bold text-[#176B57] hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
