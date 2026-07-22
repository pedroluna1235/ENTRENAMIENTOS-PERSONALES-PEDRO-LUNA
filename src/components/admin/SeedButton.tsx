'use client';

import { useState } from 'react';
import { seedClients } from '@/app/actions/clientActions';
import { Users, Loader2 } from 'lucide-react';

export default function SeedButton() {
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    setLoading(true);
    const result = await seedClients();
    if (!result.success) {
      alert(result.error || 'Error al cargar los clientes');
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 border border-neutral-700"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
      <span>{loading ? 'Cargando...' : 'Sembrar 10 Clientes'}</span>
    </button>
  );
}
