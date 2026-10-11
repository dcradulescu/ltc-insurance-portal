import { getTableColumns, getTableName, is, Table } from "drizzle-orm";
import * as schema from "../drizzle/schema";

/**
 * MySQL JSON columns are returned natively as JS objects by mysql2.
 * MariaDB 11.x declares JSON as LONGTEXT + json_valid(CHECK), which mysql2
 * exposes as type BLOB; Drizzle MySqlJson has no mapFromDriverValue handler.
 * Decode only verified schema JSON column names. Do not parse arbitrary text.
 */
export const knownJsonColumnKeys = new Set<string>();
for (const table of Object.values(schema)) {
  if (!is(table, Table)) continue;
  const tableName=getTableName(table).toLowerCase();
  for (const col of Object.values(getTableColumns(table))) {
    if (col.getSQLType() === "json") {
      knownJsonColumnKeys.add(tableName+"."+col.name.toLowerCase());
    }
  }
}

export interface MysqlTypeCastField {
  type: string;
  table: string;
  name: string;
  string(): string | null;
}
export function decodeMariaDbJsonColumn(
  field:MysqlTypeCastField,
  next:()=>unknown,
): unknown {
  if(field.type!=="BLOB" ||
     !knownJsonColumnKeys.has(field.table.toLowerCase()+"."+field.name.toLowerCase())){
    return next();
  }
  const raw=field.string();
  if(raw===null)return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid database JSON in a known policy or strategy field");
  }
}
