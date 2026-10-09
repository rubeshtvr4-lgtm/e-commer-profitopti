import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Lock, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

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
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update settings');
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
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Store Settings & Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business profile, reporting currency, timezones, and security credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Store Profile</h3>
              <p className="text-xs text-slate-500">Business identification details</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Merchant Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Store / Legal Business Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Currency Standard
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Security Credentials</h3>
                <p className="text-xs text-slate-500">Update account password</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Password changed successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
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
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              All orders, products, and financials are isolated with cryptographically verified owner
              IDs. No cross-tenant access is permitted.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
