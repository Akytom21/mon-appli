import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@pharmasign_video_progress';

type VideoRecord = { watched: boolean; watchedAt: string };
type ProgressMap = Record<string, VideoRecord>;

export function useVideoProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try { setProgress(JSON.parse(raw)); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const markWatched = useCallback(async (videoId: string) => {
    setProgress((prev) => {
      const next: ProgressMap = {
        ...prev,
        [videoId]: { watched: true, watchedAt: new Date().toISOString() },
      };
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWatched = useCallback(
    (videoId: string) => progress[videoId]?.watched === true,
    [progress]
  );

  const watchedCount = Object.values(progress).filter((v) => v.watched).length;

  return { progress, loaded, markWatched, isWatched, watchedCount };
}
