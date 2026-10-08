import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { designQueries } from "./designsDb";

const db = drizzle.mock();

describe("saved design queries", () => {
  it("scopes every list, read and delete to the customer's own user id", () => {
    const statements = [
      designQueries.list(db, 42).toSQL(),
      designQueries.get(db, 42, 7).toSQL(),
      designQueries.remove(db, 42, 7).toSQL(),
    ];
    for (const statement of statements) {
      expect(statement.sql).toMatch(/where .*`saved_designs`.`userId` = \?/);
      expect(statement.params[0]).toBe(42);
    }
  });

  it("only updates a design when both the id and the owner match", () => {
    const statement = designQueries.update(db, 42, 7, { title: "Jacket direction", payload: { kind: "studio", notes: "" } }).toSQL();
    expect(statement.sql).toMatch(/where \(`saved_designs`.`userId` = \? and `saved_designs`.`id` = \?\)/);
    expect(statement.params.slice(-2)).toEqual([42, 7]);
  });

  it("lists the newest designs first and bounds the list", () => {
    const statement = designQueries.list(db, 42).toSQL();
    expect(statement.sql).toMatch(/order by `saved_designs`.`updatedAt` desc, `saved_designs`.`id` desc limit \?/);
  });
});
