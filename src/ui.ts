import { Cell, Row, Table } from "../deps/@cliffy/table/mod.ts";
import { colors } from "../deps/@cliffy/ansi/mod.ts";

export function double(value?: unknown): Cell {
  return new Cell((value || "").toString()).colSpan(2);
}

export function primary(value: string): string {
  return colors.bold.green(value);
}

const DOUBLE_SIZE_CELLS: (string | number | symbol)[] = ["description"];

function isDoubleSize(name: string | number | symbol): boolean {
  return DOUBLE_SIZE_CELLS.includes(name);
}

function cap(name: string | number | symbol): string {
  const stringed = name.toString();
  return stringed[0].toUpperCase() + stringed.slice(1);
}

export function objToTable<T>(obj: Record<string, T>, columns: (keyof T)[]) {
  const table = new Table().minColWidth(20);
  const header: (string | Cell)[] = ["Name"];

  header.push(...columns.map((c) => isDoubleSize(c) ? double(cap(c)) : cap(c)));
  table.header(Row.from(header).border(true));
  if (Object.keys(obj).length === 0) {
    table.body([Row.from([double("No results.")])]);
  } else {
    for (const name in obj) {
      // deno-lint-ignore no-explicit-any
      const row: (any | Cell)[] = [new Cell(primary(name))];
      for (const col of columns) {
        row.push(isDoubleSize(col) ? double(obj[name][col]) : obj[name][col]);
      }
      table.push(Row.from(row));
    }
  }
  table.sort();
  table.render();
}

// This turns an array of objects
export function listToTable<T>(
  obj: ({ name: string } & T)[],
  columns: (keyof T)[],
) {
  const record = Object.fromEntries(obj.map((o) => [o["name"], o]));
  objToTable(record, columns);
}
