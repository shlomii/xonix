
export class FloodFill {
  floodFill(
    startX: number, 
    startY: number, 
    gridWidth: number, 
    gridHeight: number,
    filledCells: Set<string>,
    trailSet: Set<string>,
    visited: Set<string>
  ): Set<string> {
    const area = new Set<string>();
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
      if (visited.has(key)) continue;
      if (filledCells.has(key) || trailSet.has(key)) continue;

      visited.add(key);
      area.add(key);

      // Add neighbors to stack
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    return area;
  }
}
