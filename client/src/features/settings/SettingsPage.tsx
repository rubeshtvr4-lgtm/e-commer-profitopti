import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Lock, Building, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../contexts/ToastContext';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBusinessName(user.businessName);
      setCurrency(user.currency || 'INR');
      setTimezone(user.timezone || 'Asia/Kolkata');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      await api.patch('/settings', { name, businessName, currency, timezone });
      await refreshUser();
      setProfileSuccess(true);
      success('Settings Saved', 'Business profile and preferences updated.');
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.message || 'Failed to update settings';
      setProfileError(msg);
      toastError('Save Error', msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordLoading(true);

    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      success('Password Updated', 'Your security credentials have been refreshed.');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.message || 'Failed to update password';
      setPasswordError(msg);
      toastError('Update Error', msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Store Settings & Profile"
        description="Configure merchant profile, base reporting currency, timezones, and security credentials"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-[#EAF5F0] text-[#176B57] border border-[#D2ECE1]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17191C] tracking-tight">Store Profile</h3>
              <p className="text-xs text-[#737983]">Merchant identification details</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-[#EAF5F0] border border-[#D2ECE1] text-[#16835D] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16835D]" />
              <span>Store profile saved successfully!</span>
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 rounded-xl bg-[#FDF2F2] border border-[#FCE4E4] text-[#C84B4B] text-xs font-medium">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Merchant Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] font-semibold focus:outline-none focus:border-[#176B57]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Store / Legal Brand Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] font-semibold focus:outline-none focus:border-[#176B57]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                  Accounting Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] font-semibold focus:outline-none focus:border-[#176B57]"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                  Reporting Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] font-semibold focus:outline-none focus:border-[#176B57]"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC Universal</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="primary" type="submit" loading={profileLoading} className="w-full">
                Save Store Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-[#F0F5FA] text-[#0284C7] border border-[#E0EBF7]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17191C] tracking-tight">Security Credentials</h3>
                <p className="text-xs text-[#737983]">Update account password</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-[#EAF5F0] border border-[#D2ECE1] text-[#16835D] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16835D]" />
                <span>Password changed successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDF2F2] border border-[#FCE4E4] text-[#C84B4B] text-xs font-medium">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57]"
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
                  className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57]"
                />
              </div>

              <div className="pt-2">
                <Button variant="outline" type="submit" loading={passwordLoading} className="w-full">
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          {/* Multi-tenant isolation info box */}
          <div className="mt-6 pt-4 border-t border-[#E7E9ED] flex items-start gap-2.5 text-[11px] text-[#737983] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#16835D] flex-shrink-0 mt-0.5" />
            <span>
              All orders, products, and financial ledgers are cryptographically isolated with verified owner IDs. Multi-tenant privacy is strictly enforced.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
