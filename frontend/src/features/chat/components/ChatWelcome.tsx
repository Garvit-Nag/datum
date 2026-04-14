"use client";

import { Upload } from "lucide-react";

type Props = {
  documentName: string;
};

export function ChatWelcome({ documentName }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Ready to analyze
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your document <span className="font-medium text-foreground">{documentName}</span> is loaded.
          Ask any question about this contract below.
        </p>
      </div>
    </div>
  );
}
