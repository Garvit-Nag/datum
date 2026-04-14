import { apiClient } from "@/shared/api/client";
import type { ChatDetailType, ChatType, MessageType, UserStatsType } from "@/features/chat/types";

export async function createChat(document_id: string, title?: string): Promise<ChatType> {
  const res = await apiClient.post<ChatType>("/api/v1/chats/", { document_id, title });
  return res.data;
}

export async function fetchChats(): Promise<ChatType[]> {
  const res = await apiClient.get<ChatType[]>("/api/v1/chats/");
  return res.data;
}

export async function fetchChatDetail(chatId: string): Promise<ChatDetailType> {
  const res = await apiClient.get<ChatDetailType>(`/api/v1/chats/${chatId}`);
  return res.data;
}

export async function fetchChatMessages(chatId: string): Promise<MessageType[]> {
  const res = await apiClient.get<MessageType[]>(`/api/v1/chats/${chatId}/messages`);
  return res.data;
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await apiClient.patch(`/api/v1/chats/${chatId}`, { title });
}

export async function fetchUserStats(): Promise<UserStatsType> {
  const res = await apiClient.get<UserStatsType>("/api/v1/chats/stats");
  return res.data;
}
