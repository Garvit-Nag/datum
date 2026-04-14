"use client";

import { useAskQuestion } from "@/features/query/hooks/useAskQuestion";
import { QueryForm } from "./QueryForm";
import { SimilarityReportPanel } from "./SimilarityReportPanel";
import { AnswerPanel } from "./AnswerPanel";

type Props = {
  docId: string;
  docName: string;
};

export function QueryPageClient({ docId, docName }: Props) {
  const { mutate, data, isPending } = useAskQuestion(docId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Query Document</h1>
        <p className="text-sm text-muted-foreground">{docName}</p>
      </div>

      <QueryForm onSubmit={(q) => mutate(q)} isPending={isPending} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SimilarityReportPanel chunks={data?.chunks} isPending={isPending} />
        <AnswerPanel answer={data?.answer} isPending={isPending} />
      </div>
    </div>
  );
}
