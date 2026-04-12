"use client";

import Link from "next/link";
import { useDocuments, useDeleteDocument } from "@/features/document/hooks/useDocuments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DocumentStatusType } from "@/features/document/types";

function StatusBadge({ status }: { status: DocumentStatusType }) {
  const variantMap = {
    ready: "success",
    processing: "warning",
    failed: "danger",
  } as const;
  return <Badge variant={variantMap[status]}>{status}</Badge>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentList() {
  const { data: documents, isLoading } = useDocuments();
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (!documents?.length) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        No documents yet. Upload an MSA to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Filename</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">{doc.filename}</TableCell>
            <TableCell>
              <StatusBadge status={doc.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={doc.status !== "ready"}
                >
                  <Link href={`/query/${doc.id}`}>Query</Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => deleteDoc(doc.id)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
