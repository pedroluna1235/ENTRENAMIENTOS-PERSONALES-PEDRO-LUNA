'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ShieldCheck, Dumbbell, ArrowRight, Loader2 } from 'lucide-react';
import { loginAdmin, loginClient } from '@/lib/actions/authActions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [role, setRole] = useState<'client' | 'admin'>('client');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'admin') {
        const res = await loginAdmin(password);
        if (res.success) {
          router.push('/admin');
          router.refresh();
        } else {
          setError(res.error || 'Error al iniciar sesión');
        }
      } else {
        const res = await loginClient(password);
        if (res.success) {
          router.push('/dashboard/client');
          router.refresh();
        } else {
          setError(res.error || 'Error al iniciar sesión');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo Entrenamientos Pedro Luna" className="w-48 h-auto mb-2" />
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-xl mb-8 border border-zinc-800/50">
          <button
            onClick={() => { setRole('client'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              role === 'client' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User size={16} />
            Soy Cliente
          </button>
          <button
            onClick={() => { setRole('admin'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              role === 'admin' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ShieldCheck size={16} />
            Administrador
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={role}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                {role === 'admin' ? 'Código Maestro de Administrador' : 'Código de Acceso Personal'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl bg-zinc-950/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder={role === 'admin' ? '••••••••' : 'Ingresa tu código'}
                  required
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-400 text-sm font-medium mt-2 text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Acceder al Portal
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
