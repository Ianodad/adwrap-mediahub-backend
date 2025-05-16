/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,displayId]` on the table `MediaItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MediaItem_displayId_key";

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_workspaceId_displayId_key" ON "MediaItem"("workspaceId", "displayId");
