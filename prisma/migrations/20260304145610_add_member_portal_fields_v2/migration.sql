-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "dob" DATETIME,
    "gender" TEXT,
    "address" TEXT,
    "photoUrl" TEXT,
    "emergencyContact" TEXT,
    "joinedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "goalProgress" REAL NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("address", "createdAt", "dob", "email", "emergencyContact", "gender", "id", "joinedDate", "name", "notes", "phone", "photoUrl", "status", "updatedAt") SELECT "address", "createdAt", "dob", "email", "emergencyContact", "gender", "id", "joinedDate", "name", "notes", "phone", "photoUrl", "status", "updatedAt" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_phone_key" ON "Member"("phone");
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
