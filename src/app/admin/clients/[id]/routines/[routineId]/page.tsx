import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Dumbbell, Clock, Target, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const revalidate = 0;

export default async function RoutineDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string, routineId: string }> 
}) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const { id, routineId } = await params;

  // Fetch client data to show name
  const { data: client } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', id)
    .single();

  if (!client) {
    redirect('/admin/clients');
  }

  // Fetch workout and its exercises
  const { data: workout, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        *,
        exercise_library (*)
      )
    `)
    .eq('id', routineId)
    .single();

  if (error || !workout) {
    redirect(`/admin/clients/${id}`);
  }

  // Agrupar los ejercicios por día si tienen 'day_assigned'
  const groupedExercises: { [key: string]: any[] } = {};
  
  workout.workout_exercises?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).forEach((ex: any) => {
    const day = ex.day_assigned || 'Sin día específico';
    if (!groupedExercises[day]) {
      groupedExercises[day] = [];
    }
    groupedExercises[day].push(ex);
  });

  const { data: feedbackData, error: feedbackError } = await supabase
    .from('session_feedback')
    .select('*')
    .eq('workout_id', workout.id);

  const sessionFeedbackMap: Record<string, number> = {};
  if (!feedbackError && feedbackData) {
    feedbackData.forEach((sf: any) => {
      sessionFeedbackMap[sf.day_assigned] = sf.rpe;
    });
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href={`/admin/clients/${id}`}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-4">
              {workout.title}
            </h1>
            <p className="text-emerald-500 mt-1 font-medium">Rutina asignada a {client.full_name}</p>
          </div>
        </div>
        <Link 
          href={`/admin/clients/${id}/routines/${routineId}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors border border-neutral-700"
        >
          Editar Rutina
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-500" />
              Detalles Generales
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-neutral-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-neutral-400 uppercase">Período</div>
                  <div className="text-white mt-1">
                    {workout.start_date ? format(new Date(workout.start_date), "d MMM yyyy", { locale: es }) : 'N/A'} 
                    {' - '} 
                    {workout.end_date ? format(new Date(workout.end_date), "d MMM yyyy", { locale: es }) : 'Sin fecha de fin'}
                  </div>
                </div>
              </div>

              {workout.notes && (
                <div className="flex items-start gap-3 pt-4 border-t border-neutral-800">
                  <Target className="w-5 h-5 text-neutral-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-neutral-400 uppercase">Notas Generales</div>
                    <div className="text-neutral-300 mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {workout.notes}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div className="lg:col-span-2 space-y-8">
          {Object.entries(groupedExercises).map(([day, exercises]) => (
            <div key={day} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex flex-wrap items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-white">{day}</h2>
                <div className="ml-auto flex items-center gap-3">
                  {sessionFeedbackMap[day] && (
                    <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-1 shadow-sm">
                      <Target className="w-3 h-3" />
                      RPE: {sessionFeedbackMap[day]}/10
                    </div>
                  )}
                  <div className="px-3 py-1 bg-neutral-800 rounded-full text-xs font-semibold text-neutral-300">
                    {exercises.length} ejercicios
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-neutral-800">
                {exercises.map((ex, index) => (
                  <div key={ex.id} className="p-6 hover:bg-neutral-800/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {ex.exercise_library?.name || 'Ejercicio Eliminado'}
                          </h3>
                          <p className="text-sm text-neutral-400 mt-1">
                            {ex.exercise_library?.target_muscle || 'Sin grupo muscular definido'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-lg text-center">
                          <div className="text-xs text-neutral-500 uppercase font-semibold">Series</div>
                          <div className="text-lg font-bold text-white">{ex.sets}</div>
                        </div>
                        <div className="bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-lg text-center">
                          <div className="text-xs text-neutral-500 uppercase font-semibold">Reps</div>
                          <div className="text-lg font-bold text-white">{ex.reps}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                      {ex.weight_guidelines && (
                        <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
                          <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Pautas de Peso</div>
                          <div className="text-sm text-neutral-300">{ex.weight_guidelines}</div>
                        </div>
                      )}
                      
                      {ex.trainer_notes && (
                        <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
                          <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Observaciones Entrenador</div>
                          <div className="text-sm text-neutral-300">{ex.trainer_notes}</div>
                        </div>
                      )}

                      {ex.client_feedback && (
                        <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-900/50 md:col-span-2 mt-2">
                          <div className="text-xs text-blue-400 uppercase font-semibold mb-1 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            Sensaciones del Cliente
                          </div>
                          <div className="text-sm text-blue-100">{ex.client_feedback}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
