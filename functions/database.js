import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureConnection() {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    throw error;
  }
}

// Function to get or create a Discord server by guildID
export async function getOrCreateDiscordServer(guildID) {
  await ensureConnection();
  let discordServer = await prisma.discordServer.findUnique({
    where: {
      guildID: guildID,
    },
    include: {
      conversationThreads: true,
    },
  });
  if (!discordServer) {
    await prisma.discordServer.create({
      data: {
        guildID: guildID,
      },
      include: {
        conversationThreads: true,
      },
    });
    discordServer = await prisma.discordServer.findUnique({
      where: {
        guildID: guildID,
      },
      include: {
        conversationThreads: true,
      },
    });
  }
  return discordServer;
}

// Function to create a new OpenAI API key for a Discord server
export async function createApiKey(discordServerId, key) {
  await ensureConnection();
  return await prisma.discordServer.update({
    where: {
      id: discordServerId,
    },
    data: {
      apiKey: {
        set: key,
      },
    },
  });
}

// Function to create a new conversation thread for a Discord server
export async function createConversationThread(
  discordServerId,
  openAIThreadID,
  channelID,
  openAIAssistantID
) {
  await ensureConnection();
  return await prisma.conversationThread.create({
    data: {
      channelID: channelID,
      openAIThreadID: openAIThreadID,
      discordServerId: discordServerId,
      openAIAssistantID: openAIAssistantID,
    },
  });
}

// Function to get all conversation threads for a Discord server
export async function getConversationThreadsByServerId(discordServerId) {
  await ensureConnection();
  return await prisma.conversationThread.findMany({
    where: {
      discordServerId: discordServerId,
    },
  });
}

// Function to change the channel ID of a conversation thread
export async function updateConversationThreadChannelID(
  threadId,
  newChannelID
) {
  await ensureConnection();
  return await prisma.conversationThread.update({
    where: {
      id: threadId,
    },
    data: {
      channelID: newChannelID,
    },
  });
}

// Function to get the conversation thread by channel ID
export async function getConversationThreadByChannelID(channelID) {
  await ensureConnection();
  return await prisma.conversationThread.findFirst({
    where: {
      channelID: channelID,
    },
  });
}

// Function to delete all conversation threads for a Discord server
export async function deleteAllConversationThreads(discordServerId) {
  await ensureConnection();
  return await prisma.conversationThread.deleteMany({
    where: {
      discordServerId: discordServerId,
    },
  });
}

// Function to get the OpenAI API key for a Discord server
export async function getApiKey(discordServerId) {
  await ensureConnection();
  return await prisma.discordServer.findUnique({
    where: {
      id: discordServerId,
    },
    select: {
      apiKey: true,
    },
  });
}
