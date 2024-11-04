import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Provides information about available commands"),
  async execute(interaction) {
    const commands = interaction.client.commands.map((cmd) => cmd.data);
    const commandList = commands
      .map((cmd) => `**/${cmd.name}** - ${cmd.description}\n`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("Help - Available Commands")
      .setDescription(
        `Here are the available commands you can use:\n\n${commandList}`
      )
      .setColor(0x00ae86);

    await interaction.reply({ embeds: [embed] });
  },
};
