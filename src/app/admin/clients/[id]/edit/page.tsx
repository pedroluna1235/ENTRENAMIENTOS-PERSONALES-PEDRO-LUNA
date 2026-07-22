import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditClientForm from './EditClientForm';

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch client data
  const { data: client, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !client) {
    redirect('/admin/clients');
  }

  return <EditClientForm initialData={client} clientId={id} />;
}
