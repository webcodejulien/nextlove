/**
 * Formate une date last_seen en étiquette relative courte.
 * Retourne null si la date est trop ancienne (> 30 jours) ou invalide.
 */
export function formatLastSeen(isoDate?: string | null): {
  label: string;
  isOnline: boolean;
  isRecent: boolean;
} | null {
  if (!isoDate) return null;

  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;

  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 5) {
    return { label: 'En ligne', isOnline: true, isRecent: true };
  }
  if (diffMin < 60) {
    return { label: `Actif il y a ${diffMin} min`, isOnline: false, isRecent: true };
  }
  if (diffH < 24) {
    return { label: "Actif aujourd'hui", isOnline: false, isRecent: true };
  }
  if (diffD === 1) {
    return { label: 'Actif hier', isOnline: false, isRecent: true };
  }
  if (diffD < 7) {
    return { label: `Actif il y a ${diffD} jours`, isOnline: false, isRecent: false };
  }
  if (diffD < 30) {
    return { label: 'Actif cette semaine', isOnline: false, isRecent: false };
  }
  return null; // Trop ancien, ne pas afficher
}
