-- Add chapter_timestamps column to audio_tracks
ALTER TABLE audio_tracks 
ADD COLUMN chapter_timestamps JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN audio_tracks.chapter_timestamps IS 'Array of objects with chapter_number and timestamp_seconds for navigation within audio';

-- Example structure: [{"chapter": 1, "time": 0}, {"chapter": 2, "time": 125}, ...]