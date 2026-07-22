'use server';

import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const SEED_CLIENTS = [
  { name: 'Ana García', age: 28, weight: 65.5, obj: 'Pérdida de grasa', pwd: 'ana', birth: '1996-05-12' },
  { name: 'Carlos López', age: 34, weight: 82.0, obj: 'Hipertrofia', pwd: 'carlos', birth: '1990-08-23' },
  { name: 'María Martínez', age: 41, weight: 70.2, obj: 'Mantenimiento', pwd: 'maria', birth: '1983-02-14' },
  { name: 'Juan Pérez', age: 25, weight: 75.0, obj: 'Fuerza', pwd: 'juan', birth: '1999-11-30' },
  { name: 'Laura Sánchez', age: 30, weight: 60.5, obj: 'Tonificación', pwd: 'laura', birth: '1994-07-08' },
  { name: 'David Gómez', age: 38, weight: 90.1, obj: 'Pérdida de peso', pwd: 'david', birth: '1986-04-19' },
  { name: 'Elena Ruiz', age: 29, weight: 58.0, obj: 'Mantenimiento', pwd: 'elena', birth: '1995-09-02' },
  { name: 'Pablo Díaz', age: 33, weight: 78.5, obj: 'Hipertrofia', pwd: 'pablo', birth: '1991-12-15' },
  { name: 'Carmen Fernández', age: 45, weight: 68.0, obj: 'Salud general', pwd: 'carmen', birth: '1979-03-22' },
  { name: 'Javier Moreno', age: 31, weight: 85.0, obj: 'Fuerza', pwd: 'javier', birth: '1993-01-10' }
];

export async function seedClients() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'No autorizado' };
  }

  for (let i = 0; i < SEED_CLIENTS.length; i++) {
    const c = SEED_CLIENTS[i];
    const email = `cliente${Date.now()}_${i + 1}@entrenamientos.test`;
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: 'Password123!',
    });

    if (authError || !authData.user) {
      console.error('Error creating user:', authError);
      continue;
    }

    // Upsert profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      role: 'client',
      full_name: c.name,
      birth_date: c.birth,
      age: c.age,
      weight: c.weight,
      objective: c.obj,
      client_password: c.pwd, // Allow simple login for clients
      photo_url: `https://i.pravatar.cc/150?u=${authData.user.id}`
    });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }
    
    // Add initial weight to history
    await supabase.from('weight_history').insert({
      client_id: authData.user.id,
      weight: c.weight,
    });
  }

  revalidatePath('/admin/clients');
  return { success: true };
}

export async function createRoutine(
  clientId: string,
  title: string,
  startDate: string,
  endDate: string,
  notes: string,
  exercises: {
    exercise_id: string;
    sets: number;
    reps: number;
    weight_guidelines: string;
    trainer_notes: string;
    exercise_photo_url?: string;
    day_assigned?: string;
  }[]
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'No autorizado' };
  }

  // 1. Create Workout
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      client_id: clientId,
      title,
      start_date: startDate,
      end_date: endDate,
      notes,
    })
    .select()
    .single();

  if (workoutError || !workout) {
    return { success: false, error: workoutError?.message || 'Error creando rutina' };
  }

  // 2. Insert exercises
  if (exercises.length > 0) {
    const workoutExercises = exercises.map((ex) => ({
      workout_id: workout.id,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      weight_guidelines: ex.weight_guidelines,
      trainer_notes: ex.trainer_notes,
      exercise_photo_url: ex.exercise_photo_url || null,
      ...(ex.day_assigned && { day_assigned: ex.day_assigned }),
    }));

    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(workoutExercises);

    if (exercisesError) {
      // Rollback logic would be ideal, but for now we'll just return error
      return { success: false, error: exercisesError.message };
    }
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true, workoutId: workout.id };
}

