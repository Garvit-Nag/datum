export const chatKeys = {
  all: ["chats"] as const,
  list: () => [...chatKeys.all, "list"] as const,
  detail: (id: string) => [...chatKeys.all, "detail", id] as const,
  messages: (id: string) => [...chatKeys.all, "messages", id] as const,
  stats: () => [...chatKeys.all, "stats"] as const,
};
