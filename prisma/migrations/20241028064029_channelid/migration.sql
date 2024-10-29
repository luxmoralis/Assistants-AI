/*
  Warnings:

  - Added the required column `channelID` to the `ConversationThread` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConversationThread" ADD COLUMN     "channelID" TEXT NOT NULL;
