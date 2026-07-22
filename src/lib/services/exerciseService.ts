import { supabase } from "@/lib/supabaseClient";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  target_muscle: string;
  video_url: string;
  default_sets?: string;
  default_reps?: string;
  created_at: string;
}

export type ExerciseInsert = Omit<Exercise, "id" | "created_at">;

export const exerciseService = {
  // Fetch all exercises
  async getExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from("exercise_library")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }
    return data || [];
  },

  // Add a new exercise
  async addExercise(exercise: ExerciseInsert): Promise<Exercise> {
    const { data, error } = await supabase
      .from("exercise_library")
      .insert([exercise])
      .select()
      .single();

    if (error) {
      console.error("Error adding exercise:", error);
      throw error;
    }
    return data;
  },

  // Update an existing exercise
  async updateExercise(id: string, exercise: Partial<ExerciseInsert>): Promise<Exercise> {
    const { data, error } = await supabase
      .from("exercise_library")
      .update(exercise)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating exercise:", error);
      throw error;
    }
    return data;
  },

  // Delete an exercise
  async deleteExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from("exercise_library")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting exercise:", error);
      throw error;
    }
  },

  // Upload media to exercise-media bucket
  async uploadMedia(file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("exercise-media")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading media:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("exercise-media")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
