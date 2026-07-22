import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateRoutineForm from '@/components/admin/CreateRoutineForm';

export const revalidate = 0;

export default async function CreateRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch client to ensure it exists and show name
  const { data: client, error: clientError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', id)
    .single();

  if (clientError || !client) {
    redirect('/admin/clients');
  }

  // Fetch exercise library
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('*')
    .order('name', { ascending: true });

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CreateRoutineForm clientId={client.id} clientName={client.full_name} exercises={exercises || []} />
    </div>
  );
}
