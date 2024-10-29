/*
  Warnings:

  - You are about to drop the `OpenAIAPIKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OpenAIAPIKey" DROP CONSTRAINT "OpenAIAPIKey_discordServerId_fkey";

-- AlterTable
ALTER TABLE "DiscordServer" ADD COLUMN     "apiKey" TEXT;

-- DropTable
DROP TABLE "OpenAIAPIKey";
