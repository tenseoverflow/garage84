/**
 * Validate room form data
 * @param {object} data - Room data to validate
 * @param {string} data.name - Room name
 * @param {string} data.location - Room location
 * @param {number} data.capacity - Room capacity
 * @returns {string|null} Error message or null if valid
 */
export function validateRoomData({ name, location, capacity }) {
  if (!name || !location) {
    return "Palun täida kõik nõutud väljad";
  }

  if (capacity <= 0) {
    return "Mahutavus peab olema positiivne number";
  }

  return null;
}
