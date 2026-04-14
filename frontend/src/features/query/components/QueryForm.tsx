"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuerySchema, type QuerySchemaType } from "@/features/query/schemas/QuerySchema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  onSubmit: (question: string) => void;
  isPending: boolean;
};

export function QueryForm({ onSubmit, isPending }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuerySchemaType>({ resolver: zodResolver(QuerySchema) });

  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d.question))} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="question">Ask a question about the document</Label>
        <Textarea
          id="question"
          placeholder="e.g. What is the maximum liability cap?"
          rows={3}
          disabled={isPending}
          {...register("question")}
        />
        {errors.question && (
          <p className="text-xs text-destructive">{errors.question.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Thinking…" : "Ask"}
      </Button>
    </form>
  );
}
