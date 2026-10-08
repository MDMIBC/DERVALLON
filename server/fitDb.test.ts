import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { fitQueries, isDuplicateEntry } from "./fitDb";

const db = drizzle.mock();

describe("fit profile queries", () => {
  it("scopes every read and delete to the customer's own user id", () => {
    const statements = [
      fitQueries.records(db, 42, 10).toSQL(),
      fitQueries.latest(db, 42).toSQL(),
      fitQueries.version(db, 42, 3).toSQL(),
      fitQueries.preferences(db, 42).toSQL(),
      fitQueries.removeRecords(db, 42).toSQL(),
      fitQueries.removePreferences(db, 42).toSQL(),
      fitQueries.removeLegacyProfile(db, 42).toSQL(),
    ];
    for (const statement of statements) {
      expect(statement.sql).toMatch(/where .*`userId` = \?/);
      expect(statement.params[0]).toBe(42);
    }
  });

  it("orders history newest version first and bounds it", () => {
    const statement = fitQueries.records(db, 42, 10).toSQL();
    expect(statement.sql).toMatch(/order by `fit_measurement_records`.`version` desc limit \?/);
    expect(statement.params).toEqual([42, 10]);
  });

  it("recognises duplicate version races directly or when wrapped by the driver", () => {
    expect(isDuplicateEntry({ code: "ER_DUP_ENTRY" })).toBe(true);
    expect(isDuplicateEntry({ cause: { code: "ER_DUP_ENTRY" } })).toBe(true);
    expect(isDuplicateEntry(new Error("other"))).toBe(false);
  });
});
