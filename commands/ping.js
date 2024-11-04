import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping OpenAI API and Discord to check their statuses"),
  async execute(interaction) {
    await interaction.deferReply();

    const pingOpenAI = async () => {
      const start = Date.now();
      try {
        await fetch("https://api.openai.com/v1");
        const latency = Date.now() - start;
        return `Latency: ${latency}ms`;
      } catch (error) {
        const latency = Date.now() - start;
        return `Latency: ${latency}ms`;
      }
    };

    const pingDiscord = async () => {
      const start = Date.now();
      try {
        await fetch("https://discord.com/api/v10");
        const latency = Date.now() - start;
        return `Latency: ${latency}ms`;
      } catch (error) {
        const latency = Date.now() - start;
        return `Latency: ${latency}ms`;
      }
    };

    const [openAIStatus, discordStatus] = await Promise.all([
      pingOpenAI(),
      pingDiscord(),
    ]);

    const embed = new EmbedBuilder()
      .setTitle("API Latency")
      .addFields(
        { name: "OpenAI API", value: openAIStatus, inline: true },
        { name: "Discord API", value: discordStatus, inline: true }
      )
      .setColor(0x00ae86);

    await interaction.editReply({ embeds: [embed] });
  },
};
