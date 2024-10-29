import * as database from "../functions/database.js";
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import { deleteOpenAIClient } from "../functions/gpt.js";

export default {
  data: new SlashCommandBuilder()
    .setName("registerkey")
    .setDescription("Register an OpenAI API key to the discord server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("apikey")
        .setDescription("The OpenAI API key")
        .setRequired(true)
    ),
  async execute(interaction) {
    const apiKey = interaction.options.getString("apikey");
    const discordServer = await database.getOrCreateDiscordServer(
      interaction.guild.id
    );
    const existingApiKey = await database.getApiKey(discordServer.id);
    if (existingApiKey.apiKey) {
      await handleExistingApiKey(interaction, discordServer.id, apiKey);
    } else {
      await database.createApiKey(discordServer.id, apiKey);
      await interaction.reply("API key registered successfully!");
    }
  },
};

async function handleExistingApiKey(interaction, serverId, newApiKey) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Yes")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("No")
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    content: "An API key is already registered. Do you want to update it?",
    components: [row],
  });

  const filter = (i) =>
    i.user.id === interaction.user.id &&
    ["confirm", "cancel"].includes(i.customId);

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 15000,
    max: 1,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "confirm") {
      await database.createApiKey(serverId, newApiKey);
      await i.update({
        content: "API key updated successfully!",
        components: [],
      });
      deleteOpenAIClient(serverId);
    } else {
      await i.update({ content: "API key update cancelled.", components: [] });
    }
  });

  collector.on("end", (collected) => {
    if (collected.size === 0) {
      interaction.followUp("API key update cancelled.");
    }
  });
}
