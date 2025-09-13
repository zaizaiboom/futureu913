import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question_id } = await request.json();
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 });

  const { data, error } = await supabase
    .from('favorite_questions')
    .insert({ user_id: user.id, question_id });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already favorited' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('favorite_questions')
    .select('*, interview_questions(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error in GET /api/favorites:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question_id } = await request.json();
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 });

  const { error } = await supabase
    .from('favorite_questions')
    .delete()
    .eq('user_id', user.id)
    .eq('question_id', question_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}