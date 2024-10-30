import * as gpt from "../functions/gpt.js";
import * as database from "../functions/database.js";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("threads")
    .setDescription("Manage threads")
    .addSubcommand((subcommand) =>
      subcommand.setName("start").setDescription("Start a new thread")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("clear").setDescription("Clear all threads")
    ),
  async execute(interaction) {
    const discordServer = await database.getOrCreateDiscordServer(
      interaction.guild.id
    );

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

    if (interaction.options.getSubcommand() === "start") {
      const assistants = await gpt.getAssistants(discordServer.id);

      if (!assistants) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription("Failed to get assistants from OpenAI."),
          ],
        });
        return;
      }

      const assistantList = assistants.map((assistant) => ({
        label: assistant.name || assistant.id,
        value: assistant.id,
      }));

      const response = await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Assistant Selection")
            .setDescription("Please select an assistant to start a new thread"),
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 3,
                custom_id: "assistant",
                options: assistantList,
                placeholder: "Select an assistant",
              },
            ],
          },
        ],
        fetchReply: true,
      });

      const collectorFilter = (i) => i.user.id === interaction.user.id;

      try {
        const confirmation = await response.awaitMessageComponent({
          filter: collectorFilter,
          time: 60_000,
        });

        const assistantId = confirmation.values[0];
        const assistant = assistants.find((a) => a.id === assistantId);

        const thread = await gpt.createThread(discordServer.id);
        const channel = await interaction.channel.threads.create({
          name: `${assistant.name || assistant.id} by ${
            interaction.user.username
          }`,
          autoArchiveDuration: 1440,
        });

        await database.createConversationThread(
          discordServer.id,
          thread.id,
          channel.id,
          assistant.id
        );

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Thread Created")
              .setDescription(
                `Thread Created: ${assistant.name} by ${interaction.user.username}. Send a message in the thread to start the conversation. You can join the thread here: ${channel.url}`
              ),
          ],
          components: [],
        });
      } catch (e) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription(
                "You didn't select an assistant or enter a prompt in time"
              ),
          ],
          components: [], // Remove components to hide the selection menu
        });
      }
    } else if (interaction.options.getSubcommand() === "clear") {
      await interaction.deferReply();

      const threads = await database.getConversationThreadsByServerId(
        discordServer.id
      );

      for (const thread of threads) {
        const channel = await interaction.guild.channels.cache.get(
          thread.channelID
        );
        if (channel) {
          await channel.delete();
        }
      }

      // Clear all threads from openai
      for (const thread of threads) {
        await gpt.deleteThread(discordServer.id, thread.openAIThreadID);
      }

      await database.deleteAllConversationThreads(discordServer.id);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Success")
            .setDescription("All threads cleared successfully."),
        ],
      });
    }
  },
};