export async function updateRoutine(
  workoutId: string,
  clientId: string,
  title: string,
  startDate: string,
  endDate: string,
  notes: string,
  exercises: {
    id?: string;
    exercise_id: string;
    sets: number;
    reps: number;
    weight_guidelines: string;
    trainer_notes: string;
    exercise_photo_url?: string;
    day_assigned?: string;
  }[]
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'No autorizado' };
  }

  // 1. Update Workout
  const { error: workoutError } = await supabase
    .from('workouts')
    .update({
      title,
      start_date: startDate,
      end_date: endDate,
      notes,
    })
    .eq('id', workoutId);

  if (workoutError) {
    return { success: false, error: workoutError.message || 'Error actualizando rutina' };
  }

  // 2. Manage exercises (upsert/delete)
  // Fetch existing exercises from DB
  const { data: existingExercises } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('workout_id', workoutId);

  const existingDbIds = existingExercises?.map(e => e.id) || [];
  const incomingIds = exercises.map(e => e.id).filter(Boolean) as string[];

  // Delete exercises that are no longer in the incoming list
  const idsToDelete = existingDbIds.filter(id => !incomingIds.includes(id));
  if (idsToDelete.length > 0) {
    await supabase.from('workout_exercises').delete().in('id', idsToDelete);
  }

  // Insert or Update exercises
  for (const ex of exercises) {
    const payload = {
      workout_id: workoutId,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      weight_guidelines: ex.weight_guidelines,
      trainer_notes: ex.trainer_notes,
      exercise_photo_url: ex.exercise_photo_url || null,
      day_assigned: ex.day_assigned || null,
    };

    if (ex.id && existingDbIds.includes(ex.id)) {
      // Update existing
      await supabase.from('workout_exercises').update(payload).eq('id', ex.id);
    } else {
      // Insert new
      await supabase.from('workout_exercises').insert([payload]);
    }
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

export async function addWeightRecord(weight: number) {
  const session = await getSession();
  if (!session || session.role !== 'client') {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('weight_history')
    .insert([{ client_id: session.id, weight }]);

  if (error) {
    console.error('Error saving weight:', error);
    return { success: false, error: 'Error al guardar el peso' };
  }

  revalidatePath('/dashboard/client');
  return { success: true };
}

export async function saveExerciseFeedback(workoutExerciseId: string, feedback: string) {
  const session = await getSession();
  if (!session || session.role !== 'client') {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('workout_exercises')
    .update({ client_feedback: feedback })
    .eq('id', workoutExerciseId);

  if (error) {
    console.error('Error saving feedback:', error);
    return { success: false, error: 'Error al guardar las observaciones' };
  }

  revalidatePath('/dashboard/client');
  return { success: true };
}

export async function addClient(formData: {
  fullName: string;
  birthDate: string;
  age: number;
  weight: number;
  objective: string;
  clientPassword: string;
  photoUrl?: string;
  trainingDays?: number;
}) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'No autorizado' };
  }

  // Insert profile directly (bypassing auth.users)
  const { data: profileData, error: profileError } = await supabase.from('profiles').insert({
    role: 'client',
    full_name: formData.fullName,
    birth_date: formData.birthDate,
    age: formData.age,
    weight: formData.weight,
    objective: formData.objective,
    client_password: formData.clientPassword,
    training_days_per_week: formData.trainingDays || 3,
    photo_url: formData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=10b981&color=fff`
  }).select('id').single();

  if (profileError || !profileData) {
    console.error('Error creating profile:', profileError);
    return { success: false, error: `Error DB: ${profileError?.message || 'Unknown Error'}` };
  }

  // Add initial weight
  await supabase.from('weight_history').insert({
    client_id: profileData.id,
    weight: formData.weight,
  });

  revalidatePath('/admin/clients');
  return { success: true, clientId: profileData.id };
}

export async function updateClient(clientId: string, formData: {
  fullName: string;
  birthDate: string;
  age: number;
  weight: number;
  objective: string;
  clientPassword: string;
  photoUrl?: string;
  trainingDays?: number;
}) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'No autorizado' };
  }

  const { error: profileError } = await supabase.from('profiles').update({
    full_name: formData.fullName,
    birth_date: formData.birthDate,
    age: formData.age,
    weight: formData.weight,
    objective: formData.objective,
    client_password: formData.clientPassword,
    training_days_per_week: formData.trainingDays || 3,
    ...(formData.photoUrl && { photo_url: formData.photoUrl })
  }).eq('id', clientId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    return { success: false, error: `Error DB: ${profileError.message}` };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath('/admin/clients');
  return { success: true };
}

export async function deleteClient(clientId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await supabase.from('profiles').delete().eq('id', clientId);

  if (error) {
    console.error('Error deleting profile:', error);
    return { success: false, error: 'Error al eliminar el cliente.' };
  }

  revalidatePath('/admin/clients');
  return { success: true };
}

export async function saveSessionRPE(workoutId: string, dayAssigned: string, rpe: number) {
  const session = await getSession();
  if (!session || session.role !== 'client') {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('session_feedback')
    .upsert(
      {
        workout_id: workoutId,
        client_id: session.id,
        day_assigned: dayAssigned,
        rpe: rpe
      },
      { onConflict: 'workout_id,day_assigned' }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/client');
  return { success: true };
}
