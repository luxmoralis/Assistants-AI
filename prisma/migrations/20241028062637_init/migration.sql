-- CreateTable
CREATE TABLE "DiscordServer" (
    "id" SERIAL NOT NULL,
    "guildID" TEXT NOT NULL,

    CONSTRAINT "DiscordServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenAIAPIKey" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "discordServerId" INTEGER NOT NULL,

    CONSTRAINT "OpenAIAPIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationThread" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "discordServerId" INTEGER NOT NULL,

    CONSTRAINT "ConversationThread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordServer_guildID_key" ON "DiscordServer"("guildID");

-- AddForeignKey
ALTER TABLE "OpenAIAPIKey" ADD CONSTRAINT "OpenAIAPIKey_discordServerId_fkey" FOREIGN KEY ("discordServerId") REFERENCES "DiscordServer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationThread" ADD CONSTRAINT "ConversationThread_discordServerId_fkey" FOREIGN KEY ("discordServerId") REFERENCES "DiscordServer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
