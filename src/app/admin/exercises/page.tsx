"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Edit2, Trash2, Dumbbell } from "lucide-react";
import { exerciseService, Exercise } from "@/lib/services/exerciseService";
import { ExerciseModal } from "@/components/ExerciseModal";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("Todos");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const data = await exerciseService.getExercises();
      setExercises(data);
    } catch (error) {
      console.error("Failed to fetch exercises");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este ejercicio?")) {
      try {
        await exerciseService.deleteExercise(id);
        fetchExercises();
      } catch (error) {
        alert("Error al eliminar el ejercicio");
      }
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setExerciseToEdit(exercise);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setExerciseToEdit(null);
    setIsModalOpen(true);
  };

  const muscles = ["Todos", ...Array.from(new Set(exercises.map(e => e.target_muscle).filter(Boolean)))];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === "Todos" || ex.target_muscle === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const categories = [
    "Pecho",
    "Espalda",
    "Hombros",
    "Brazos",
    "Piernas",
    "Core",
    "Cuerpo Completo",
    "Cardio",
    "Otros"
  ];

  const groupedExercises: Record<string, Exercise[]> = {};
  categories.forEach(c => groupedExercises[c] = []);
  
  filteredExercises.forEach(ex => {
    const c = categories.find(cat => cat.toLowerCase() === ex.target_muscle?.toLowerCase());
    if (c) {
      groupedExercises[c].push(ex);
    } else {
      groupedExercises["Otros"].push(ex);
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Ejercicios</h1>
          <p className="text-neutral-400 mt-1">Gestiona todos los ejercicios disponibles para tus clientes.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Añadir Ejercicio
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="relative md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
          >
            {muscles.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
          <Dumbbell className="text-neutral-600 mb-4" size={48} />
          <h3 className="text-xl font-medium text-neutral-300">No se encontraron ejercicios</h3>
          <p className="text-neutral-500 mt-2">Prueba cambiando los filtros o añade uno nuevo.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {categories.map((category) => {
            const categoryExercises = groupedExercises[category];
            if (!categoryExercises || categoryExercises.length === 0) return null;
            
            return (
              <div key={category} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-2xl font-bold text-white border-b border-neutral-800 pb-2">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryExercises.map((exercise) => (
                    <div key={exercise.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all group flex flex-col shadow-lg">
                      
                      {/* Media Preview */}
                      <div className="aspect-video bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                        {exercise.video_url ? (
                          exercise.video_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={exercise.video_url} alt={exercise.name} className="w-full h-full object-cover" />
                          ) : (
                            <video src={exercise.video_url} className="w-full h-full object-cover" />
                          )
                        ) : (
                          <Dumbbell className="text-neutral-800" size={48} />
                        )}
                        
                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button onClick={() => handleEdit(exercise)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(exercise.id)} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-lg leading-tight line-clamp-1">{exercise.name}</h3>
                          <span className="text-xs font-medium px-2 py-1 bg-neutral-800 text-neutral-300 rounded-md whitespace-nowrap">
                            {exercise.target_muscle}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-400 line-clamp-2 mt-auto">
                          {exercise.description || "Sin descripción..."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ExerciseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchExercises}
        exerciseToEdit={exerciseToEdit}
      />
    </div>
  );
}
