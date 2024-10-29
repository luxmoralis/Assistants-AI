/*
  Warnings:

  - Added the required column `openAIAssistantID` to the `ConversationThread` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConversationThread" ADD COLUMN     "openAIAssistantID" TEXT NOT NULL;
