"use client";

import type { EvaluationRunType, VerdictType } from "@/features/evaluation/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const verdictVariant: Record<VerdictType, "success" | "warning" | "danger"> = {
  Match: "success",
  "Partial Match": "warning",
  "No Match": "danger",
};

function truncate(text: string, len = 80): string {
  return text.length > len ? text.slice(0, len) + "…" : text;
}

type Props = {
  run: EvaluationRunType;
};

export function EvaluationSummaryTable({ run }: Props) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Evaluation Results</h2>
        <p className="text-xs text-muted-foreground">
          Run at {new Date(run.run_at).toLocaleString()}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">#</TableHead>
            <TableHead className="w-36">Category</TableHead>
            <TableHead>Expected Answer</TableHead>
            <TableHead>System Answer</TableHead>
            <TableHead className="w-28">Verdict</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {run.results.map((row) => (
            <TableRow key={row.id} className="transition-colors duration-150 hover:bg-muted/60">
              <TableCell className="font-medium text-muted-foreground">{row.id}</TableCell>
              <TableCell className="text-xs font-medium text-foreground">
                {row.category || "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {truncate(row.expected_answer)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {truncate(row.system_answer)}
              </TableCell>
              <TableCell>
                <Badge variant={verdictVariant[row.verdict]}>{row.verdict}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{row.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-sm font-medium">
              Match: {run.match_count} &nbsp;|&nbsp; Partial Match: {run.partial_count}{" "}
              &nbsp;|&nbsp; No Match: {run.no_match_count}
            </TableCell>
            <TableCell colSpan={2} className="text-sm font-semibold text-right">
              Overall Accuracy: {run.accuracy_pct.toFixed(1)}%
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
