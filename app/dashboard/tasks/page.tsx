"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
  Play,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { handleAPICall, methodENUM } from "@/lib/api-utils";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "pending"
    | "in_progress"
    | "completion_requested"
    | "completed"
    | "approved"
    | "rejected";
  assignedTo: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  assignedBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  dueDate: string;
  completionNotes?: string;
  completionRequestNotes?: string;
  approvalNotes?: string;
  completionRequestedAt?: string;
  approvedAt?: string;
  approvedBy?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  category: string;
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const [createTaskData, setCreateTaskData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    assignedTo: "",
    dueDate: "",
    category: "other",
  });

  const [completionRequestData, setCompletionRequestData] = useState({
    completionRequestNotes: "",
  });

  const [approvalData, setApprovalData] = useState({
    approvalNotes: "",
    action: "approve" as "approve" | "reject",
  });

  const isAdmin =
    currentUser &&
    (currentUser.role === "admin" || currentUser.role === "super-admin");

  useEffect(() => {
    fetchTasks();
    fetchAdminUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const data = await handleAPICall("/api/auth/current", methodENUM.GET);
      if (data) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await handleAPICall("/api/tasks", methodENUM.GET);
      if (data) {
        setTasks(data);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while fetching tasks",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const data = await handleAPICall("/api/admin-users", methodENUM.GET);
      if (data) {
        setAdminUsers(data);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const handleCreateTask = async () => {
    try {
      const data = await handleAPICall(
        "/api/tasks",
        methodENUM.POST,
        createTaskData
      );
      if (data) {
        setMessage({ type: "success", text: "Task created successfully" });
        setShowCreateDialog(false);
        setCreateTaskData({
          title: "",
          description: "",
          priority: "medium",
          assignedTo: "",
          dueDate: "",
          category: "other",
        });
        fetchTasks();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while creating task",
      });
    }
  };

  const handleRequestCompletion = async () => {
    if (!selectedTask) return;

    try {
      const data = await handleAPICall(
        `/api/tasks/${selectedTask._id}`,
        methodENUM.PUT,
        {
          action: "request_completion",
          completionRequestNotes: completionRequestData.completionRequestNotes,
        }
      );

      if (data) {
        setMessage({
          type: "success",
          text: "Task completion requested successfully",
        });
        setShowCompletionDialog(false);
        setCompletionRequestData({ completionRequestNotes: "" });
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while requesting completion",
      });
    }
  };

  const handleApproveReject = async () => {
    if (!selectedTask) return;

    try {
      const data = await handleAPICall(
        `/api/tasks/${selectedTask._id}`,
        methodENUM.PUT,
        {
          action:
            approvalData.action === "approve"
              ? "approve_completion"
              : "reject_completion",
          approvalNotes: approvalData.approvalNotes,
        }
      );

      if (data) {
        setMessage({
          type: "success",
          text: `Task completion ${
            approvalData.action === "approve" ? "approved" : "rejected"
          } successfully`,
        });
        setShowApprovalDialog(false);
        setApprovalData({ approvalNotes: "", action: "approve" });
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while processing approval",
      });
    }
  };

  const handleStartTask = async (task: Task) => {
    try {
      const data = await handleAPICall(
        `/api/tasks/${task._id}`,
        methodENUM.PUT,
        {
          action: "start_task",
        }
      );

      if (data) {
        setMessage({ type: "success", text: "Task started successfully" });
        fetchTasks();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while starting task",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "completion_requested":
        return "bg-purple-100 text-purple-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canRequestCompletion = (task: Task) => {
    return (
      (currentUser &&
        task.assignedTo._id === currentUser._id &&
        task.status === "in_progress") ||
      (isAdmin && task.status === "in_progress")
    );
  };

  const canApproveReject = (task: Task) => {
    return (
      (currentUser &&
        task.assignedBy._id === currentUser._id &&
        task.status === "completion_requested") ||
      (isAdmin && task.status === "completion_requested")
    );
  };

  const canStartTask = (task: Task) => {
    return (
      (currentUser &&
        task.assignedTo._id === currentUser._id &&
        task.status === "pending") ||
      (isAdmin && task.status === "pending")
    );
  };

  // Filter tasks based on search query and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo.fullName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      task.assignedBy.fullName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track admin tasks</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {message && (
        <Alert
          className={
            message.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              message.type === "success" ? "text-green-800" : "text-red-800"
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks by title, description, or assigned user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completion_requested">
                      Completion Requested
                    </SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Results</label>
                <div className="text-sm text-muted-foreground pt-2">
                  {filteredTasks.length} of {tasks.length} tasks
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery ||
              statusFilter !== "all" ||
              priorityFilter !== "all") && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          <Card key={task._id}>
            <CardHeader>
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <CardDescription>{task.description}</CardDescription>
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Assigned to: {task.assignedTo.fullName}
              </p>
              <p className="text-sm text-muted-foreground">
                Created by: {task.assignedBy.fullName}
              </p>
              <p className="text-sm text-muted-foreground">
                Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
              </p>

              {task.completionRequestNotes && (
                <div className="text-sm bg-purple-50 p-2 rounded-md border border-purple-200">
                  <p className="font-medium text-purple-800">
                    Completion Request Notes:
                  </p>
                  <p className="text-purple-700">
                    {task.completionRequestNotes}
                  </p>
                  {task.completionRequestedAt && (
                    <p className="text-xs text-purple-600 mt-1">
                      Requested:{" "}
                      {format(
                        new Date(task.completionRequestedAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </p>
                  )}
                </div>
              )}

              {task.approvalNotes && (
                <div
                  className={`text-sm p-2 rounded-md border ${
                    task.status === "approved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p
                    className={`font-medium ${
                      task.status === "approved"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {task.status === "approved" ? "Approval" : "Rejection"}{" "}
                    Notes:
                  </p>
                  <p
                    className={
                      task.status === "approved"
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {task.approvalNotes}
                  </p>
                  {task.approvedAt && (
                    <p
                      className={`text-xs mt-1 ${
                        task.status === "approved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {task.status === "approved" ? "Approved" : "Rejected"}:{" "}
                      {format(new Date(task.approvedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {canStartTask(task) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartTask(task)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                )}

                {canRequestCompletion(task) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowCompletionDialog(true);
                    }}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Request Completion
                  </Button>
                )}

                {canApproveReject(task) && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => {
                        setSelectedTask(task);
                        setApprovalData({
                          approvalNotes: "",
                          action: "approve",
                        });
                        setShowApprovalDialog(true);
                      }}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedTask(task);
                        setApprovalData({
                          approvalNotes: "",
                          action: "reject",
                        });
                        setShowApprovalDialog(true);
                      }}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
            <p className="text-muted-foreground text-center">
              No tasks have been created yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to an admin user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={createTaskData.title}
                onChange={(e) =>
                  setCreateTaskData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={createTaskData.description}
                onChange={(e) =>
                  setCreateTaskData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={createTaskData.priority}
                  onValueChange={(value: any) =>
                    setCreateTaskData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={createTaskData.category}
                  onValueChange={(value) =>
                    setCreateTaskData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="moderation">Moderation</SelectItem>
                    <SelectItem value="user_management">
                      User Management
                    </SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign To *</label>
                <Select
                  value={createTaskData.assignedTo}
                  onValueChange={(value) =>
                    setCreateTaskData((prev) => ({
                      ...prev,
                      assignedTo: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin user" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.fullName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date *</label>
                <Input
                  type="date"
                  value={createTaskData.dueDate}
                  onChange={(e) =>
                    setCreateTaskData((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={
                !createTaskData.title ||
                !createTaskData.description ||
                !createTaskData.assignedTo ||
                !createTaskData.dueDate
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Request Dialog */}
      <Dialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Task Completion</DialogTitle>
            <DialogDescription>
              Request approval for task completion. Only the task creator can
              approve your request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Completion Notes</label>
              <Textarea
                value={completionRequestData.completionRequestNotes}
                onChange={(e) =>
                  setCompletionRequestData((prev) => ({
                    ...prev,
                    completionRequestNotes: e.target.value,
                  }))
                }
                placeholder="Describe what was completed and any additional notes..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompletionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestCompletion}
              disabled={!completionRequestData.completionRequestNotes.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Request Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalData.action === "approve" ? "Approve" : "Reject"} Task
              Completion
            </DialogTitle>
            <DialogDescription>
              {approvalData.action === "approve"
                ? "Approve the task completion request."
                : "Reject the task completion request with feedback."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {approvalData.action === "approve" ? "Approval" : "Rejection"}{" "}
                Notes
              </label>
              <Textarea
                value={approvalData.approvalNotes}
                onChange={(e) =>
                  setApprovalData((prev) => ({
                    ...prev,
                    approvalNotes: e.target.value,
                  }))
                }
                placeholder={
                  approvalData.action === "approve"
                    ? "Optional notes for approval..."
                    : "Please provide feedback on why the completion was rejected..."
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveReject}
              className={
                approvalData.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              disabled={
                approvalData.action === "reject" &&
                !approvalData.approvalNotes.trim()
              }
            >
              {approvalData.action === "approve" ? (
                <>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
