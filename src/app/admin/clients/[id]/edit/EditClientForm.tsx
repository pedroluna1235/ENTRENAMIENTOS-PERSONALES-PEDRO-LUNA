'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, UserPlus, Upload, ImageIcon } from 'lucide-react';
import { updateClient } from '@/app/actions/clientActions';
import { supabase } from '@/lib/supabaseClient';

export default function EditClientForm({ initialData, clientId }: { initialData: any, clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData.photo_url || null);
  
  const [formData, setFormData] = useState({
    fullName: initialData.full_name || '',
    birthDate: initialData.birth_date || '',
    age: initialData.age?.toString() || '',
    weight: initialData.weight?.toString() || '',
    objective: initialData.objective || '',
    clientPassword: initialData.client_password || '',
    trainingDays: initialData.training_days_per_week?.toString() || '3',
  });

  // Calcular la edad a partir de la fecha de nacimiento
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setFormData(prev => ({ ...prev, birthDate: dateStr }));
    
    if (dateStr) {
      const birth = new Date(dateStr);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setFormData(prev => ({ ...prev, age: calculatedAge.toString() }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let photoUrl = '';

    // Subir la foto si se seleccionó una
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error subiendo foto:', uploadError);
        setError('Ocurrió un error al subir la foto de perfil.');
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from('client-photos')
        .getPublicUrl(filePath);
        
      photoUrl = data.publicUrl;
    }

    const payload = {
      fullName: formData.fullName,
      birthDate: formData.birthDate,
      age: parseInt(formData.age) || 0,
      weight: parseFloat(formData.weight) || 0,
      objective: formData.objective,
      clientPassword: formData.clientPassword,
      trainingDays: parseInt(formData.trainingDays) || 3,
      ...(photoUrl && { photoUrl }),
    };

    const result = await updateClient(clientId, payload);

    if (result.success) {
      router.push(`/admin/clients/${clientId}`);
    } else {
      setError(result.error || 'Ocurrió un error al actualizar el cliente');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto pb-24">
      <Link href={`/admin/clients/${clientId}`} className="text-blue-500 hover:text-blue-400 flex items-center gap-2 text-sm font-medium w-fit">
        <ArrowLeft size={16} /> Volver a la Ficha
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Editar Perfil de Cliente
          </h1>
          <p className="text-neutral-400 mt-1">Modifica los datos personales y de acceso del cliente.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl">
        
        {/* Foto de Perfil */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">Foto de Perfil (Opcional)</h2>
          
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full border-2 border-neutral-800 overflow-hidden bg-neutral-950 flex items-center justify-center shrink-0">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="text-neutral-600 w-8 h-8" />
              )}
            </div>
            <div className="flex-1 max-w-sm">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg cursor-pointer transition-colors border border-neutral-700 w-fit">
                <Upload size={18} />
                Cambiar Fotografía
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Información Personal */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">Información Personal</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Nombre Completo</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Fecha de Nacimiento</label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={handleBirthDateChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Edad (calculada)</label>
              <input
                type="number"
                disabled
                value={formData.age}
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.weight}
                onChange={e => setFormData({...formData, weight: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Entrenamiento y Acceso */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">Entrenamiento y Acceso</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Días de Entrenamiento (por semana)</label>
              <input
                type="number"
                min="1"
                max="7"
                required
                value={formData.trainingDays}
                onChange={e => setFormData({...formData, trainingDays: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Objetivo Principal</label>
              <input
                type="text"
                value={formData.objective}
                onChange={e => setFormData({...formData, objective: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Código de Acceso (Contraseña)</label>
              <input
                type="text"
                required
                value={formData.clientPassword}
                onChange={e => setFormData({...formData, clientPassword: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Cambios
          </button>
        </div>

      </form>
    </div>
  );
}
