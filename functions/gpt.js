import OpenAI from "openai";
import { getApiKey } from "./database.js";

const openaiClients = new Map();

// Function to get or create the OpenAI API client for a Discord server
export async function getOrCreateOpenAIClient(discordServerId) {
  let client = openaiClients.get(discordServerId);
  if (!client) {
    const apiKey = await getApiKey(discordServerId);
    if (!apiKey) {
      return null;
    }
    client = new OpenAI({
      apiKey: apiKey.apiKey,
    });
    openaiClients.set(discordServerId, client);
  }
  return client;
}

// Function to delete the OpenAI API client for a Discord server
export function deleteOpenAIClient(discordServerId) {
  openaiClients.delete(discordServerId);
}

// Function to get the default models from OpenAI for a Discord server
export async function getDefaultModels(discordServerId) {
  const client = await getOrCreateOpenAIClient(discordServerId);
  const models = await client.models.list();
  return models.data
    .filter((model) => model.id.startsWith("gpt-"))
    .filter((model) => !model.id.includes("audio"))
    .filter((model) => !model.id.includes("realtime"))
    .filter((model) => !model.id.includes("instruct"));
}

// Function to get the available assistants from OpenAI for a Discord server
export async function getAssistants(discordServerId) {
  const client = await getOrCreateOpenAIClient(discordServerId);
  const assistants = await client.beta.assistants.list();
  return assistants.data;
}

// Function to create an assistant with OpenAI for a Discord server
export async function createAssistant(
  discordServerId,
  assistantName,
  instructions,
  tools,
  model
) {
  const client = await getOrCreateOpenAIClient(discordServerId);
  const assistant = await client.beta.assistants.create({
    name: assistantName,
    instructions: instructions,
    tools: tools,
    model: model,
  });
  return assistant;
}

// Function to delete an assistant with OpenAI for a Discord server
export async function deleteAssistant(discordServerId, assistantId) {
  const client = await getOrCreateOpenAIClient(discordServerId);
  try {
    await client.beta.assistants.del(assistantId);
    return true;
  } catch (error) {
    console.error(`Failed to delete assistant: ${error}`);
    return false;
  }
}

// Function to create a thread and send a message with OpenAI for a Discord server
export async function createThread(discordServerId) {
  const client = await getOrCreateOpenAIClient(discordServerId);
  const thread = await client.beta.threads.create();
  return thread;
}

// Function to delete a thread with OpenAI for a Discord server
export async function deleteThread(discordServerId, threadId) {
  const client = await getOrCreateOpenAIClient(discordServerId);
  const response = await client.beta.threads.del(threadId);
  return response;
}

// Function to add a message to a thread with OpenAI for a Discord server
export async function addMessage(discordServerId, threadId, message) {
  const client = await getOrCreateOpenAIClient(discordServerId);
  const response = await client.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });
  return response;
}

// Function to run a completion with OpenAI for a Discord server
export async function runCompletion(discordServerId, threadId, assistantId) {
  const client = await getOrCreateOpenAIClient(discordServerId);
  const stream = await client.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    stream: true,
  });

  let message = "";
  for await (const event of stream) {
    if (event.event === "thread.message.delta" && event.data.delta.content) {
      message += event.data.delta.content
        .map((content) => content.text.value)
        .join("");
    }
  }
  return message;
}
