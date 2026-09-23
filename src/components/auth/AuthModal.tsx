import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'admin-login';
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin-login'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (mode === 'admin-login') {
        // Admin credentials verification
        if (
          (email.trim().toLowerCase() === 'techsoftware.digital@gmail.com' ||
            email.trim().toLowerCase() === 'admin@techsoftware.digital' ||
            email.trim().toLowerCase() === 'admin') &&
          (password.trim() === 'admin123' || password.trim() === 'admin' || password.length >= 4)
        ) {
          const adminAccount: UserAccount = {
            uid: 'admin-ts-digital',
            email: 'techsoftware.digital@gmail.com',
            displayName: 'TechSoftware Admin',
            role: 'admin',
            phone: '+91 8169401877',
            companyName: 'TechSoftware.digital',
            createdAt: new Date().toISOString()
          };
          onLoginSuccess(adminAccount);
          onClose();
        } else {
          setError('Invalid Admin credentials. Use techsoftware.digital@gmail.com / admin123 or click "Demo Admin"');
        }
        return;
      }

      if (mode === 'login') {
        if (!email || !password) {
          setError('Please provide your email and password');
          return;
        }
        const customerAccount: UserAccount = {
          uid: `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          displayName: email.split('@')[0] || 'Valued Customer',
          role: 'customer',
          phone: phone || '+91 9876543210',
          companyName: companyName || 'Client Org',
          createdAt: new Date().toISOString()
        };
        onLoginSuccess(customerAccount);
        onClose();
        return;
      }

      if (mode === 'register') {
        if (!name || !email || !password) {
          setError('Name, email, and password are required');
          return;
        }
        const newCustomer: UserAccount = {
          uid: `user-${Date.now()}`,
          email,
          displayName: name,
          role: 'customer',
          phone,
          companyName,
          createdAt: new Date().toISOString()
        };
        onLoginSuccess(newCustomer);
        onClose();
      }
    }, 400);
  };

  const handleQuickCustomerDemo = () => {
    const demoCustomer: UserAccount = {
      uid: 'customer-demo-hotel',
      email: 'client@abchotel.com',
      displayName: 'ABC Hotel & Resorts',
      role: 'customer',
      phone: '+91 9820011223',
      companyName: 'ABC Luxury Hotel',
      createdAt: new Date().toISOString()
    };
    onLoginSuccess(demoCustomer);
    onClose();
  };

  const handleQuickAdminDemo = () => {
    const adminAccount: UserAccount = {
      uid: 'admin-ts-digital',
      email: 'techsoftware.digital@gmail.com',
      displayName: 'TechSoftware Admin Lead',
      role: 'admin',
      phone: '+91 8169401877',
      companyName: 'TechSoftware.digital',
      createdAt: new Date().toISOString()
    };
    onLoginSuccess(adminAccount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Decorative corner glow */}
        <div
          className={`absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 ${
            mode === 'admin-login' ? 'bg-indigo-500' : 'bg-cyan-500'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl border mb-2 ${
              mode === 'admin-login'
                ? 'bg-indigo-950/70 border-indigo-700/60 text-indigo-400'
                : 'bg-cyan-950/70 border-cyan-700/60 text-cyan-400'
            }`}
          >
            {mode === 'admin-login' ? <Shield className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {mode === 'admin-login'
              ? 'Developer & Admin Login'
              : mode === 'register'
              ? 'Create Customer Account'
              : 'Customer Portal Login'}
          </h2>

          <p className="text-xs text-slate-400">
            {mode === 'admin-login'
              ? 'Authorized developer & administration access only.'
              : mode === 'register'
              ? 'Register to request quotes, track projects, and communicate in real-time.'
              : 'Access your quotations, project progress, and direct messages.'}
          </p>
        </div>

        {/* Tab switch for customer login vs register */}
        {mode !== 'admin-login' && (
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Company / Organization
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. ABC Hotel & Resorts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9800000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  mode === 'admin-login'
                    ? 'techsoftware.digital@gmail.com'
                    : 'customer@example.com'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              mode === 'admin-login'
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:brightness-110 text-white shadow-indigo-500/25'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white shadow-cyan-500/25'
            }`}
          >
            <span>
              {loading
                ? 'Authenticating...'
                : mode === 'admin-login'
                ? 'Sign In to Developer Console'
                : mode === 'register'
                ? 'Complete Registration'
                : 'Sign In'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Buttons for Immediate Verification */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-semibold">
            Instant Test Credentials
          </p>
          <div className="flex gap-2">
            {mode === 'admin-login' ? (
              <button
                type="button"
                onClick={handleQuickAdminDemo}
                className="w-full py-2 px-3 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>1-Click Admin Access</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleQuickCustomerDemo}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Demo Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin-login');
                    setError(null);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-400 text-xs font-medium flex items-center gap-1 transition-all"
                  title="Switch to Admin Login"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
