import React, { useState } from 'react';
import { User, Mail, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const payload = { name };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);
      setMessage('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-sm">
        Please sign in to view your user profile.
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">User Profile</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your account credentials, display name and security keys.
        </p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
        {message && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full bg-dark-input border border-dark-border focus:border-blue-500 text-slate-100 rounded-xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Registered Email (Immutable)
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                className="w-full bg-dark-input border border-dark-border text-slate-400 rounded-xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm outline-none opacity-60 cursor-not-allowed"
                value={user.email}
              />
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border space-y-4">
            <h4 className="text-sm font-semibold text-white">Change Account Password</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-blue-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-blue-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Update Profile</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
