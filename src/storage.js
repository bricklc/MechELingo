const progressKey = 'mechelingo-progress';
const defaultProgress = {
  completedLessons: 0,
  streak: 0,
  soundEnabled: true,
};

export const loadProgress = () => {
  const rawProgress = localStorage.getItem(progressKey);
  if (!rawProgress) return defaultProgress;

  try {
    return { ...defaultProgress, ...JSON.parse(rawProgress) };
  } catch {
    return defaultProgress;
  }
};

export const saveProgress = (progress) => {
  localStorage.setItem(progressKey, JSON.stringify(progress));
};

export const completeLesson = (progress) => {
  const today = new Date().toISOString().slice(0, 10);
  const nextProgress = {
    ...progress,
    completedLessons: progress.completedLessons + 1,
    streak: progress.lastCompletedDate === today ? progress.streak : progress.streak + 1,
    lastCompletedDate: today,
  };

  saveProgress(nextProgress);
  return nextProgress;
};
