import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MonitorPlay, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/15 text-sky-400 border border-blue-500/20">
            <MonitorPlay className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome to RemoteX</h2>
          <p className="text-xs text-slate-400">
            Sign in to manage your computers and trusted sessions
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                className="w-full bg-dark-input border border-dark-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-slate-100 rounded-xl px-3.5 py-2.5 pl-10 text-sm outline-none transition-all placeholder:text-slate-500"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full bg-dark-input border border-dark-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-slate-100 rounded-xl px-3.5 py-2.5 pl-10 text-sm outline-none transition-all placeholder:text-slate-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-2 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
