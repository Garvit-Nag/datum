"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  answer: string | undefined;
  isPending: boolean;
};

export function AnswerPanel({ answer, isPending }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Answer</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
          </div>
        )}
        {!isPending && !answer && (
          <p className="text-sm text-muted-foreground">
            Your answer will appear here after you ask a question.
          </p>
        )}
        {!isPending && answer && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{answer}</p>
        )}
      </CardContent>
    </Card>
  );
}
