"use client";

import { useDocuments, useDeleteDocument } from "@/features/document/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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
        No documents yet. Create a new chat to upload one.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Filename</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id} className="transition-all duration-200 hover:-translate-y-px hover:border-l-2 hover:border-l-cyan-500/40 hover:shadow-sm">
            <TableCell className="font-medium">{doc.filename}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => deleteDoc(doc.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
