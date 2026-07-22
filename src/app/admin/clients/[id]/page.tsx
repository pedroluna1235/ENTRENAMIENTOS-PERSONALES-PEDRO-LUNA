import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Calendar, Activity, Info, ActivitySquare, ChevronRight, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ClientActions from './ClientActions';

export const revalidate = 0;

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (clientError || !client) {
    redirect('/admin/clients');
  }

  // Fetch weight history
  const { data: weightHistory } = await supabase
    .from('weight_history')
    .select('*')
    .eq('client_id', id)
    .order('recorded_at', { ascending: true });

  // Fetch workouts
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*, workout_exercises(*, exercise_library(*))')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/clients"
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors print:hidden"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-4">
              {client.full_name}
            </h1>
            <p className="text-neutral-400 mt-1">Ficha de cliente y progreso</p>
          </div>
        </div>
        
        <div className="print:hidden">
          <ClientActions clientId={client.id} clientName={client.full_name} />
        </div>
      </div>

      <div id="client-details-container" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client Data & Weight */}
        <div className="space-y-8">
          {/* Client Info Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-neutral-800">
                <Image 
                  src={client.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.full_name)}&background=10b981&color=fff`} 
                  alt={client.full_name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{client.full_name}</div>
                <div className="inline-flex items-center px-3 py-1 mt-2 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                  {client.objective || 'Objetivo no definido'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Edad</span>
                </div>
                <div className="text-lg font-semibold text-white">{client.age || '--'} años</div>
              </div>
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Peso Actual</span>
                </div>
                <div className="text-lg font-semibold text-white">{client.weight || '--'} kg</div>
              </div>
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 col-span-2">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Dumbbell className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Días de Entrenamiento</span>
                </div>
                <div className="text-lg font-semibold text-white">{client.training_days_per_week || 3} días a la semana</div>
              </div>
            </div>
            
            <div className="mt-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <Info className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Contraseña Acceso</span>
              </div>
              <div className="text-md font-mono text-neutral-300">{client.client_password || 'No definida'}</div>
            </div>
          </div>

          {/* Weight History Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ActivitySquare className="w-5 h-5 text-emerald-500" />
              Historial de Peso
            </h3>
            
            {weightHistory && weightHistory.length > 0 ? (
              <div className="space-y-3">
                {weightHistory.map((entry: any, i: number) => (
                  <div key={entry.id} className="flex justify-between items-center p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-sm">
                      {format(new Date(entry.recorded_at), "d MMM yyyy", { locale: es })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{entry.weight} kg</span>
                      {/* Simple trend indicator logic can go here */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">No hay registros de peso.</p>
            )}
          </div>
        </div>

        {/* Right Column: Training Plans */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-emerald-500" />
              Planes de Entrenamiento (Quincenales)
            </h2>
            <Link 
              href={`/admin/clients/${id}/create-routine`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors print:hidden"
            >
              <Plus className="w-4 h-4" />
              Crear Rutina
            </Link>
          </div>

          {workouts && workouts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {workouts.map((workout: any) => (
                <div key={workout.id} className="group bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-emerald-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {workout.title}
                      </h3>
                      <div className="text-sm text-neutral-400 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {workout.start_date ? format(new Date(workout.start_date), "d MMM yyyy", { locale: es }) : 'N/A'} 
                        {' - '} 
                        {workout.end_date ? format(new Date(workout.end_date), "d MMM yyyy", { locale: es }) : 'N/A'}
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-neutral-800 rounded-full text-xs font-semibold text-neutral-300">
                      {workout.workout_exercises?.length || 0} ejercicios
                    </div>
                  </div>
                  
                  {workout.notes && (
                    <p className="text-sm text-neutral-400 mb-4 bg-neutral-950 p-3 rounded-lg border border-neutral-800/50">
                      "{workout.notes}"
                    </p>
                  )}
                  
                  <div className="flex justify-end gap-4 print:hidden">
                    <Link href={`/admin/clients/${id}/routines/${workout.id}/edit`} className="flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                      Editar
                    </Link>
                    <Link href={`/admin/clients/${id}/routines/${workout.id}`} className="flex items-center gap-1 text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors">
                      Ver detalle completo <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Print-only Exercises Section */}
                  {workout.workout_exercises && workout.workout_exercises.length > 0 && (
                    <div className="hidden print:block mt-8">
                      <h4 className="text-lg font-bold text-black border-b border-gray-300 pb-2 mb-4">
                        Ejercicios
                      </h4>
                      <div className="space-y-6">
                        {workout.workout_exercises.map((ex: any, index: number) => {
                          const imageUrl = ex.exercise_photo_url || null; // Might be in exercise_library too depending on where it's stored.
                          
                          return (
                            <div key={ex.id} className="flex gap-6 border border-gray-200 p-4 rounded-lg break-inside-avoid">
                              {imageUrl && (
                                <div className="w-32 h-32 relative shrink-0 rounded-lg overflow-hidden border border-gray-200">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={imageUrl} alt={ex.exercise_library?.name || 'Ejercicio'} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-bold text-lg text-black">
                                      {index + 1}. {ex.exercise_library?.name || 'Ejercicio Eliminado'}
                                    </h5>
                                    <p className="text-sm text-gray-500">{ex.exercise_library?.target_muscle || ''}</p>
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500 uppercase font-semibold">Series</div>
                                      <div className="font-bold text-black">{ex.sets}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500 uppercase font-semibold">Reps</div>
                                      <div className="font-bold text-black">{ex.reps}</div>
                                    </div>
                                  </div>
                                </div>
                                {ex.weight_guidelines && (
                                  <div className="mt-2 text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">Pautas de Peso: </span> {ex.weight_guidelines}
                                  </div>
                                )}
                                {ex.trainer_notes && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">Observaciones: </span> {ex.trainer_notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-neutral-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Sin rutinas asignadas</h3>
              <p className="text-neutral-400 max-w-md mx-auto mb-6">
                Este cliente no tiene ningún plan de entrenamiento todavía.
              </p>
              <Link 
                href={`/admin/clients/${id}/create-routine`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Asignar Primera Rutina
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
