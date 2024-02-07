// usage: provide a criteriaFn:
//   criteriaFn(key, value) => shouldKeep
//
export function filterObject(obj, criteriaFn, visited = new Set()) {
  // Check for null or non-object types to bypass them
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle cyclic dependencies
  if (visited.has(obj)) {
    return undefined; // Or handle cyclic reference as needed
  }
  visited.add(obj);

  // Use Array.reduce for arrays and Object.entries.reduce for objects
  const isArray = Array.isArray(obj);
  const result = isArray ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    const shouldKeep = isArray ? criteriaFn(null, value) : criteriaFn(key, value);
    // Recurse for objects or arrays, copy directly if criteria does not match
    if (shouldKeep) {
      result[key] = typeof value === 'object' ? filterObject(value, criteriaFn, visited) : value;
    }
  }

  return result;
}