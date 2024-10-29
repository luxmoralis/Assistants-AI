import * as gpt from "../functions/gpt.js";
import * as database from "../functions/database.js";
import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("startthread")
    .setDescription("Start a new thread"),
  async execute(interaction) {
    await interaction.deferReply();

    const discordServer = await database.getOrCreateDiscordServer(
      interaction.guild.id
    );
    const assistants = await gpt.getAssistants(discordServer.id);

    if (!assistants) {
      await interaction.editReply("Failed to get assistants from OpenAI.");
      return;
    }

    const assistantList = assistants.map((assistant) => ({
      label: assistant.name || assistant.id,
      value: assistant.id,
    }));

    const response = await interaction.editReply({
      content: "Please select an assistant to start a new thread",
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
        content: `Thread Created: ${assistant.name} by ${interaction.user.username}. Send a message in the thread to start the conversation. You can join the thread here: ${channel.url}`,
        components: [],
      });
    } catch (e) {
      await interaction.editReply({
        content: "You didn't select an assistant or enter a prompt in time",
        components: [], // Remove components to hide the selection menu
      });
    }
  },
};
