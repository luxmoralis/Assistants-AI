import * as gpt from "../functions/gpt.js";
import * as database from "../functions/database.js";
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("assistants")
    .setDescription(
      "Get the available assistants from the registered OpenAI API Key"
    ),
  async execute(interaction) {
    const discordServer = await database.getOrCreateDiscordServer(
      interaction.guild.id
    );

    if (!discordServer.apiKey) {
      return interaction.reply("No API key registered for this server.");
    }

    const assistants = await gpt.getAssistants(discordServer.id);

    if (!assistants) {
      return interaction.reply("Failed to get assistants from OpenAI.");
    }

    const assistantList = assistants
      .map((assistant) => `- ${assistant.name || assistant.id}`)
      .join("\n");
    await interaction.reply(
      `Here are the available assistants from OpenAI:\n${assistantList}`
    );
  },
};
