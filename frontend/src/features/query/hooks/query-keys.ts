export const queryKeys = {
  all: ["queries"] as const,
  result: (queryId: string) => [...queryKeys.all, "result", queryId] as const,
};
