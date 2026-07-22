"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, Link as LinkIcon } from "lucide-react";
import { exerciseService, ExerciseInsert, Exercise } from "@/lib/services/exerciseService";

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  exerciseToEdit?: Exercise | null;
}

const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Brazos",
  "Piernas",
  "Core",
  "Cuerpo Completo",
  "Cardio",
];

export function ExerciseModal({ isOpen, onClose, onSaved, exerciseToEdit }: ExerciseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExerciseInsert>({
    name: "",
    description: "",
    target_muscle: MUSCLE_GROUPS[0],
    video_url: "",
    default_sets: "",
    default_reps: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (exerciseToEdit) {
      setFormData({
        name: exerciseToEdit.name,
        description: exerciseToEdit.description || "",
        target_muscle: exerciseToEdit.target_muscle || MUSCLE_GROUPS[0],
        video_url: exerciseToEdit.video_url || "",
        default_sets: exerciseToEdit.default_sets || "",
        default_reps: exerciseToEdit.default_reps || "",
      });
      setFile(null);
    } else {
      setFormData({
        name: "",
        description: "",
        target_muscle: MUSCLE_GROUPS[0],
        video_url: "",
        default_sets: "",
        default_reps: "",
      });
      setFile(null);
    }
  }, [exerciseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalVideoUrl = formData.video_url;

      if (file) {
        finalVideoUrl = await exerciseService.uploadMedia(file);
      }

      const exerciseData = {
        ...formData,
        video_url: finalVideoUrl,
      };

      if (exerciseToEdit) {
        await exerciseService.updateExercise(exerciseToEdit.id, exerciseData);
      } else {
        await exerciseService.addExercise(exerciseData);
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Error saving exercise:", error);
      alert(`Hubo un error al guardar el ejercicio: ${error?.message || error?.error_description || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {exerciseToEdit ? "Editar Ejercicio" : "Añadir Nuevo Ejercicio"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form id="exercise-form" onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Nombre del Ejercicio
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ej. Press de Banca"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">
                Series Recomendadas
              </label>
              <input
                type="text"
                value={formData.default_sets}
                onChange={(e) => setFormData({ ...formData, default_sets: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej. 3-4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">
                Repeticiones Recomendadas
              </label>
              <input
                type="text"
                value={formData.default_reps}
                onChange={(e) => setFormData({ ...formData, default_reps: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej. 10-12, Al fallo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-24 resize-none"
              placeholder="Instrucciones del ejercicio..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Grupo Muscular
            </label>
            <select
              value={formData.target_muscle}
              onChange={(e) => setFormData({ ...formData, target_muscle: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 pt-2 border-t border-neutral-800">
            <label className="text-sm font-medium text-neutral-300 block">
              Media (Foto/Video demostración)
            </label>
            
            <div className="space-y-2">
              <p className="text-xs text-neutral-500 uppercase font-semibold">Opción 1: Enlace de YouTube</p>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => {
                    setFormData({ ...formData, video_url: e.target.value });
                    setFile(null); // Si pone un link, quitamos el archivo
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-neutral-800"></div>
              <span className="text-xs text-neutral-500 uppercase font-semibold">O Opción 2</span>
              <div className="flex-1 h-px bg-neutral-800"></div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-neutral-500 uppercase font-semibold">Subir archivo desde el equipo</p>
              <div className={`border-2 border-dashed ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-neutral-800 hover:bg-neutral-800/50'} rounded-xl p-6 text-center transition-colors cursor-pointer relative group`}>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    if (e.target.files?.[0]) {
                      setFormData({ ...formData, video_url: "" }); // Si sube archivo, quitamos el link
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <Upload className={`${file ? 'text-blue-500' : 'text-neutral-500 group-hover:text-white'} transition-colors`} size={28} />
                  <p className={`text-sm ${file ? 'text-blue-400' : 'text-neutral-400 group-hover:text-neutral-300'} transition-colors`}>
                    {file ? file.name : "Haz clic o arrastra un archivo"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 bg-neutral-900 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            form="exercise-form"
            type="submit"
            disabled={isSubmitting || !formData.name}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {exerciseToEdit ? "Guardar Cambios" : "Crear Ejercicio"}
          </button>
        </div>

      </div>
    </div>
  );
}
