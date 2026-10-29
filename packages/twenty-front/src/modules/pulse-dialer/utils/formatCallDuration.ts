// Same format as logged and imported calls, e.g. "3m 12s".
export const formatCallDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
};
