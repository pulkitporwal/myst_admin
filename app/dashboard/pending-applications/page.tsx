"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, User, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";

interface PendingApplication {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  notes?: string;
  createdAt: string;
}

export default function PendingApplicationsPage() {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const fetchPendingApplications = async () => {
    try {
      const response = await fetch('/api/admin-users/pending');
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch applications' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while fetching applications' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedApp || !action) return;

    setProcessing(selectedApp._id);
    try {
      const response = await fetch('/api/admin-users/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedApp._id,
          action,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
        });
        setApplications(prev => prev.filter(app => app._id !== selectedApp._id));
        setSelectedApp(null);
        setAction(null);
        setNotes("");
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to process application' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while processing the application' });
    } finally {
      setProcessing(null);
    }
  };

  const openActionDialog = (application: PendingApplication, actionType: 'approve' | 'reject') => {
    setSelectedApp(application);
    setAction(actionType);
    setNotes("");
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Pending Applications</h1>
          <p className="text-muted-foreground">
            Review and manage admin role applications
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {applications.length} pending
        </Badge>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
            <p className="text-muted-foreground text-center">
              All applications have been processed or there are no new applications to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <Card key={application._id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{application.fullName}</CardTitle>
                  </div>
                  <Badge variant={application.role === 'admin' ? 'default' : 'secondary'}>
                    {application.role}
                  </Badge>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{application.email}</span>
                </CardDescription>
                {application.phoneNumber && (
                  <CardDescription className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{application.phoneNumber}</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {application.notes && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Notes:</span>
                    </div>
                    <p className="text-sm bg-muted p-2 rounded-md">
                      {application.notes}
                    </p>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Applied on {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => openActionDialog(application, 'approve')}
                    className="flex-1"
                    disabled={processing === application._id}
                  >
                    {processing === application._id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openActionDialog(application, 'reject')}
                    className="flex-1"
                    disabled={processing === application._id}
                  >
                    {processing === application._id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedApp} onOpenChange={() => {
        setSelectedApp(null);
        setAction(null);
        setNotes("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve' : 'Reject'} Application
            </DialogTitle>
            <DialogDescription>
              {action === 'approve' 
                ? `Are you sure you want to approve ${selectedApp?.fullName}'s application? They will be able to access the dashboard.`
                : `Are you sure you want to reject ${selectedApp?.fullName}'s application? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={action === 'approve' 
                  ? "Add any notes about the approval..."
                  : "Add any notes about the rejection..."
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedApp(null);
                setAction(null);
                setNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={processing === selectedApp?._id}
            >
              {processing === selectedApp?._id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : action === 'approve' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 