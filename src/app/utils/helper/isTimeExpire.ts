export const isTimeExpired = (expiryTime: string | Date): boolean => {
  const now = new Date();
  const expiryDate =
    typeof expiryTime === "string" ? new Date(expiryTime) : expiryTime;

  // If expiryDate is invalid, consider expired (optional)
  if (isNaN(expiryDate.getTime())) {
    return true;
  }

  return expiryDate <= now;
};
