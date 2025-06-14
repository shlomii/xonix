
export class FloodFill {
  floodFill(
    startX: number, 
    startY: number, 
    gridWidth: number, 
    gridHeight: number,
    boundarySet: Set<string>,
    emptySet: Set<string>,
    visited: Set<string>
  ): Set<string> {
    const area = new Set<string>();
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      // Check bounds
      if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
      
      // Skip if already visited
      if (visited.has(key)) continue;
      
      // Skip if it's a boundary (filled cell, trail cell, or border)
      if (boundarySet.has(key)) continue;

      // Mark as visited and add to area
      visited.add(key);
      area.add(key);

      // Add all 4 neighbors to stack
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    return area;
  }
}
