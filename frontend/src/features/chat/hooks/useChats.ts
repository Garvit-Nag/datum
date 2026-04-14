"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import { chatKeys } from "./chat-keys";
import {
  createChat,
  fetchChats,
  fetchChatDetail,
  fetchChatMessages,
  fetchUserStats,
  updateChatTitle,
} from "@/features/chat/services/chat-service";
import { askQuestion } from "@/features/query/services/query-service";

export function useChats() {
  const { session } = useSupabaseSession();
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: fetchChats,
    enabled: !!session,
  });
}

export function useChatDetail(chatId: string) {
  const { session } = useSupabaseSession();
  return useQuery({
    queryKey: chatKeys.detail(chatId),
    queryFn: () => fetchChatDetail(chatId),
    enabled: !!session && !!chatId,
    refetchInterval: (query) =>
      query.state.data?.document_status === "ready" ? false : 3000,
  });
}

export function useChatMessages(chatId: string) {
  const { session } = useSupabaseSession();
  return useQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: () => fetchChatMessages(chatId),
    enabled: !!session && !!chatId,
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ document_id, title }: { document_id: string; title?: string }) =>
      createChat(document_id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
  });
}

export function useSendMessage(chatId: string, documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (question: string) =>
      askQuestion(documentId, question, chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatKeys.stats() });
    },
  });
}

export function useUpdateChatTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      updateChatTitle(chatId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
  });
}

export function useUserStats() {
  const { session } = useSupabaseSession();
  return useQuery({
    queryKey: chatKeys.stats(),
    queryFn: fetchUserStats,
    enabled: !!session,
  });
}
