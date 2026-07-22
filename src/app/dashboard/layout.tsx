import { getSession } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  let photoUrl = null;
  if (session.id && session.role === 'client') {
    const { data } = await supabase.from('profiles').select('photo_url').eq('id', session.id).single();
    if (data) photoUrl = data.photo_url;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar userName={session.name || 'Usuario'} role={session.role} photoUrl={photoUrl} />
      </div>
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
        {children}
      </main>
    </div>
  );
}
