import * as gpt from "../functions/gpt.js";
import * as database from "../functions/database.js";
import { SlashCommandBuilder } from "discord.js";

const getModelsMessage = (models) =>
  models.map((model) => `- ${model.id}`).join("\n");

const fetchModels = async (interaction, discordServer) => {
  const models = await gpt.getDefaultModels(discordServer.id);
  if (!models) {
    await interaction.reply("Failed to get models from OpenAI.");
    return;
  }
  await interaction.reply(
    `Here are the default models from OpenAI:\n${getModelsMessage(models)}`
  );
};

export default {
  data: new SlashCommandBuilder()
    .setName("models")
    .setDescription(
      "Get the available models from the registered OpenAI API Key"
    ),
  async execute(interaction) {
    const discordServer = await database.getOrCreateDiscordServer(
      interaction.guild.id
    );
    if (!discordServer.apiKey) {
      await interaction.reply("No API key registered for this server.");
      return;
    }
    await fetchModels(interaction, discordServer);
  },
};
