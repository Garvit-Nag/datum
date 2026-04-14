export const evaluationKeys = {
  all: ["evaluation"] as const,
  results: () => [...evaluationKeys.all, "results"] as const,
};
