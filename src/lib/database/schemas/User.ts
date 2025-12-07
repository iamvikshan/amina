// @root/astro/lib/database/schemas/User.ts
import mongoose from 'mongoose';
import type { IUser, IUserFlag, IUserProfile } from '@types';

const FlagSchema = new mongoose.Schema<IUserFlag>({
  reason: { type: String, required: true },
  flaggedBy: { type: String, required: true },
  flaggedAt: { type: Date, default: Date.now },
  serverId: { type: String, required: true },
  serverName: { type: String, required: true },
});

const ProfileSchema = new mongoose.Schema<IUserProfile>({
  pronouns: { type: String, default: null },
  birthdate: { type: Date, default: null },
  region: { type: String, default: null },
  languages: [{ type: String }],
  timezone: { type: String, default: null },
  bio: { type: String, default: null, maxLength: 1000 },
  interests: [{ type: String }],
  socials: {
    type: Map,
    of: String,
    default: new Map(),
  },
  favorites: {
    type: Map,
    of: String,
    default: new Map(),
  },
  goals: [{ type: String }],
  privacy: {
    showAge: { type: Boolean, default: true },
    showRegion: { type: Boolean, default: true },
    showBirthdate: { type: Boolean, default: false },
    showPronouns: { type: Boolean, default: true },
  },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Virtual property to compute age from birthdate
ProfileSchema.virtual('age').get(function () {
  if (!this.birthdate) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - this.birthdate.getFullYear();
  const monthDiff = today.getMonth() - this.birthdate.getMonth();

  // Adjust age if birthday hasn't occurred yet this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < this.birthdate.getDate())
  ) {
    age--;
  }

  return age;
});

const UserSchema = new mongoose.Schema<IUser>(
  {
    _id: String,
    username: String,
    global_name: String,
    logged: { type: Boolean, default: false },
    coins: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    reputation: {
      received: { type: Number, default: 0 },
      given: { type: Number, default: 0 },
      timestamp: Date,
    },
    daily: {
      streak: { type: Number, default: 0 },
      timestamp: Date,
    },
    flags: { type: [FlagSchema], default: [] },
    premium: {
      enabled: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
    },
    afk: {
      enabled: { type: Boolean, default: false },
      reason: { type: String, default: null },
      since: { type: Date, default: null },
      endTime: { type: Date, default: null },
    },
    profile: { type: ProfileSchema, default: () => ({}) },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

export const User =
  mongoose.models.user || mongoose.model<IUser>('user', UserSchema);

export default User;
