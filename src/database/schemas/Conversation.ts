// @root/src/database/schemas/Conversation.ts

import mongoose from 'mongoose'

const MessagePartSchema = new mongoose.Schema(
  {
    text: { type: String },
    inlineData: {
      data: { type: String },
      mimeType: { type: String },
    },
    functionCall: {
      name: { type: String },
      args: { type: mongoose.Schema.Types.Mixed },
    },
    functionResponse: {
      name: { type: String },
      response: { type: mongoose.Schema.Types.Mixed },
    },
  },
  { _id: false, strict: false }
)

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'model'], required: true },
    parts: { type: [MessagePartSchema], required: true },
    timestamp: { type: Number, required: true },
    userId: { type: String },
    username: { type: String },
    displayName: { type: String },
  },
  { _id: false }
)

const ConversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    messages: { type: [MessageSchema], default: [] },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

// TTL index: automatically delete conversations after 30 minutes of inactivity
ConversationSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 1800 })

export const Model = mongoose.model('conversation', ConversationSchema)

/**
 * Upsert conversation (create or update)
 */
export async function upsertConversation(
  conversationId: string,
  messages: any[],
  maxMessages: number = 20
): Promise<void> {
  await Model.findOneAndUpdate(
    { conversationId },
    {
      $set: {
        messages: messages.slice(-maxMessages),
        lastActivity: new Date(),
      },
    },
    { upsert: true }
  )
}

/**
 * Load conversation from DB (only if not stale).
 * @param ttlMs - Maximum age in ms; documents older than this are treated as expired.
 */
export async function loadConversation(
  conversationId: string,
  ttlMs: number = 30 * 60 * 1000
): Promise<any[] | null> {
  const cutoff = new Date(Date.now() - ttlMs)
  const doc = await Model.findOne({
    conversationId,
    lastActivity: { $gte: cutoff },
  }).lean()
  if (!doc) return null
  return doc.messages
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  await Model.deleteOne({ conversationId })
}
