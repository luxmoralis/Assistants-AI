import * as gpt from "../functions/gpt.js";
import * as database from "../functions/database.js";
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { deleteOpenAIClient } from "../functions/gpt.js";

export default {
  data: new SlashCommandBuilder()
    .setName("openai")
    .setDescription("Manage OpenAI settings and models")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("registerkey")
        .setDescription("Register an OpenAI API key to the discord server.")
        .addStringOption((option) =>
          option
            .setName("apikey")
            .setDescription("The OpenAI API key")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("models")
        .setDescription(
          "Get the available models from the registered OpenAI API Key"
        )
    ),
  execute: async (interaction) => {
    const discordServer = await database.getOrCreateDiscordServer(
      interaction.guild.id
    );

    if (interaction.options.getSubcommand() === "registerkey") {
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Permission Denied")
              .setDescription(
                "You do not have permission to use this command."
              ),
          ],
        });
        return;
      }
      const apiKey = interaction.options.getString("apikey");
      const existingApiKey = await database.getApiKey(discordServer.id);
      if (existingApiKey.apiKey) {
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
          embeds: [
            new EmbedBuilder()
              .setTitle("Update API Key")
              .setDescription(
                "An API key is already registered. Do you want to update it?"
              ),
          ],
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
          const embed = new EmbedBuilder()
            .setTitle(i.customId === "confirm" ? "Success" : "Cancelled")
            .setDescription(
              i.customId === "confirm"
                ? "API key updated successfully!"
                : "API key update cancelled."
            );
          if (i.customId === "confirm") {
            await database.createApiKey(discordServer.id, apiKey);
            deleteOpenAIClient(discordServer.id);
          }
          await i.update({ embeds: [embed], components: [] });
        });

        collector.on("end", (collected) => {
          if (collected.size === 0) {
            interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Cancelled")
                  .setDescription("API key update cancelled."),
              ],
            });
          }
        });
      } else {
        await database.createApiKey(discordServer.id, apiKey);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Success")
              .setDescription("API key registered successfully!"),
          ],
        });
      }
    } else if (interaction.options.getSubcommand() === "models") {
      if (!discordServer.apiKey) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription("No API key registered for this server."),
          ],
        });
        return;
      }
      const models = await gpt.getDefaultModels(discordServer.id);
      const embed = new EmbedBuilder()
        .setTitle(models ? "Default Models from OpenAI" : "Error")
        .setDescription(
          models
            ? models.map((model) => `- ${model.id}`).join("\n")
            : "Failed to get models from OpenAI."
        );
      await interaction.reply({ embeds: [embed] });
    }
  },
};
