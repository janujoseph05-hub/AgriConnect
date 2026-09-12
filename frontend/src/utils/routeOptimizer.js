const round = (value, decimals = 1) => Number(value.toFixed(decimals))

function routeDistance(route, distanceBetween) {
  return route.slice(0, -1).reduce(
    (total, location, index) => total + distanceBetween(location, route[index + 1]),
    0,
  )
}

function nearestNeighbor(start, locations, distanceBetween) {
  const remaining = [...locations]
  const route = [start]
  let current = start

  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestDistance = distanceBetween(current, remaining[0])

    remaining.forEach((location, index) => {
      const distance = distanceBetween(current, location)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    const [nearest] = remaining.splice(nearestIndex, 1)
    route.push(nearest)
    current = nearest
  }

  return route
}

function twoOpt(route, distanceBetween) {
  let bestRoute = [...route]
  let bestDistance = routeDistance(bestRoute, distanceBetween)
  let improved = true

  while (improved) {
    improved = false

    for (let start = 1; start < bestRoute.length - 2; start += 1) {
      for (let end = start + 1; end < bestRoute.length - 1; end += 1) {
        const candidate = [
          ...bestRoute.slice(0, start),
          ...bestRoute.slice(start, end + 1).reverse(),
          ...bestRoute.slice(end + 1),
        ]
        const candidateDistance = routeDistance(candidate, distanceBetween)

        if (candidateDistance + 0.0001 < bestDistance) {
          bestRoute = candidate
          bestDistance = candidateDistance
          improved = true
        }
      }
    }
  }

  return { route: bestRoute, distance: bestDistance }
}

/**
 * Optimize a route that starts at a depot and visits each location once.
 * The caller supplies prototype or real distances through distanceBetween.
 */
export function optimizeRoute({ start, locations, distanceBetween, averageSpeedKph = 40 }) {
  if (!start) throw new Error('A route starting location is required.')
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error('At least one delivery location is required.')
  }
  if (typeof distanceBetween !== 'function') {
    throw new Error('A distanceBetween function is required.')
  }

  const originalRoute = [start, ...locations]
  const originalDistance = routeDistance(originalRoute, distanceBetween)
  const initialRoute = nearestNeighbor(start, locations, distanceBetween)
  const optimized = twoOpt(initialRoute, distanceBetween)
  const distanceSaved = Math.max(0, originalDistance - optimized.distance)
  const originalTimeMinutes = (originalDistance / averageSpeedKph) * 60
  const optimizedTimeMinutes = (optimized.distance / averageSpeedKph) * 60

  return {
    originalRoute,
    optimizedRoute: optimized.route,
    originalDistance: round(originalDistance),
    optimizedDistance: round(optimized.distance),
    distanceSaved: round(distanceSaved),
    originalTimeMinutes: Math.round(originalTimeMinutes),
    optimizedTimeMinutes: Math.round(optimizedTimeMinutes),
    timeSavedMinutes: Math.max(0, Math.round(originalTimeMinutes - optimizedTimeMinutes)),
  }
}
