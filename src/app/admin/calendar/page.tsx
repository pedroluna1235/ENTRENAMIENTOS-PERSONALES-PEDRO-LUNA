import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CalendarWidget, { CalendarEvent } from '@/components/CalendarWidget';

export const revalidate = 0;

export default async function AdminCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // Fetch all workout exercises that have a day assigned
  const { data: exercises, error } = await supabase
    .from('workout_exercises')
    .select(`
      id,
      day_assigned,
      workouts!inner (
        id,
        title,
        profiles!inner (
          full_name
        )
      )
    `)
    .not('day_assigned', 'is', null);

  // Fetch session feedback separately for RPEs
  const { data: feedbackData } = await supabase
    .from('session_feedback')
    .select('workout_id, day_assigned, rpe');

  const feedbackMap: Record<string, number> = {};
  if (feedbackData) {
    feedbackData.forEach((fb: any) => {
      feedbackMap[`${fb.workout_id}-${fb.day_assigned}`] = fb.rpe;
    });
  }

  if (error) {
    console.error('Error fetching calendar events:', error);
  }

  const colors = [
    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30',
    'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'bg-pink-500/20 text-pink-400 border border-pink-500/30',
  ];

  function getColorForClient(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  const events: CalendarEvent[] = (exercises || []).map((ex: any) => ({
    id: ex.id,
    date: ex.day_assigned,
    title: ex.workouts.profiles.full_name,
    subtitle: ex.workouts.title,
    colorClass: getColorForClient(ex.workouts.profiles.full_name),
    rpe: feedbackMap[`${ex.workouts.id}-${ex.day_assigned}`]
  }));

  // We should deduplicate if the same client has multiple exercises on the same day for the same workout
  const uniqueEventsMap = new Map<string, CalendarEvent>();
  for (const event of events) {
    const key = `${event.date}-${event.title}-${event.subtitle}`;
    if (!uniqueEventsMap.has(key)) {
      uniqueEventsMap.set(key, event);
    }
  }
  const uniqueEvents = Array.from(uniqueEventsMap.values());

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Calendario Global</h1>
        <p className="text-neutral-400 mt-1">Vista de todas las sesiones programadas para tus clientes.</p>
      </div>

      <div className="max-w-5xl">
        <CalendarWidget events={uniqueEvents} />
      </div>
    </div>
  );
}
