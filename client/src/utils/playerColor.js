// Color palette for player names
// Using colors that are readable on white/light backgrounds
const PLAYER_COLORS = [
  '#ef4444', // Red 500
  '#f97316', // Orange 500
  '#f59e0b', // Amber 500
  '#84cc16', // Lime 500
  '#10b981', // Emerald 500
  '#06b6d4', // Cyan 500
  '#3b82f6', // Blue 500
  '#6366f1', // Indigo 500
  '#8b5cf6', // Violet 500
  '#d946ef', // Fuchsia 500
  '#f43f5e', // Rose 500
];

/**
 * Generates a consistent color for a player based on their ID
 * @param {string} id - Player ID
 * @returns {string} Hex color code
 */
export function getPlayerColor(id) {
  if (!id) return '#000000';
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use absolute value to ensure positive index
  const index = Math.abs(hash) % PLAYER_COLORS.length;
  return PLAYER_COLORS[index];
}
