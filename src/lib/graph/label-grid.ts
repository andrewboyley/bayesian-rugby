/**
 * Sigma's LabelGrid hides nodes stored in negative cell coordinates.
 * Sigma recreates the LabelGrid on every full refresh (clearNodeIndices ->
 * resetLabelGrid), so an instance patch is discarded. Patching the shared
 * prototype ensures the fix survives refreshes. Returns all labels in the grid,
 * without the row/column clamp.
 */

export interface LabelGridLike {
  cellSize: number;
  columns: number;
  rows: number;
  cells: Record<number, { key: string; size: number }[]>;
  getLabelsToDisplay: (
    ratio: number,
    density: number,
    viewport?: { x1: number; y1: number; x2: number; y2: number },
  ) => string[];
}

export function patchLabelGridQuery(renderer: unknown): void {
  const labelGrid = (renderer as { labelRenderer: { labelGrid: LabelGridLike } }).labelRenderer
    .labelGrid;
  const prototype = Object.getPrototypeOf(labelGrid) as {
    getLabelsToDisplay: LabelGridLike["getLabelsToDisplay"];
  };
  prototype.getLabelsToDisplay = function (this: LabelGridLike, ratio, density, viewport) {
    const labelsToDisplayPerCell = Math.ceil(density / (ratio * ratio));
    const labels: string[] = [];
    if (viewport) {
      const minRow = Math.floor(viewport.y1 / this.cellSize);
      const maxRow = Math.floor(viewport.y2 / this.cellSize);
      const minCol = Math.floor(viewport.x1 / this.cellSize);
      const maxCol = Math.floor(viewport.x2 / this.cellSize);
      for (let row = minRow; row <= maxRow; row += 1) {
        for (let col = minCol; col <= maxCol; col += 1) {
          const cell = this.cells[row * this.columns + col];
          if (!cell) continue;
          for (let i = 0; i < Math.min(labelsToDisplayPerCell, cell.length); i += 1) {
            labels.push(cell[i].key);
          }
        }
      }
    } else {
      for (const key in this.cells) {
        const cell = this.cells[Number(key)];
        for (let i = 0; i < Math.min(labelsToDisplayPerCell, cell.length); i += 1) {
          labels.push(cell[i].key);
        }
      }
    }
    return labels;
  };
}
