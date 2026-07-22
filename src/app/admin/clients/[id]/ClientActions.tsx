'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteClient } from '@/app/actions/clientActions';
import { Edit2, Trash2, Loader2, FileDown } from 'lucide-react';
import Link from 'next/link';

export default function ClientActions({ clientId, clientName }: { clientId: string, clientName?: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar a este cliente? Esta acción no se puede deshacer y borrará también sus rutinas.')) {
      setIsDeleting(true);
      const result = await deleteClient(clientId);
      if (result.success) {
        router.push('/admin/clients');
      } else {
        alert(result.error || 'Error al eliminar');
        setIsDeleting(false);
      }
    }
  };

  const handleGeneratePdf = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGeneratePdf}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors border border-emerald-500 disabled:opacity-50"
      >
        <FileDown className="w-4 h-4" />
        <span className="hidden sm:inline">Generar PDF</span>
      </button>
      <Link
        href={`/admin/clients/${clientId}/edit`}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors border border-neutral-700"
      >
        <Edit2 className="w-4 h-4" />
        <span className="hidden sm:inline">Editar</span>
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 font-medium rounded-lg transition-colors border border-red-900/50 disabled:opacity-50"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        <span className="hidden sm:inline">{isDeleting ? 'Borrando...' : 'Borrar'}</span>
      </button>
    </div>
  );
}
