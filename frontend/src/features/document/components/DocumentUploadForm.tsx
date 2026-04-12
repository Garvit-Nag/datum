"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadSchema, type UploadSchemaType } from "@/features/document/schemas/UploadSchema";
import { useUploadDocument } from "@/features/document/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function DocumentUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UploadSchemaType>({ resolver: zodResolver(UploadSchema) });

  const { mutate, isPending, isSuccess, reset } = useUploadDocument();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setValue("file", file);
      setSelectedName(file.name);
    }
  }

  function onSubmit(data: UploadSchemaType) {
    mutate(data.file, {
      onSuccess: () => {
        setSelectedName(null);
        reset();
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="file-upload">Upload MSA Document</Label>
        <div
          className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-base">📄</span>
          <span>{selectedName ?? "Click to select a PDF or TXT file (max 20 MB)"}</span>
        </div>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
        {errors.file && (
          <p className="text-xs text-destructive">{errors.file.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending || !selectedName} className="w-full">
        {isPending ? "Uploading…" : "Upload Document"}
      </Button>

      {isSuccess && (
        <p className="text-xs text-green-600">Document uploaded — processing in background.</p>
      )}
    </form>
  );
}
