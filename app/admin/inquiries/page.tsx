"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Archive,
  Trash2,
  Eye,
  Send,
  Loader2,
} from "lucide-react";

interface Submission {
  id: string;
  name: string;
  email: string;
  eventType: string | null;
  eventDate: string | null;
  message: string;
  status: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  read: "bg-yellow-100 text-yellow-800",
  replied: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

export default function InquiriesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [response, setResponse] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/admin/inquiries?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSubmissions();
        if (selectedSubmission?.id === id) {
          setSelectedSubmission(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleViewSubmission = async (submission: Submission) => {
    setSelectedSubmission(submission);
    setResponse(submission.response || "");
    if (submission.status === "new") {
      await updateStatus(submission.id, "read");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedSubmission || !response.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: response.trim(), status: "replied" }),
      });
      if (res.ok) {
        fetchSubmissions();
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error("Failed to save response:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const newCount = submissions.filter((s) => s.status === "new").length;

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inquiries</h1>
          <p className="text-muted-foreground">
            Manage contact form submissions
            {newCount > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-800">
                {newCount} new
              </Badge>
            )}
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No inquiries yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card
              key={submission.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                submission.status === "new" ? "border-blue-200 bg-blue-50/50" : ""
              }`}
              onClick={() => handleViewSubmission(submission)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {submission.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className={statusColors[submission.status]}
                      >
                        {submission.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {submission.email}
                    </p>
                    <p className="text-sm line-clamp-2">{submission.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {submission.eventType && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {submission.eventType}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(submission.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(submission.id, "archived");
                      }}
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSubmission(submission.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedSubmission.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <a
                      href={`mailto:${selectedSubmission.email}`}
                      className="flex items-center gap-1 text-sm hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {selectedSubmission.email}
                    </a>
                  </div>
                  {selectedSubmission.eventType && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Event Type
                      </Label>
                      <p className="text-sm">{selectedSubmission.eventType}</p>
                    </div>
                  )}
                  {selectedSubmission.eventDate && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Event Date
                      </Label>
                      <p className="text-sm">{selectedSubmission.eventDate}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Submitted
                    </Label>
                    <p className="text-sm">
                      {formatDate(selectedSubmission.createdAt)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <div className="mt-1 p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                    {selectedSubmission.message}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label htmlFor="response">Your Response</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Save your response notes here. Use the email link above to
                    send your actual reply.
                  </p>
                  <textarea
                    id="response"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Write your response notes..."
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                  {selectedSubmission.respondedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last response saved:{" "}
                      {formatDate(selectedSubmission.respondedAt)}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSubmission(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleSendResponse}
                    disabled={isSending || !response.trim()}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Save Response
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
