import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import ClientDashboardContent from './ClientDashboardContent';

export const revalidate = 0; // Ensure fresh data on reload

export default async function ClientDashboardPage() {
  const session = await getSession();

  if (!session || session.role !== 'client') {
    return <div>No autorizado</div>;
  }

  // Obtener fecha actual para la rutina de estas dos semanas
  const today = new Date().toISOString().split('T')[0];

  // Obtener la rutina activa
  // Para hacerlo simple y flexible (si start_date <= today <= end_date)
  // Usamos eq para cliente y luego filtramos en JS o con query avanzada.
  // Aquí usaremos una query de Supabase:
  const { data: workouts } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        *,
        exercise_library (*)
      )
    `)
    .eq('client_id', session.id)
    .order('created_at', { ascending: false });

  const clientWorkouts = workouts || [];

  // Fetch session feedback separately so it doesn't fail the whole page if the table is missing
  if (clientWorkouts.length > 0) {
    const workoutIds = clientWorkouts.map(w => w.id);
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('session_feedback')
      .select('*')
      .in('workout_id', workoutIds);
    
    if (!feedbackError && feedbackData) {
      clientWorkouts.forEach(workout => {
        workout.session_feedback = feedbackData.filter(f => f.workout_id === workout.id);
      });
    } else {
      clientWorkouts.forEach(workout => {
        workout.session_feedback = [];
      });
    }
  }

  // Obtener todas las sesiones para el calendario
  const { data: exercises } = await supabase
    .from('workout_exercises')
    .select(`
      id,
      day_assigned,
      workouts!inner (
        id,
        client_id,
        title
      )
    `)
    .eq('workouts.client_id', session.id)
    .not('day_assigned', 'is', null);

  // Fetch session feedback for client to show RPE on calendar
  const { data: clientFeedback } = await supabase
    .from('session_feedback')
    .select('workout_id, day_assigned, rpe')
    .eq('client_id', session.id);

  const clientFeedbackMap: Record<string, number> = {};
  if (clientFeedback) {
    clientFeedback.forEach((fb: any) => {
      clientFeedbackMap[`${fb.workout_id}-${fb.day_assigned}`] = fb.rpe;
    });
  }

  const calendarEvents = (exercises || []).map((ex: any) => ({
    id: ex.id,
    date: ex.day_assigned,
    title: 'Entrenamiento',
    subtitle: ex.workouts.title,
    colorClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    rpe: clientFeedbackMap[`${ex.workouts.id}-${ex.day_assigned}`]
  }));

  // Deduplicate client calendar events
  const uniqueClientEventsMap = new Map<string, any>();
  for (const event of calendarEvents) {
    const key = `${event.date}-${event.title}-${event.subtitle}`;
    if (!uniqueClientEventsMap.has(key)) {
      uniqueClientEventsMap.set(key, event);
    }
  }
  const uniqueCalendarEvents = Array.from(uniqueClientEventsMap.values());

  // Obtener historial de peso
  const { data: weightHistory } = await supabase
    .from('weight_history')
    .select('*')
    .eq('client_id', session.id)
    .order('recorded_at', { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Mi Entrenamiento</h1>
        <p className="text-zinc-400 mt-2">Hola {session.full_name || session.name || 'Cliente'}, aquí tienes tu plan.</p>
      </div>

      <ClientDashboardContent 
        workouts={clientWorkouts} 
        weightHistory={weightHistory || []} 
        calendarEvents={uniqueCalendarEvents}
      />
    </div>
  );
}

