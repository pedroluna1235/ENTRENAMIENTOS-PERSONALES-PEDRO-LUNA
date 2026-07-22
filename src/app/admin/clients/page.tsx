import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Target, Activity, Calendar, Plus } from 'lucide-react';
import Image from 'next/image';

export const revalidate = 0; // Disable cache for admin panel

export default async function AdminClientsPage() {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const { data: clients, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mis Clientes</h1>
          <p className="text-neutral-400 mt-1">Gestiona los perfiles y progreso de tus clientes.</p>
        </div>
        <Link 
          href="/admin/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          Añadir Cliente
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tienes clientes todavía</h3>
          <p className="text-neutral-400 max-w-md mx-auto mb-6">
            Comienza a gestionar tu negocio añadiendo tu primer cliente al sistema.
          </p>
          <Link 
            href="/admin/clients/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 font-medium rounded-xl transition-colors"
          >
            <Plus size={18} />
            Añadir mi primer cliente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Link key={client.id} href={`/admin/clients/${client.id}`}>
              <div className="group bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-800 group-hover:border-emerald-500/50 transition-colors">
                      <Image 
                        src={client.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.full_name)}&background=10b981&color=fff`} 
                        alt={client.full_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {client.full_name}
                      </h3>
                      <div className="flex items-center text-sm text-neutral-400 gap-3 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {client.age || '--'} años</span>
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {client.weight || '--'} kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 flex justify-between items-center group-hover:bg-neutral-800/50 transition-colors">
                    <div>
                      <span className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Objetivo</span>
                      <span className="text-sm text-neutral-300 font-medium">{client.objective || 'No definido'}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
