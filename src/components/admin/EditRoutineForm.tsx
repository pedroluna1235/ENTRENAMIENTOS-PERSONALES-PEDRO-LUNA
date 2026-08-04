'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRoutine } from '@/app/actions/clientActions';
import { supabase } from '@/lib/supabaseClient';
import { Save, Plus, Trash2, ArrowLeft, Loader2, Dumbbell, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';

type ExerciseData = {
  id: string; // db id or temp id
  exercise_id: string;
  day_assigned?: string;
  sets: number;
  reps: number;
  weight_guidelines: string;
  trainer_notes: string;
  exercise_photo_url: string;
  uploading: boolean;
  rest_between_sets?: string;
  rest_between_reps?: string;
};

export default function EditRoutineForm({ 
  clientId, 
  clientName, 
  exercises,
  initialWorkout
}: { 
  clientId: string; 
  clientName: string; 
  exercises: any[]; 
  initialWorkout: any;
}) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialWorkout?.title || '');
  const [startDate, setStartDate] = useState(initialWorkout?.start_date || '');
  const [endDate, setEndDate] = useState(initialWorkout?.end_date || '');
  const [notes, setNotes] = useState(initialWorkout?.notes || '');
  const [restBetweenSets, setRestBetweenSets] = useState(initialWorkout?.rest_between_sets || '');
  const [restBetweenReps, setRestBetweenReps] = useState(initialWorkout?.rest_between_reps || '');
  
  const [routineExercises, setRoutineExercises] = useState<ExerciseData[]>(
    initialWorkout?.workout_exercises?.map((we: any) => ({
      id: we.id,
      exercise_id: we.exercise_id,
      day_assigned: we.day_assigned || '',
      sets: we.sets,
      reps: we.reps,
      weight_guidelines: we.weight_guidelines || '',
      trainer_notes: we.trainer_notes || '',
      exercise_photo_url: we.exercise_photo_url || '',
      uploading: false,
      rest_between_sets: we.rest_between_sets || '',
      rest_between_reps: we.rest_between_reps || ''
    })) || []
  );

  const addExercise = () => {
    setRoutineExercises([
      ...routineExercises, 
      {
        id: crypto.randomUUID(),
        exercise_id: exercises.length > 0 ? exercises[0].id : '',
        day_assigned: '',
        sets: 3,
        reps: 10,
        weight_guidelines: '',
        trainer_notes: '',
        exercise_photo_url: '',
        uploading: false,
        rest_between_sets: restBetweenSets,
        rest_between_reps: restBetweenReps
      }
    ]);
  };

  const removeExercise = (id: string) => {
    setRoutineExercises(routineExercises.filter(ex => ex.id !== id));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routineExercises.length - 1) return;
    
    const newExercises = [...routineExercises];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newExercises[index], newExercises[swapIndex]] = [newExercises[swapIndex], newExercises[index]];
    
    setRoutineExercises(newExercises);
  };

  const updateExercise = (id: string, field: keyof ExerciseData, value: any) => {
    setRoutineExercises(routineExercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    updateExercise(id, 'uploading', true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `routines/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('exercise-media')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error subiendo archivo (es posible que falten permisos en la BD): ' + uploadError.message);
      updateExercise(id, 'uploading', false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('exercise-media')
      .getPublicUrl(filePath);

    updateExercise(id, 'exercise_photo_url', urlData.publicUrl);
    updateExercise(id, 'uploading', false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (routineExercises.some(ex => !ex.exercise_id)) {
      alert('Todos los bloques deben tener un ejercicio seleccionado.');
      setLoading(false);
      return;
    }

    const result = await updateRoutine(
      initialWorkout.id,
      clientId,
      title || 'Nueva Rutina',
      startDate || new Date().toISOString().split('T')[0],
      endDate,
      notes,
      restBetweenSets,
      restBetweenReps,
      routineExercises
    );

    if (result.success) {
      router.push(`/admin/clients/${clientId}`);
      router.refresh();
    } else {
      alert(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <div>
          <Link href={`/admin/clients/${clientId}`} className="text-emerald-500 hover:text-emerald-400 text-sm font-medium flex items-center gap-2 mb-2">
            <ArrowLeft className="w-4 h-4" /> Volver a ficha
          </Link>
          <h1 className="text-2xl font-bold text-white">Editar Rutina Quincenal</h1>
          <p className="text-neutral-400 mt-1">Editando plan de {clientName}</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Rutina
        </button>
      </div>

      {/* Basic Data */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-500" />
          Datos Generales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-neutral-400">Título de la Rutina</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Quincena 1 - Fuerza Max"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Fecha de Inicio</label>
            <input 
              type="date" 
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Fecha de Fin (Opcional)</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-neutral-400">Notas Generales de la Quincena</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Instrucciones para estos 15 días..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </div>
        
        {/* General Rest Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-neutral-800">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Descanso entre series (General)</label>
            <input 
              type="text"
              value={restBetweenSets}
              onChange={(e) => {
                const val = e.target.value;
                setRestBetweenSets(val);
                setRoutineExercises(prev => prev.map(ex => ({
                  ...ex,
                  rest_between_sets: val
                })));
              }}
              placeholder="Ej: 60s, 1.5 min..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Descanso entre repeticiones (General)</label>
            <input 
              type="text"
              value={restBetweenReps}
              onChange={(e) => {
                const val = e.target.value;
                setRestBetweenReps(val);
                setRoutineExercises(prev => prev.map(ex => ({
                  ...ex,
                  rest_between_reps: val
                })));
              }}
              placeholder="Ej: 0s, 5s..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Exercises Form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-500" />
            Ejercicios de la Rutina
          </h2>
          <button
            type="button"
            onClick={addExercise}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors border border-neutral-700"
          >
            <Plus className="w-4 h-4" /> Añadir Ejercicio
          </button>
        </div>

        {routineExercises.length === 0 ? (
          <div className="py-12 text-center bg-neutral-950 rounded-xl border border-neutral-800 border-dashed">
            <p className="text-neutral-500 mb-4">No has añadido ningún ejercicio todavía.</p>
            <button
              type="button"
              onClick={addExercise}
              className="px-6 py-2 bg-emerald-600/20 text-emerald-400 font-medium rounded-lg hover:bg-emerald-600/30 transition-colors"
            >
              Comenzar a añadir
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {routineExercises.map((ex, index) => (
              <div key={ex.id} className="relative bg-neutral-950 border border-neutral-800 rounded-xl p-6 group">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveExercise(index, 'up')}
                    disabled={index === 0}
                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExercise(index, 'down')}
                    disabled={index === routineExercises.length - 1}
                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(ex.id)}
                    className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <h4 className="text-emerald-500 font-bold mb-4">Ejercicio {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Row 1 */}
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Seleccionar Ejercicio</label>
                    <select
                      value={ex.exercise_id}
                      onChange={(e) => updateExercise(ex.id, 'exercise_id', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="" disabled>Selecciona uno de la biblioteca...</option>
                      {exercises.map(libraryEx => (
                        <option key={libraryEx.id} value={libraryEx.id}>{libraryEx.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Día de la semana</label>
                    <input 
                      type="date" 
                      value={ex.day_assigned || ''}
                      onChange={(e) => updateExercise(ex.id, 'day_assigned', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Series</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={ex.sets}
                      onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Repeticiones</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={ex.reps}
                      onChange={(e) => updateExercise(ex.id, 'reps', parseInt(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Peso Recomendado / Pautas</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Empezar con 20kg y subir si es fácil"
                      value={ex.weight_guidelines}
                      onChange={(e) => updateExercise(ex.id, 'weight_guidelines', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Foto/Vídeo Específico (Opcional)</label>
                    <div className="flex gap-2 items-center">
                      <label className="flex-shrink-0 cursor-pointer flex items-center justify-center p-3 bg-neutral-900 border border-neutral-800 hover:border-emerald-500 text-neutral-400 hover:text-emerald-500 rounded-lg transition-colors">
                        {ex.uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, ex.id)} />
                      </label>
                      <input 
                        type="text" 
                        placeholder="URL directa (o sube un archivo)"
                        value={ex.exercise_photo_url}
                        onChange={(e) => updateExercise(ex.id, 'exercise_photo_url', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-300 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 4: Rest fields */}
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Descanso (Series)</label>
                    <input 
                      type="text"
                      placeholder="Ej: 60s"
                      value={ex.rest_between_sets || ''}
                      onChange={(e) => updateExercise(ex.id, 'rest_between_sets', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Descanso (Repeticiones)</label>
                    <input 
                      type="text"
                      placeholder="Ej: 0s"
                      value={ex.rest_between_reps || ''}
                      onChange={(e) => updateExercise(ex.id, 'rest_between_reps', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Row 5: Notes */}
                  <div className="md:col-span-12 space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Observaciones del Entrenador</label>
                    <textarea 
                      rows={2}
                      placeholder="Fíjate bien en la técnica de bajada..."
                      value={ex.trainer_notes}
                      onChange={(e) => updateExercise(ex.id, 'trainer_notes', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
