'use client';

import { useState, useEffect } from 'react';
import { addWeightRecord, saveExerciseFeedback, saveSessionRPE } from '@/app/actions/clientActions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Save, CheckCircle, PlayCircle, Info, Dumbbell, Calendar as CalendarIcon, Check, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import CalendarWidget, { CalendarEvent } from '@/components/CalendarWidget';

function getEmbedUrl(url: string) {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  return url;
}

export default function ClientDashboardContent({ 
  workouts, 
  weightHistory,
  calendarEvents
}: { 
  workouts: any[], 
  weightHistory: any[],
  calendarEvents?: CalendarEvent[]
}) {
  const [weight, setWeight] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [savingFeedbacks, setSavingFeedbacks] = useState<Record<string, boolean>>({});

  const [sessionRpeScores, setSessionRpeScores] = useState<Record<string, number>>({});
  const [savingSessionRpe, setSavingSessionRpe] = useState<Record<string, boolean>>({});

  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // Initialize from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('completed_exercises');
    if (saved) {
      try {
        setCompletedExercises(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleCompleted = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedExercises(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      localStorage.setItem('completed_exercises', JSON.stringify(newState));
      return newState;
    });
  };

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    setIsSavingWeight(true);
    await addWeightRecord(parseFloat(weight));
    setWeight('');
    setIsSavingWeight(false);
  };

  const handleSaveFeedback = async (workoutExerciseId: string, feedbackToSave: string) => {
    setSavingFeedbacks({ ...savingFeedbacks, [workoutExerciseId]: true });
    const res = await saveExerciseFeedback(workoutExerciseId, feedbackToSave);
    if (!res?.success) {
      alert(res?.error || 'Error guardando feedback');
    }
    setSavingFeedbacks({ ...savingFeedbacks, [workoutExerciseId]: false });
  };

  const handleFeedbackChange = (id: string, value: string) => {
    setFeedbacks({ ...feedbacks, [id]: value });
  };

  const handleSaveSessionRPE = async (workoutId: string, dayAssigned: string) => {
    const key = `${workoutId}-${dayAssigned}`;
    const rpe = sessionRpeScores[key];
    if (!rpe || !workoutId) return;
    setSavingSessionRpe(prev => ({ ...prev, [key]: true }));
    try {
      const res = await saveSessionRPE(workoutId, dayAssigned, rpe);
      if (!res?.success) {
        alert(res?.error || 'Error guardando sesión');
      }
    } catch (e: any) {
      alert(e.message || 'Error desconocido');
    }
    setSavingSessionRpe(prev => ({ ...prev, [key]: false }));
  };

  const sessionFeedbackMap: Record<string, number> = {};
  workouts?.forEach(w => {
    w.session_feedback?.forEach((sf: any) => {
      sessionFeedbackMap[`${w.id}-${sf.day_assigned}`] = sf.rpe;
    });
  });

  const chartData = weightHistory.map(w => ({
    date: format(new Date(w.recorded_at), 'dd MMM', { locale: es }),
    weight: w.weight
  })).reverse();

  const [targetDay, setTargetDay] = useState<string>(() => {
    const localToday = new Date().toISOString().split('T')[0];
    if (!workouts || workouts.length === 0) return localToday;
    
    const allAssignedDays: string[] = [];
    workouts.forEach(w => {
      w.workout_exercises?.forEach((we: any) => {
        if (we.day_assigned && !allAssignedDays.includes(we.day_assigned)) {
          allAssignedDays.push(we.day_assigned);
        }
      });
    });
    allAssignedDays.sort();
    
    if (allAssignedDays.includes(localToday)) {
      return localToday;
    } else if (allAssignedDays.length > 0) {
      const futureDay = allAssignedDays.find(d => d > localToday);
      return futureDay || allAssignedDays[allAssignedDays.length - 1];
    }
    return localToday;
  });

  const localTodayStr = new Date().toISOString().split('T')[0];

  const filteredWorkouts = workouts?.map(w => {
    const filteredExercises = w.workout_exercises?.filter((we: any) => we.day_assigned === targetDay || !we.day_assigned) || [];
    return { ...w, workout_exercises: filteredExercises };
  }).filter(w => w.workout_exercises.length > 0);

  const isShowingToday = targetDay === localTodayStr;

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Rutina Activa (Columna izquierda) */}
        <section className="xl:col-span-1">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                {isShowingToday ? 'Hoy' : 'Sesión Seleccionada'}
              </h2>
              <p className="text-neutral-400 mt-1">
                {isShowingToday ? 'Tu sesión para el día de hoy.' : `Rutina programada para el ${targetDay}`}
              </p>
            </div>
          </div>

          {filteredWorkouts && filteredWorkouts.length > 0 ? (
            <div className="space-y-10">
              {filteredWorkouts.map(workout => (
                <div key={workout.id} className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 bg-gradient-to-br from-neutral-800/80 to-neutral-900 border-b border-neutral-800">
                      <h3 className="text-2xl font-bold text-white tracking-tight">{workout.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-neutral-400 font-medium">
                        <CalendarIcon size={16} className="text-blue-400" />
                        {format(new Date(workout.start_date), 'dd MMM', { locale: es })} - {format(new Date(workout.end_date), 'dd MMM', { locale: es })}
                      </div>
                      {workout.notes && (
                        <div className="mt-4 bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                          <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                          <p className="text-sm text-blue-100 leading-relaxed">{workout.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 md:p-6 space-y-8 bg-neutral-950">
                      {(() => {
                        const groupedExercises: { [key: string]: any[] } = {};
                        workout.workout_exercises?.forEach((we: any) => {
                          const day = we.day_assigned || 'Sin día específico';
                          if (!groupedExercises[day]) groupedExercises[day] = [];
                          groupedExercises[day].push(we);
                        });

                        return Object.entries(groupedExercises).map(([day, exercises]) => {
                          const sessionKey = `${workout.id}-${day}`;
                          const allCompleted = exercises.every(we => completedExercises[we.id]);

                          return (
                            <div key={day} className="relative">
                              <div className="flex items-center justify-between mb-6 mt-4 sticky top-0 z-10 bg-neutral-950/95 backdrop-blur-xl py-4 px-2 border-b-2 border-emerald-500/30 rounded-t-xl shadow-[0_10px_30px_-15px_rgba(16,185,129,0.2)]">
                                <div className="flex items-center gap-3">
                                  <CalendarIcon className="text-emerald-400" size={22} />
                                  <h4 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest">{day}</h4>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${allCompleted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                                  {exercises.filter(we => completedExercises[we.id]).length} / {exercises.length} completados
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-4">
                                {exercises.map((we: any) => {
                                  const isExpanded = expandedExercise === we.id;
                                  const isCompleted = completedExercises[we.id];
                                  const ex = we.exercise_library;
                                  const currentFeedback = feedbacks[we.id] ?? we.client_feedback ?? '';

                                  return (
                                    <motion.div 
                                      key={we.id} 
                                      layout
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`rounded-2xl transition-all duration-300 border-2 overflow-hidden ${
                                        isCompleted 
                                          ? 'bg-neutral-900 border-emerald-500/30 opacity-75 hover:opacity-100' 
                                          : 'bg-neutral-900 border-transparent hover:border-neutral-700'
                                      } ${isExpanded ? 'ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : ''}`}
                                    >
                                      <div 
                                        className="p-4 flex gap-4 items-center cursor-pointer"
                                        onClick={() => setExpandedExercise(isExpanded ? null : we.id)}
                                      >
                                        <button 
                                          onClick={(e) => toggleCompleted(we.id, e)}
                                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isCompleted 
                                              ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                              : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700 hover:text-white'
                                          }`}
                                        >
                                          {isCompleted ? <Check size={18} strokeWidth={3} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-50" />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                          <h4 className={`font-bold text-lg truncate transition-colors ${isCompleted ? 'text-emerald-50' : 'text-white'}`}>
                                            {ex?.name || 'Ejercicio Eliminado'}
                                          </h4>
                                          <div className="flex items-center gap-3 mt-1">
                                            <span className="inline-flex items-center text-sm font-semibold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md">
                                              {we.sets} <span className="text-blue-400/60 mx-1 text-xs uppercase">series x</span> {we.reps} <span className="text-blue-400/60 ml-1 text-xs uppercase">reps</span>
                                            </span>
                                            {we.weight_guidelines && (
                                              <span className="text-xs text-neutral-400 truncate max-w-[120px] md:max-w-[200px] hidden sm:inline-block">
                                                {we.weight_guidelines}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex-shrink-0 text-neutral-400 bg-neutral-800/50 p-2 rounded-full">
                                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                      </div>

                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-neutral-950/50 border-t border-neutral-800/50"
                                          >
                                            <div className="p-4 space-y-6">
                                              
                                              {/* Media Section */}
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Specific trainer media */}
                                                {we.exercise_photo_url && (
                                                  <div className="space-y-2">
                                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Video de tu entrenador</span>
                                                    {(() => {
                                                      return we.exercise_photo_url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                                        <div className="w-full flex justify-center bg-black rounded-2xl overflow-hidden border border-neutral-800">
                                                            <img 
                                                              src={we.exercise_photo_url} 
                                                              alt={ex?.name || 'Ejercicio'}
                                                              className="w-full h-auto object-contain max-h-80 hover:scale-105 transition-transform duration-500"
                                                            />
                                                        </div>
                                                      ) : (
                                                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-neutral-800 relative group">
                                                          <iframe 
                                                            src={getEmbedUrl(we.exercise_photo_url)} 
                                                            className="w-full h-full absolute inset-0"
                                                            allowFullScreen
                                                          ></iframe>
                                                        </div>
                                                      );
                                                    })()}
                                                  </div>
                                                )}
                                                
                                                {/* Library generic video */}
                                                {ex?.video_url && !we.exercise_photo_url && (
                                                  <div className="space-y-2 md:col-span-2 max-w-2xl mx-auto w-full">
                                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2"><PlayCircle size={14}/> Demostración</span>
                                                    {(() => {
                                                      return ex.video_url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                                        <div className="w-full flex justify-center bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-lg">
                                                            <img 
                                                              src={ex.video_url} 
                                                              alt={ex.name || 'Ejercicio genérico'}
                                                              className="w-full h-auto object-contain max-h-80"
                                                            />
                                                        </div>
                                                      ) : (
                                                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-lg">
                                                          <iframe 
                                                            src={getEmbedUrl(ex.video_url)} 
                                                            className="w-full h-full"
                                                            allowFullScreen
                                                          ></iframe>
                                                        </div>
                                                      );
                                                    })()}
                                                  </div>
                                                )}
                                              </div>

                                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Instructions Panel */}
                                                <div className="space-y-4">
                                                  {ex?.description && (
                                                    <div>
                                                      <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Instrucciones</h5>
                                                      <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-800/30 p-4 rounded-xl border border-neutral-800/50">{ex.description}</p>
                                                    </div>
                                                  )}
                                                  
                                                  <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-5 rounded-xl border border-blue-500/20 shadow-inner">
                                                    <div className="flex items-start gap-3">
                                                      <Dumbbell className="text-blue-400 mt-0.5" size={18} />
                                                      <div>
                                                        <h5 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-1">Pautas de Peso</h5>
                                                        <p className="text-blue-50 font-medium text-sm">{we.weight_guidelines || 'Ninguna indicación especial'}</p>
                                                      </div>
                                                    </div>
                                                    
                                                    {we.trainer_notes && (
                                                      <div className="mt-4 pt-4 border-t border-blue-500/20 flex items-start gap-3">
                                                        <Info className="text-purple-400 mt-0.5" size={18} />
                                                        <div>
                                                          <h5 className="text-purple-400 font-bold uppercase text-xs tracking-wider mb-1">Notas del Entrenador</h5>
                                                          <p className="text-purple-50 text-sm">{we.trainer_notes}</p>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Client Observations */}
                                                <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 shadow-inner">
                                                  <label className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                                    Tus Sensaciones y Pesos Usados
                                                  </label>
                                                  <textarea 
                                                    value={currentFeedback}
                                                    onChange={(e) => handleFeedbackChange(we.id, e.target.value)}
                                                    placeholder="Ej: Completé las series con 20kg. Me sentí bien."
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner"
                                                    rows={4}
                                                  />
                                                  <div className="flex justify-end mt-3">
                                                    <button
                                                      onClick={() => handleSaveFeedback(we.id, currentFeedback)}
                                                      disabled={savingFeedbacks[we.id]}
                                                      className="text-sm bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center transition-all disabled:opacity-50"
                                                    >
                                                      {savingFeedbacks[we.id] ? (
                                                        <span className="animate-pulse">Guardando...</span>
                                                      ) : (
                                                        <><Save size={16} className="mr-2" /> Guardar Notas</>
                                                      )}
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>

                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  );
                                })}
                              </div>

                              {/* Session RPE Feedback */}
                              {day !== 'Sin día específico' && (
                                <div className="mt-6 bg-gradient-to-r from-neutral-900 to-neutral-800 p-6 rounded-2xl border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                                  {sessionFeedbackMap[sessionKey] ? (
                                    <div className="flex items-center gap-3 text-emerald-400 bg-emerald-400/10 px-4 py-3 rounded-xl border border-emerald-400/20">
                                      <CheckCircle size={24} className="flex-shrink-0" />
                                      <div>
                                        <span className="font-bold text-sm block text-emerald-300">Sesión Evaluada</span>
                                        <span className="text-emerald-400/80 text-xs">Esfuerzo (RPE): {sessionFeedbackMap[sessionKey]}/10</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex-1">
                                        <p className="text-base font-bold text-white mb-1">Evalúa tu sesión de hoy</p>
                                        <p className="text-sm text-neutral-400">¿Cómo de exigente ha sido? (1 = Muy suave, 10 = Esfuerzo máximo)</p>
                                      </div>
                                      <div className="flex items-center gap-3 w-full md:w-auto">
                                        <select 
                                          value={sessionRpeScores[sessionKey] || ''} 
                                          onChange={(e) => setSessionRpeScores({...sessionRpeScores, [sessionKey]: parseInt(e.target.value)})}
                                          className="flex-1 md:flex-none bg-neutral-950 border border-neutral-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                        >
                                          <option value="" disabled>Selecciona...</option>
                                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                            <option key={n} value={n}>{n} - {n <= 3 ? 'Suave' : n <= 7 ? 'Moderado' : 'Duro'}</option>
                                          ))}
                                        </select>
                                        <button
                                          onClick={() => handleSaveSessionRPE(workout.id, day)}
                                          disabled={!sessionRpeScores[sessionKey] || savingSessionRpe[sessionKey]}
                                          className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:shadow-none hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center justify-center min-w-[140px]"
                                        >
                                          {savingSessionRpe[sessionKey] ? 'Guardando...' : 'Completar'}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/20 to-transparent"></div>
              <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
              <h3 className="text-xl font-bold text-white mb-2">¡Todo al día!</h3>
              <p className="text-neutral-400 max-w-md mx-auto">Has completado todo o no hay entrenamientos programados para los próximos días.</p>
            </div>
          )}
        </section>

        {/* Sidebar (Derecha, calendario) */}
        <div className="xl:col-span-1 space-y-8">
          {/* Client Calendar */}
          {calendarEvents && calendarEvents.length > 0 && (
            <section className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CalendarIcon className="text-purple-400" size={24} /> 
                Mi Calendario
              </h2>
              <CalendarWidget 
                events={calendarEvents} 
                onDayClick={(dateStr) => setTargetDay(dateStr)}
                selectedDate={targetDay}
              />
            </section>
          )}

          {/* Evolución de Peso */}
          <section className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <TrendingUp className="text-blue-400" size={24} /> 
              Evolución de Peso
            </h2>
            <div className="relative z-10">
              <form onSubmit={handleSaveWeight} className="flex flex-col sm:flex-row gap-3 mb-8">
                <input 
                  type="number" 
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Peso actual (kg)"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isSavingWeight}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
                >
                  {isSavingWeight ? 'Guardando...' : 'Registrar'}
                </button>
              </form>

              {chartData.length > 0 ? (
                <div className="h-64 w-full bg-neutral-950/50 rounded-2xl p-4 border border-neutral-800/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="date" stroke="#737373" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#737373" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                        labelStyle={{ color: '#a3a3a3', marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#171717', stroke: '#3b82f6', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-neutral-950/50 rounded-2xl p-8 border border-neutral-800/50 text-center">
                  <p className="text-neutral-500 font-medium">Aún no hay registros de peso.</p>
                  <p className="text-xs text-neutral-600 mt-1">Registra tu peso hoy para ver tu gráfica.</p>
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
