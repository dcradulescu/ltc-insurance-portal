import React, { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, FileUp, Trash2, Download, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface Document {
  id: number;
  fileName: string;
  category: string;
  fileSize: number;
  uploadedAt: Date;
  fileUrl: string;
  status: "pending" | "uploaded" | "verified" | "rejected";
}

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentsQuery = trpc.documents.list.useQuery();
  const categoriesQuery = trpc.documents.getCategories.useQuery();
  const uploadMutation = trpc.documents.upload.useMutation();
  const deleteMutation = trpc.documents.delete.useMutation();


  // Load documents
  React.useEffect(() => {
    if (documentsQuery.data) {
      setDocuments(documentsQuery.data as Document[]);
    }
  }, [documentsQuery.data]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  // Validate file
  const validateFile = useCallback(async (file: File, category: string) => {
    const errors: string[] = [];
    const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
    const MAX_SIZE = 52428800;

    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push("Invalid file type. Allowed: PDF, JPG, PNG, GIF");
    }
    if (file.size > MAX_SIZE) {
      errors.push("File size exceeds 50MB limit");
    }

    return { valid: errors.length === 0, errors };
  }, []);

  // Handle file upload
  const handleUpload = useCallback(
    async (category: string) => {
      if (!selectedFile) return;

      // Validate file first
      const validation = await validateFile(selectedFile, category);
      if (!validation.valid) {
        alert(`Validation errors:\n${validation.errors.join("\n")}`);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Read file as base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(",")[1];
          setUploadProgress(50);

          try {
            await uploadMutation.mutateAsync({
              fileName: selectedFile.name,
              fileData: base64,
              mimeType: selectedFile.type,
              category,
            });

            setUploadProgress(100);
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }

            // Refetch documents
            await documentsQuery.refetch();
          } catch (error) {
            alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        };

        reader.readAsDataURL(selectedFile);
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [selectedFile, validateFile, uploadMutation, documentsQuery]
  );

  // Handle document deletion
  const handleDelete = useCallback(
    async (docId: number) => {
      if (!confirm("Are you sure you want to delete this document?")) return;

      try {
        await deleteMutation.mutateAsync({ id: docId });
        await documentsQuery.refetch();
      } catch (error) {
        alert(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
    [deleteMutation, documentsQuery]
  );

  // Filter documents by category
  const filteredDocuments =
    selectedCategory === "All"
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Verified</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Rejected</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Pending</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Uploaded</span>
          </div>
        );
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>Upload and manage required insurance documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Document</h3>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload New Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Select a document category and file to upload
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Category Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesQuery.data?.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                            {cat.required && <span className="text-red-500 ml-1">*</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* File Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">File</label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploading...</p>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    onClick={() => {
                      const category = (
                        document.querySelector('[role="combobox"]') as HTMLElement
                      )?.textContent;
                      if (category) {
                        handleUpload(category);
                      }
                    }}
                    disabled={!selectedFile || isUploading}
                    className="w-full"
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Upload Requirements */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Upload Requirements:</strong>
                <ul className="mt-2 ml-4 list-disc text-sm">
                  <li>Maximum file size: 50MB</li>
                  <li>Allowed formats: PDF, JPG, PNG, GIF, DOC, DOCX, XLS, XLSX</li>
                  <li>Red asterisk (*) indicates required documents</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Documents</h3>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "All" ? "default" : "outline"}
                onClick={() => setSelectedCategory("All")}
                size="sm"
              >
                All
              </Button>
              {categoriesQuery.data?.map((cat: any) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.name ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.name)}
                  size="sm"
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Documents Table */}
            {filteredDocuments.length > 0 ? (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{doc.fileName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{doc.category}</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No documents uploaded yet</p>
                <p className="text-sm">Upload your first document to get started</p>
              </div>
            )}
          </div>

          {/* Required Documents Checklist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Required Documents</h3>
            <div className="space-y-2">
              {categoriesQuery.data
                ?.filter((cat: any) => cat.required)
                .map((cat: any) => {
                  const hasDoc = documents.some((doc) => doc.category === cat.name);
                  return (
                    <div key={cat.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {hasDoc ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-sm text-gray-600">{cat.description}</p>
                      </div>
                      <span className={hasDoc ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                        {hasDoc ? "✓ Complete" : "Pending"}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
