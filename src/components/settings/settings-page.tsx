"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Database, Server, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function SettingsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isResetOpen, setIsResetOpen] = useState(false)

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/reset", {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to reset system")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
      setIsResetOpen(false)
      toast({
        title: "Success",
        description: "System has been reset. All data cleared.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-6 max-w-2xl pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          System settings and information
        </p>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Current system configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Application</p>
              <p className="text-lg font-semibold">Eddie&apos;s Partners CRM</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-lg font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Database</p>
              <p className="text-lg font-semibold">SQLite</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Framework</p>
              <p className="text-lg font-semibold">Next.js 16</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Features
          </CardTitle>
          <CardDescription>
            Available features in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Sources Management</p>
                <p className="text-sm text-muted-foreground">Manage project sources and their contacts</p>
              </div>
              <span className="text-emerald-600 text-sm font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Partners Management</p>
                <p className="text-sm text-muted-foreground">Manage project partners and their details</p>
              </div>
              <span className="text-emerald-600 text-sm font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Deals Tracking</p>
                <p className="text-sm text-muted-foreground">Track deals, projects, and financials</p>
              </div>
              <span className="text-emerald-600 text-sm font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Payment Management</p>
                <p className="text-sm text-muted-foreground">Track payments and commission schedules</p>
              </div>
              <span className="text-emerald-600 text-sm font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Payment Reminders</p>
                <p className="text-sm text-muted-foreground">Set up payment reminders with AI-generated emails</p>
              </div>
              <span className="text-emerald-600 text-sm font-medium">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Precautious tools for your system data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-destructive">Start Fresh (Reset All Data)</p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete ALL clients, sources, partners, deals, payments, and reminders.
                This action is irreversible and should only be used if you want to clear the entire system.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={() => setIsResetOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your entire database content
              including all financial records and contact information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Resetting..." : "Yes, Delete Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
