"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, Plus, Trash2, Mail, Clock, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Reminder {
  id: string
  dealId: string
  daysBefore: number
  email: string
  isActive: boolean
  sentAt: string | null
  deal: {
    id: string
    name: string
  }
  createdAt: string
}

export function RemindersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    dealId: "",
    daysBefore: "3",
    email: "",
  })

  const { data: reminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["reminders"],
    queryFn: async () => {
      const res = await fetch("/api/reminders")
      if (!res.ok) throw new Error("Failed to fetch reminders")
      return res.json()
    },
  })

  const { data: deals } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals")
      if (!res.ok) throw new Error("Failed to fetch deals")
      return res.json()
    },
    enabled: isCreateOpen,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: data.dealId,
          daysBefore: parseInt(data.daysBefore),
          email: data.email,
        }),
      })
      if (!res.ok) throw new Error("Failed to create reminder")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] })
      setIsCreateOpen(false)
      setFormData({ dealId: "", daysBefore: "3", email: "" })
      toast({
        title: "Success",
        description: "Reminder created successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete reminder")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] })
      toast({
        title: "Success",
        description: "Reminder deleted",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive",
      })
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminders/${id}/send`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to send reminder")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] })
      toast({
        title: "Success",
        description: "Reminder email sent manually",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.dealId || !formData.email) {
      toast({
        title: "Error",
        description: "Deal and email are required",
        variant: "destructive",
      })
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Reminders</h1>
          <p className="text-muted-foreground">
            Configure email reminders for upcoming payments
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reminder
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>
            Reminders are sent X days before a payment is due
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : reminders && reminders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Days Before</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Sent</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">
                      {reminder.deal.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {reminder.daysBefore} days
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {reminder.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={reminder.isActive ? "default" : "secondary"}
                        className={
                          reminder.isActive
                            ? "bg-green-100 text-green-700"
                            : ""
                        }
                      >
                        {reminder.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(reminder.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {reminder.sentAt ? (
                        <span className="text-xs text-muted-foreground">
                          {new Date(reminder.sentAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-slate-900"
                          title="Send manually now"
                          onClick={() => sendMutation.mutate(reminder.id)}
                          disabled={sendMutation.isPending}
                        >
                          <Send className={cn("h-4 w-4", sendMutation.isPending && "animate-pulse")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(reminder.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reminders configured</p>
              <p className="text-sm">Add a reminder to get notified before payments are due</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Reminder</DialogTitle>
            <DialogDescription>
              Configure a reminder to be sent before a payment is due
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deal">Deal</Label>
              <Select
                value={formData.dealId}
                onValueChange={(v) => setFormData({ ...formData, dealId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a deal" />
                </SelectTrigger>
                <SelectContent>
                  {deals?.map((deal: { id: string; name: string }) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="daysBefore">Days Before Due Date</Label>
              <Select
                value={formData.daysBefore}
                onValueChange={(v) => setFormData({ ...formData, daysBefore: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day before</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="7">7 days before</SelectItem>
                  <SelectItem value="14">14 days before</SelectItem>
                  <SelectItem value="30">30 days before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="notifications@example.com"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
