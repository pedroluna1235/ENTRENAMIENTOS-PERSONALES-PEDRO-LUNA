'use client';

import { useState } from 'react';
import { addWeightRecord, saveExerciseFeedback, saveSessionRPE } from '@/app/actions/clientActions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Save, CheckCircle } from 'lucide-react';
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

  return (
    <div className="space-y-8 pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rutina Activa */}
        <section className="lg:col-span-2">
        <h2 className="text-xl font-bold text-white mb-4">Mis Rutinas</h2>
        {workouts && workouts.length > 0 ? (
          <div className="space-y-6">
            {workouts.map(workout => (
              <div key={workout.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-neutral-800/50 border-b border-neutral-800">
                  <h3 className="font-semibold text-white">{workout.title}</h3>
                  <p className="text-sm text-neutral-400">
                    {format(new Date(workout.start_date), 'dd MMM', { locale: es })} - {format(new Date(workout.end_date), 'dd MMM', { locale: es })}
                  </p>
                  {workout.notes && (
                    <p className="text-sm text-neutral-300 mt-2 bg-neutral-800 p-2 rounded-lg">{workout.notes}</p>
                  )}
                </div>
                
                <div className="divide-y divide-neutral-800">
                  {(() => {
                    const groupedExercises: { [key: string]: any[] } = {};
                    workout.workout_exercises?.forEach((we: any) => {
                      const day = we.day_assigned || 'Sin día específico';
                      if (!groupedExercises[day]) groupedExercises[day] = [];
                      groupedExercises[day].push(we);
                    });

                    return Object.entries(groupedExercises).map(([day, exercises]) => {
                      const sessionKey = `${workout.id}-${day}`;
                      return (
                      <div key={day} className="pb-4">
                        <div className="bg-neutral-800/80 px-4 py-2 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                          <h4 className="font-bold text-emerald-500 text-sm uppercase tracking-wider">{day}</h4>
                          <span className="text-xs text-neutral-400 font-medium">{exercises.length} ejercicios</span>
                        </div>
                        <div className="divide-y divide-neutral-800/50">
                          {exercises.map((we: any) => {
                            const isExpanded = expandedExercise === we.id;
                            const ex = we.exercise_library;
                            const currentFeedback = feedbacks[we.id] ?? we.client_feedback ?? '';

                            return (
                              <div key={we.id} className="p-4 hover:bg-neutral-800/20 transition-colors">
                                <div 
                                  className="flex justify-between items-center cursor-pointer"
                                  onClick={() => setExpandedExercise(isExpanded ? null : we.id)}
                                >
                                  <div>
                                    <h4 className="font-medium text-white text-lg">{ex?.name || 'Ejercicio Eliminado'}</h4>
                                    <p className="text-sm text-blue-400 font-medium mt-0.5">{we.sets} series x {we.reps} reps</p>
                                  </div>
                                  <div className="bg-neutral-800 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-4 space-y-4">
                                        {/* Specific trainer media */}
                                        {we.exercise_photo_url && (() => {
                                          return we.exercise_photo_url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                            <div className="w-full flex justify-center bg-black/20 rounded-xl p-2 border border-neutral-800/50">
                                              <img 
                                                src={we.exercise_photo_url} 
                                                alt={ex?.name || 'Ejercicio'}
                                                className="max-w-full h-auto object-contain max-h-64 rounded-lg"
                                              />
                                            </div>
                                          ) : (
                                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800">
                                              <iframe 
                                                src={getEmbedUrl(we.exercise_photo_url)} 
                                                className="w-full h-full"
                                                allowFullScreen
                                              ></iframe>
                                            </div>
                                          );
                                        })()}
                                        
                                        {/* Library generic video */}
                                        {ex?.video_url && (() => {
                                          return ex.video_url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                            <div className="w-full flex justify-center bg-black/20 rounded-xl p-2 border border-neutral-800/50">
                                              <img 
                                                src={ex.video_url} 
                                                alt={ex.name || 'Ejercicio genérico'}
                                                className="max-w-full h-auto object-contain max-h-64 rounded-lg"
                                              />
                                            </div>
                                          ) : (
                                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800">
                                              <iframe 
                                                src={getEmbedUrl(ex.video_url)} 
                                                className="w-full h-full"
                                                allowFullScreen
                                              ></iframe>
                                            </div>
                                          );
                                        })()}
                                        {ex?.description && (
                                          <p className="text-sm text-neutral-400 leading-relaxed bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/50">{ex.description}</p>
                                        )}
                                        
                                        <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-900/30 text-sm">
                                          <p className="text-blue-100"><span className="text-blue-400 font-semibold uppercase text-xs tracking-wider block mb-1">Pautas de Peso</span> {we.weight_guidelines || 'Ninguna indicación especial'}</p>
                                          {we.trainer_notes && (
                                            <p className="text-blue-100 mt-3 border-t border-blue-900/30 pt-3"><span className="text-blue-400 font-semibold uppercase text-xs tracking-wider block mb-1">Notas del Entrenador</span> {we.trainer_notes}</p>
                                          )}
                                        </div>

                                        {/* Client Observations */}
                                        <div className="space-y-2 pt-2">
                                          <label className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Tus sensaciones y pesos
                                          </label>
                                          <textarea 
                                            value={currentFeedback}
                                            onChange={(e) => handleFeedbackChange(we.id, e.target.value)}
                                            placeholder="Ej: Completé las series con 20kg. Me sentí bien."
                                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                                            rows={3}
                                          />
                                          <div className="flex justify-end mt-2">
                                            <button
                                              onClick={() => handleSaveFeedback(we.id, currentFeedback)}
                                              disabled={savingFeedbacks[we.id]}
                                              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors disabled:opacity-50"
                                            >
                                              {savingFeedbacks[we.id] ? (
                                                <>Guardando...</>
                                              ) : (
                                                <><Save size={16} className="mr-2" /> Guardar Notas</>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                        {/* Session RPE Feedback */}
                        {day !== 'Sin día específico' && (
                          <div className="bg-neutral-800/30 p-4 border-t border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {sessionFeedbackMap[sessionKey] ? (
                              <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle size={20} />
                                <span className="font-medium text-sm">Sesión completada - Esfuerzo (RPE): {sessionFeedbackMap[sessionKey]}/10</span>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <p className="text-sm font-semibold text-white">¿Cómo de exigente ha sido la sesión?</p>
                                  <p className="text-xs text-neutral-400">Del 1 (Muy suave) al 10 (Esfuerzo máximo)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select 
                                    value={sessionRpeScores[sessionKey] || ''} 
                                    onChange={(e) => setSessionRpeScores({...sessionRpeScores, [sessionKey]: parseInt(e.target.value)})}
                                    className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="" disabled>Selecciona RPE...</option>
                                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                      <option key={n} value={n}>{n}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleSaveSessionRPE(workout.id, day)}
                                    disabled={!sessionRpeScores[sessionKey] || savingSessionRpe[sessionKey]}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors flex items-center"
                                  >
                                    {savingSessionRpe[sessionKey] ? 'Guardando...' : 'Completar Sesión'}
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
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center shadow-sm">
            <CheckCircle className="mx-auto text-neutral-500 mb-2" size={32} />
            <p className="text-neutral-400">No tienes ninguna rutina asignada.</p>
          </div>
        )}
        </section>

        {/* Client Calendar */}
        {calendarEvents && calendarEvents.length > 0 && (
          <section className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">Mi Calendario</h2>
            <CalendarWidget events={calendarEvents} />
          </section>
        )}
      </div>

      {/* Evolución de Peso */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Evolución de Peso</h2>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-6 shadow-xl">
          <form onSubmit={handleSaveWeight} className="flex gap-2 mb-6">
            <input 
              type="number" 
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Peso actual (kg)"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
            <button 
              type="submit" 
              disabled={isSavingWeight}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSavingWeight ? '...' : 'Registrar'}
            </button>
          </form>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#60a5fa' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-neutral-500 py-8">Aún no hay registros de peso.</p>
          )}
        </div>
      </section>
    </div>
  );
}
