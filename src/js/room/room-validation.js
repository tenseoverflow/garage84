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

  const allowedLocations = ["1. korrus", "2. korrus", "3. korrus"];
  if (!allowedLocations.includes(location)) {
    return "Palun vali asukoht: 1. korrus, 2. korrus või 3. korrus";
  }

  if (capacity <= 0) {
    return "Mahutavus peab olema positiivne number";
  }

  return null;
}
