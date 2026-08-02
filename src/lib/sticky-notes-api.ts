import { supabase } from '@/lib/supabase';
import type { StickyNote, StickyNoteTargetType } from '@/lib/types';

export async function fetchStickyNotes(
  ownerId: string,
  targetType: StickyNoteTargetType
): Promise<StickyNote[]> {
  const { data, error } = await supabase
    .from('sticky_notes')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('target_type', targetType);
  if (error) throw error;
  return (data ?? []) as StickyNote[];
}

export async function createStickyNote(note: {
  authorId: string;
  ownerId: string;
  targetType: StickyNoteTargetType;
  targetId: string | null;
  positionX: number;
  positionY: number;
  color: string;
  text: string;
}): Promise<StickyNote> {
  const { data, error } = await supabase
    .from('sticky_notes')
    .insert({
      author_id: note.authorId,
      owner_id: note.ownerId,
      target_type: note.targetType,
      target_id: note.targetId,
      position_x: note.positionX,
      position_y: note.positionY,
      color: note.color,
      text: note.text,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as StickyNote;
}

export async function updateStickyNotePosition(
  noteId: string,
  positionX: number,
  positionY: number
): Promise<void> {
  const { error } = await supabase
    .from('sticky_notes')
    .update({ position_x: positionX, position_y: positionY })
    .eq('id', noteId);
  if (error) throw error;
}

export async function deleteStickyNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('sticky_notes').delete().eq('id', noteId);
  if (error) throw error;
}
