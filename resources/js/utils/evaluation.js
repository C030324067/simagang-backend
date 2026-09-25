export function calculateFinalScore({ attendancePercentage = 0, taskAverage = 0, discipline = 0, responsibility = 0, quality = 0, teamwork = 0 }) {
  const mentorAverage = (Number(discipline) + Number(responsibility) + Number(quality) + Number(teamwork)) / 4;
  return Math.round((Number(attendancePercentage) * 0.2 + Number(taskAverage) * 0.4 + mentorAverage * 0.4) * 100) / 100;
}

export function getGrade(score) {
  if (Number(score) >= 85) return 'A';
  if (Number(score) >= 70) return 'B';
  return 'C';
}
