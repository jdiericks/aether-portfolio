"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  clientId: string;
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
}

export function PhotoUploader({ clientId, onUploadComplete }: PhotoUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));

      setUploadingFiles(newFiles);
      setIsUploading(true);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i].file;
        
        try {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "uploading" as const } : f
            )
          );

          const formData = new FormData();
          formData.append("file", file);
          formData.append("clientId", clientId);

          const response = await fetch("/api/photos/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, progress: 100, status: "complete" as const } : f
            )
          );
          successCount++;
        } catch {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "error" as const } : f
            )
          );
          errorCount++;
        }
      }

      setIsUploading(false);

      if (successCount > 0) {
        toast.success(`${successCount} media file${successCount > 1 ? "s" : ""} uploaded successfully`);
        onUploadComplete();
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} media file${errorCount > 1 ? "s" : ""} failed to upload`);
      }

      setTimeout(() => {
        setUploadingFiles([]);
      }, 2000);
    },
    [clientId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    disabled: isUploading,
  });

  const clearFiles = () => {
    setUploadingFiles([]);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop property media here</p>
        ) : (
          <>
            <p className="text-lg font-medium">
              Drag & drop property media here, or click to select
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports JPEG, PNG, GIF, and WebP
            </p>
          </>
        )}
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Uploading {uploadingFiles.length} file
              {uploadingFiles.length > 1 ? "s" : ""}
            </p>
            {!isUploading && (
              <Button variant="ghost" size="sm" onClick={clearFiles}>
                Clear
              </Button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {uploadingFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.file.name}</p>
                  {file.status === "uploading" && (
                    <Progress value={50} className="h-1 mt-1" />
                  )}
                </div>
                <div className="flex-shrink-0">
                  {file.status === "pending" && (
                    <div className="h-5 w-5" />
                  )}
                  {file.status === "uploading" && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  {file.status === "complete" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {file.status === "error" && (
                    <X className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
