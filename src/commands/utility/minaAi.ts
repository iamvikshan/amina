import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from "discord.js";
import type { Command } from "@structures/Command";
import { Model as AiMemoryModel } from "@src/database/schemas/AiMemory";
import { memoryService } from "@src/services/memoryService";
import Logger from "@helpers/Logger";

const logger = Logger;

const command: Command = {
  name: "mina-ai",
  description: "Manage your memories with Mina AI",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "memories",
        description: "View what Mina remembers about you",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "include-global",
            description: "Include memories from DMs (default: only this server)",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: "forget-me",
        description: "Delete all memories Mina has about you",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "confirm",
            description: "Type 'yes' to confirm deletion",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "Yes, delete all my memories", value: "yes" },
              { name: "No, cancel", value: "no" },
            ],
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "memories") {
      await handleMemories(interaction);
    } else if (sub === "forget-me") {
      await handleForgetMe(interaction);
    }
  },
};

async function handleMemories(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const guildId = interaction.guildId || null;
    const includeGlobal = interaction.options.getBoolean("include-global") ?? false;

    // Build query
    const query: any = { userId };
    if (!includeGlobal) {
      query.guildId = guildId;
    }

    // Fetch memories
    const memories = await AiMemoryModel.find(query)
      .sort({ importance: -1, lastAccessed: -1 })
      .limit(25);

    if (memories.length === 0) {
      const embed = new EmbedBuilder()
        .setColor("#ffaa00")
        .setTitle("🧠 Your Memories")
        .setDescription(
          "I don't have any memories about you yet. Chat with me more and I'll learn about you!"
        )
        .setFooter({ text: "Use /mina-ai forget-me to delete memories anytime" });

      return interaction.editReply({ embeds: [embed] });
    }

    // Group memories by type
    const byType: Record<string, typeof memories> = {};
    for (const memory of memories) {
      if (!byType[memory.memoryType]) {
        byType[memory.memoryType] = [];
      }
      byType[memory.memoryType].push(memory);
    }

    const embed = new EmbedBuilder()
      .setColor("#00aaff")
      .setTitle(`🧠 Your Memories (${memories.length})`)
      .setDescription(
        includeGlobal
          ? "Showing memories from all servers and DMs"
          : "Showing memories from this server only"
      )
      .setFooter({
        text: "Use /mina-ai forget-me to delete • ⭐ = importance",
      });

    // Add fields for each memory type
    for (const [type, mems] of Object.entries(byType)) {
      const lines = mems.slice(0, 10).map((m) => {
        const stars = "⭐".repeat(Math.min(m.importance, 3));
        const age = getRelativeTime(m.createdAt);
        const location = m.guildId ? "Server" : "DM";
        return `${stars} **${m.key}**: ${m.value}\n_${location} • ${age}_`;
      });

      const remaining = mems.length - 10;
      if (remaining > 0) {
        lines.push(`_...and ${remaining} more ${type} memories_`);
      }

      embed.addFields({
        name: `${getTypeEmoji(type)} ${capitalizeFirst(type)}`,
        value: lines.join("\n\n") || "None",
        inline: false,
      });
    }

    // Add stats
    const totalAccess = memories.reduce((sum, m) => sum + m.accessCount, 0);
    const avgImportance = (
      memories.reduce((sum, m) => sum + m.importance, 0) / memories.length
    ).toFixed(1);

    embed.addFields({
      name: "📊 Stats",
      value: `Total access count: ${totalAccess}\nAverage importance: ${avgImportance}/5`,
      inline: false,
    });

    await interaction.editReply({ embeds: [embed] });

    logger.log(`User ${userId} viewed ${memories.length} memories in guild ${guildId}`);
  } catch (error) {
    logger.error(`Error fetching user memories: ${(error as Error).message}`, error as Error);

    const errorEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Error")
      .setDescription(
        "Failed to fetch memories. Please try again later or contact support."
      );

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [errorEmbed] });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

async function handleForgetMe(interaction: ChatInputCommandInteraction) {
  try {
    const confirm = interaction.options.getString("confirm");

    if (confirm !== "yes") {
      return interaction.reply({
        content: "Memory deletion cancelled.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const guildId = interaction.guildId || null;

    // Delete memories
    const deleted = await memoryService.forgetUser(userId, guildId);

    const embed = new EmbedBuilder()
      .setColor(deleted > 0 ? "#00ff00" : "#ffaa00")
      .setTitle("🧹 Memory Deletion")
      .setDescription(
        deleted > 0
          ? `Successfully deleted **${deleted}** ${
              deleted === 1 ? "memory" : "memories"
            } about you.`
          : "No memories found to delete. You start with a clean slate!"
      )
      .setFooter({ text: "Privacy first!" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    logger.log(`User ${userId} requested memory deletion in guild ${guildId}: ${deleted} deleted`);
  } catch (error) {
    logger.error(`Error deleting user memories: ${(error as Error).message}`, error as Error);

    const errorEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("❌ Error")
      .setDescription(
        "Failed to delete memories. Please try again later or contact support."
      );

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [errorEmbed] });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

// Helper functions
function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    preference: "❤️",
    fact: "📝",
    opinion: "💭",
    experience: "🎯",
    relationship: "🤝",
  };
  return emojis[type] || "📌";
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export default command;
