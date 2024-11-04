import { Events } from "discord.js";
import * as database from "../functions/database.js";
import * as gpt from "../functions/gpt.js";

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.channel.isThread()) return;

    const conversationThread = await database.getConversationThreadByChannelID(
      message.channel.id
    );
    if (!conversationThread) return;

    const prompt = message.content;
    await gpt.addMessage(
      conversationThread.discordServerId,
      conversationThread.openAIThreadID,
      prompt
    );

    message.channel.sendTyping();
    const completion = await gpt.runCompletion(
      conversationThread.discordServerId,
      conversationThread.openAIThreadID,
      conversationThread.openAIAssistantID
    );

    if (completion.length > 2000) {
      let remainingCompletion = completion;
      const messages = [];
      while (remainingCompletion.length > 0) {
        const index = remainingCompletion.lastIndexOf("\n", 2000);
        if (index === -1) {
          messages.push(remainingCompletion);
          break;
        }
        messages.push(remainingCompletion.substring(0, index));
        remainingCompletion = remainingCompletion.substring(index + 1);
      }

      for (const messageContent of messages) {
        await message.channel.send(messageContent);
      }
    } else {
      await message.channel.send(completion);
    }
  },
};
