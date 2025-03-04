import { Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { logger } from "../logger.js";

export default {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    try {
      if (!interaction.isCommand()) return;
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.warn(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }
      await interaction.deferReply();
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing ${interaction.commandName}`);
      logger.error(error);
      await interaction.editReply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
