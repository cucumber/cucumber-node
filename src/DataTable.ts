/**
 * Represents the cells of a Gherkin data table associated with a test step.
 * @public
 * @remarks
 * For steps that include a data table, an instance of this will be injected as the last
 * argument to your step function.
 */
export class DataTable {
  constructor(private readonly cells: ReadonlyArray<ReadonlyArray<string>>) {}

  /**
   * Returns a copy of the raw cells, as a two-dimensional array.
   */
  raw(): ReadonlyArray<ReadonlyArray<string>> {
    return structuredClone(this.cells)
  }

  /**
   * Returns an array, with each item representing a row of the table as key/value
   * pairs using the header row for keys.
   */
  hashes(): ReadonlyArray<Record<string, string>> {
    const [keys, ...rows] = this.raw()
    return rows.map((row) => {
      return row.reduce((acc, value, index) => {
        return {
          ...acc,
          [keys[index]]: value,
        }
      }, {})
    })
  }

  /**
   * Returns an array, with each item being a cell value from the first/only column.
   * @remarks
   * For use with single-column data tables that represent a simple list.
   */
  list(): ReadonlyArray<string> {
    return this.cells.map(([cell]) => cell)
  }

  /**
   * Returns a fresh data table instance based on the cells being transposed.
   */
  transpose(): DataTable {
    return new DataTable(this.cells[0].map((x, i) => this.cells.map((y) => y[i])))
  }
}
