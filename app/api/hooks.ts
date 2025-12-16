import { QueryClient, useQuery, useMutation } from '@tanstack/react-query';
import type { Guild, UserInfo, GuildInfo } from '@/config/dashboard/types';

// Query client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 0,
    },
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 0,
    },
  },
});

// Query keys
export const Keys = {
  login: ['login'],
  user: ['users', 'me'],
  guilds: ['user_guilds'],
  guild: (id: string) => ['guild', id],
  guild_info: (guild: string) => ['guild_info', guild],
  features: (guild: string, feature: string) => ['feature', guild, feature],
  guildRoles: (guild: string) => ['guild_roles', guild],
  guildChannels: (guild: string) => ['guild_channels', guild],
};

// Custom hooks for data fetching
// These will fetch from our API routes which proxy to Discord

export function useSelfUserQuery() {
  return useQuery<UserInfo>({
    queryKey: Keys.user,
    queryFn: async () => {
      const res = await fetch('/api/user');
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
  });
}

export function useGuilds() {
  return useQuery<Guild[]>({
    queryKey: Keys.guilds,
    queryFn: async () => {
      const res = await fetch('/api/user/guilds');
      if (!res.ok) throw new Error('Failed to fetch guilds');
      return res.json();
    },
  });
}

export function useGuild(id: string) {
  return useQuery<Guild>({
    queryKey: Keys.guild(id),
    queryFn: async () => {
      const res = await fetch(`/api/guild/${id}`);
      if (!res.ok) throw new Error('Failed to fetch guild');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useGuildInfo(id: string) {
  return useQuery<GuildInfo>({
    queryKey: Keys.guild_info(id),
    queryFn: async () => {
      const res = await fetch(`/api/guild/${id}/info`);
      if (!res.ok) throw new Error('Failed to fetch guild info');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useGuildRoles(guildId: string) {
  return useQuery({
    queryKey: Keys.guildRoles(guildId),
    queryFn: async () => {
      const res = await fetch(`/api/guild/${guildId}/roles`);
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    },
    enabled: !!guildId,
  });
}

export function useGuildChannels(guildId: string) {
  return useQuery({
    queryKey: Keys.guildChannels(guildId),
    queryFn: async () => {
      const res = await fetch(`/api/guild/${guildId}/channels`);
      if (!res.ok) throw new Error('Failed to fetch channels');
      return res.json();
    },
    enabled: !!guildId,
  });
}

// Feature hooks (mocked for now)
export function useFeature<T = any>(guildId: string, featureId: string) {
  return useQuery<T>({
    queryKey: Keys.features(guildId, featureId),
    queryFn: async () => {
      const res = await fetch(`/api/guild/${guildId}/features/${featureId}`);
      if (!res.ok) throw new Error('Failed to fetch feature');
      return res.json();
    },
    enabled: !!guildId && !!featureId,
  });
}

export function useUpdateFeature<T = any>(guildId: string, featureId: string) {
  return useMutation({
    mutationFn: async (data: T) => {
      const res = await fetch(`/api/guild/${guildId}/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update feature');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: Keys.features(guildId, featureId),
      });
    },
  });
}

export function useEnableFeature(guildId: string, featureId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/guild/${guildId}/features/${featureId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to enable feature');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: Keys.guild_info(guildId) });
    },
  });
}

export function useDisableFeature(guildId: string, featureId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/guild/${guildId}/features/${featureId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to disable feature');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: Keys.guild_info(guildId) });
    },
  });
}
