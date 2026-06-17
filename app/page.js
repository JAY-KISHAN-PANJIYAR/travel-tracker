import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  redirect(data?.user ? '/map' : '/login');
}
