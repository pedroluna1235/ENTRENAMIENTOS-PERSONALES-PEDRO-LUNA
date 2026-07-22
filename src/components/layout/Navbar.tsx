'use client';

import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/actions/authActions';

export function Navbar({ userName, role, photoUrl }: { userName: string, role: string, photoUrl?: string | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="w-full h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo Entrenamientos" className="h-10 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
          {photoUrl ? (
            <img src={photoUrl} alt={userName} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <User size={16} className="text-zinc-400" />
          )}
          <span className="text-sm font-medium text-zinc-300">{userName}</span>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full ml-1 uppercase">{role}</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2"
          title="Cerrar Sesión"
        >
          <LogOut size={18} />
          <span className="text-sm hidden sm:block">Salir</span>
        </button>
      </div>
    </nav>
  );
}
