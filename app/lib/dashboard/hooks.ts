/**
 * React Query Hooks for Dashboard
 * Data fetching and mutations for dashboard features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeatureId, CustomFeatures, CustomGuildInfo } from '@types';
import type { DiscordGuild } from '@types';

/** Query Keys */
export const QueryKeys = {
  guilds: ['guilds'] as const,
  guild: (id: string) => ['guild', id] as const,
  feature: (guildId: string, featureId: FeatureId) =>
    ['feature', guildId, featureId] as const,
  roles: (guildId: string) => ['roles', guildId] as const,
  channels: (guildId: string) => ['channels', guildId] as const,
};

/**
 * Fetch user's guilds (where bot is installed and user can manage)
 */
export function useGuildsQuery() {
  return useQuery({
    queryKey: QueryKeys.guilds,
    queryFn: async () => {
      // TODO: Implement API call
      const res = await fetch('/api/user/guilds');
      if (!res.ok) throw new Error('Failed to fetch guilds');
      return res.json() as Promise<DiscordGuild[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch guild info with enabled features
 */
export function useGuildQuery(guildId: string) {
  return useQuery({
    queryKey: QueryKeys.guild(guildId),
    queryFn: async () => {
      // TODO: Implement API call
      const res = await fetch(`/api/guild/${guildId}`);
      if (!res.ok) throw new Error('Failed to fetch guild');
      return res.json() as Promise<CustomGuildInfo>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!guildId,
  });
}

/**
 * Fetch feature configuration for a guild
 */
export function useFeatureQuery<K extends FeatureId>(
  guildId: string,
  featureId: K
) {
  return useQuery({
    queryKey: QueryKeys.feature(guildId, featureId),
    queryFn: async () => {
      // TODO: Implement API call
      const res = await fetch(`/api/guild/${guildId}/features/${featureId}`);
      if (!res.ok) throw new Error(`Failed to fetch feature: ${featureId}`);
      return res.json() as Promise<CustomFeatures[K]>;
    },
    enabled: !!guildId && !!featureId,
  });
}

/**
 * Toggle feature on/off
 */
export function useToggleFeatureMutation(
  guildId: string,
  featureId: FeatureId
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      // TODO: Implement API call
      const method = enabled ? 'POST' : 'DELETE';
      const res = await fetch(`/api/guild/${guildId}/features/${featureId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to toggle feature: ${featureId}`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: QueryKeys.guild(guildId) });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.feature(guildId, featureId),
      });
    },
  });
}

/**
 * Update feature configuration
 */
export function useUpdateFeatureMutation<K extends FeatureId>(
  guildId: string,
  featureId: K
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomFeatures[K]) => {
      // TODO: Implement API call
      const res = await fetch(`/api/guild/${guildId}/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Failed to update feature: ${featureId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.feature(guildId, featureId),
      });
      queryClient.invalidateQueries({ queryKey: QueryKeys.guild(guildId) });
    },
  });
}

/**
 * Fetch guild roles
 */
export function useGuildRolesQuery(guildId: string) {
  return useQuery({
    queryKey: QueryKeys.roles(guildId),
    queryFn: async () => {
      // TODO: Implement API call
      const res = await fetch(`/api/guild/${guildId}/roles`);
      if (!res.ok) throw new Error('Failed to fetch guild roles');
      return res.json() as Promise<
        Array<{ id: string; name: string; color: number }>
      >;
    },
    enabled: !!guildId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch guild channels
 */
export function useGuildChannelsQuery(guildId: string) {
  return useQuery({
    queryKey: QueryKeys.channels(guildId),
    queryFn: async () => {
      // TODO: Implement API call
      const res = await fetch(`/api/guild/${guildId}/channels`);
      if (!res.ok) throw new Error('Failed to fetch guild channels');
      return res.json() as Promise<
        Array<{ id: string; name: string; type: number }>
      >;
    },
    enabled: !!guildId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
