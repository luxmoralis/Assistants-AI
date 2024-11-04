import * as gpt from "../functions/gpt.js";
import * as database from "../functions/database.js";
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("assistants")
    .setDescription("Manage OpenAI assistants")
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List available assistants")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new assistant with the OpenAI API")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete an assistant with the OpenAI API")
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

    if (interaction.options.getSubcommand() === "list") {
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

      const assistantList = assistants
        .map((assistant) => `- ${assistant.name || assistant.id}`)
        .join("\n");
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Available Assistants")
            .setDescription(
              `Here are the available assistants from OpenAI:\n${assistantList}`
            ),
        ],
      });
    } else if (interaction.options.getSubcommand() === "create") {
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

      // Create the modal for Assistant Name and Instruction
      const modal = new ModalBuilder()
        .setCustomId("createAssistantModal")
        .setTitle("Create Assistant");

      const assistantNameInput = new TextInputBuilder()
        .setCustomId("assistantName")
        .setLabel("Assistant Name")
        .setStyle(TextInputStyle.Short);

      const instructionInput = new TextInputBuilder()
        .setCustomId("instruction")
        .setLabel("Instruction")
        .setStyle(TextInputStyle.Paragraph);

      const firstActionRow = new ActionRowBuilder().addComponents(
        assistantNameInput
      );
      const secondActionRow = new ActionRowBuilder().addComponents(
        instructionInput
      );

      modal.addComponents(firstActionRow, secondActionRow);

      await interaction.showModal(modal);

      const filter = (i) =>
        i.customId === "createAssistantModal" &&
        i.user.id === interaction.user.id;
      const submitted = await interaction.awaitModalSubmit({
        filter,
        time: 60000,
      });

      const assistantName = submitted.fields.getTextInputValue("assistantName");
      const instruction = submitted.fields.getTextInputValue("instruction");

      // Get available models for the guild
      const availableModels = await gpt.getDefaultModels(discordServer.id);

      // Create the select menu for Model
      const modelOptions = availableModels.map((model) => ({
        label: model.id,
        value: model.id,
      }));

      const modelSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("selectModel")
        .setPlaceholder("Select a Model")
        .addOptions(modelOptions);

      const modelActionRow = new ActionRowBuilder().addComponents(
        modelSelectMenu
      );

      await submitted.deferReply(); // Acknowledge the interaction

      await submitted.followUp({
        embeds: [
          new EmbedBuilder()
            .setTitle("Model Selection")
            .setDescription("Please select a model for the assistant:"),
        ],
        components: [modelActionRow],
      });

      const modelSelectFilter = (i) =>
        i.customId === "selectModel" && i.user.id === interaction.user.id;
      const modelSelected = await interaction.channel.awaitMessageComponent({
        filter: modelSelectFilter,
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      const selectedModel = modelSelected.values[0];

      // Create the multi-select menu for Tools
      const toolOptions = [
        { label: "Code Interpreter", value: "code_interpreter" },
        { label: "File Search", value: "file_search" },
      ];

      const toolSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("selectTools")
        .setPlaceholder("Select Tools")
        .setMinValues(1)
        .setMaxValues(toolOptions.length)
        .addOptions(toolOptions);

      const toolActionRow = new ActionRowBuilder().addComponents(
        toolSelectMenu
      );

      await modelSelected.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("Tool Selection")
            .setDescription("Please select tools for the assistant:"),
        ],
        components: [toolActionRow],
      });

      const toolSelectFilter = (i) =>
        i.customId === "selectTools" && i.user.id === interaction.user.id;
      const toolsSelected = await interaction.channel.awaitMessageComponent({
        filter: toolSelectFilter,
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      const selectedTools = toolsSelected.values.map((tool) => ({
        type: tool,
      }));

      await gpt.createAssistant(
        discordServer.id,
        assistantName,
        instruction,
        selectedTools,
        selectedModel
      );

      await toolsSelected.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("Success")
            .setDescription("Assistant created successfully!"),
        ],
        components: [],
      });
    } else if (interaction.options.getSubcommand() === "delete") {
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

      const assistantOptions = assistants.map((assistant) => ({
        label: assistant.name || assistant.id,
        value: assistant.id,
      }));

      const assistantSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("selectAssistantToDelete")
        .setPlaceholder("Select an Assistant to Delete")
        .addOptions(assistantOptions);

      const assistantActionRow = new ActionRowBuilder().addComponents(
        assistantSelectMenu
      );

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Delete Assistant")
            .setDescription("Please select an assistant to delete:"),
        ],
        components: [assistantActionRow],
      });

      const assistantSelectFilter = (i) =>
        i.customId === "selectAssistantToDelete" &&
        i.user.id === interaction.user.id;
      const assistantSelected = await interaction.channel.awaitMessageComponent(
        {
          filter: assistantSelectFilter,
          componentType: ComponentType.StringSelect,
          time: 60000,
        }
      );

      const assistantId = assistantSelected.values[0];
      const success = await gpt.deleteAssistant(discordServer.id, assistantId);

      if (success) {
        await assistantSelected.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Success")
              .setDescription(
                `Assistant with ID ${assistantId} deleted successfully!`
              ),
          ],
          components: [],
        });
      } else {
        await assistantSelected.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription(
                `Failed to delete assistant with ID ${assistantId}.`
              ),
          ],
          components: [],
        });
      }
    }
  },
};
