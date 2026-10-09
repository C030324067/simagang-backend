export function apiErrorMessage(response, fallback) {
  const validationMessages = Object.values(response?.errors || {}).flat().filter(Boolean);
  if (validationMessages.length) return validationMessages.join(' ');
  return response?.message || fallback;
}
