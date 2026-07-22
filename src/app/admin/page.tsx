import { getSession } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const session = await getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Panel de Control</h1>
        <p className="text-zinc-400 mt-2">Bienvenido de nuevo, {session?.name}. Aquí tienes un resumen de tus clientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards for future content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-zinc-400 font-medium text-sm">Total Clientes</h3>
          <p className="text-4xl font-bold text-white mt-2">--</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-zinc-400 font-medium text-sm">Rutinas Activas</h3>
          <p className="text-4xl font-bold text-white mt-2">--</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-zinc-400 font-medium text-sm">Mensajes Nuevos</h3>
          <p className="text-4xl font-bold text-white mt-2">--</p>
        </div>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
        <p className="text-zinc-500 text-center">El contenido completo del administrador se implementará aquí.</p>
      </div>
    </div>
  );
}
