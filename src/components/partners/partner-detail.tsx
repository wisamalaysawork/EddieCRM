"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, Edit, Trash2, DollarSign, Briefcase, Key } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface PartnerDetailData {
  id: string
  name: string
  type: string
  contactPhone: string | null
  contactEmail: string | null
  contactAddress: string | null
  notes: string | null
  isActive: boolean
  pendingPayments: number
  totalEarned: number
  deals: Array<{
    id: string
    name: string
    status: string
    partnerCost: number
    source?: { id: string; name: string }
    payments: Array<{
      id: string
      amount: number
      dueDate: string
      status: string
    }>
  }>
  payments: Array<{
    id: string
    amount: number
    dueDate: string
    paidDate: string | null
    status: string
    deal: { id: string; name: string }
  }>
  user?: {
    id: string
    email: string
    isActive: boolean
  }
}

export function PartnerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: partner, isLoading } = useQuery<PartnerDetailData>({
    queryKey: ["partner", id],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${id}`)
      if (!res.ok) throw new Error("Failed to fetch partner")
      return res.json()
    },
  })

  const [formData, setFormData] = useState({
    name: "",
    type: "INDIVIDUAL",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    notes: "",
    isActive: true,
  })

  // Update form data when partner loads
  const [hasSetForm, setHasSetForm] = useState(false)
  if (partner && !hasSetForm) {
    setFormData({
      name: partner.name,
      type: partner.type,
      contactPhone: partner.contactPhone || "",
      contactEmail: partner.contactEmail || "",
      contactAddress: partner.contactAddress || "",
      notes: partner.notes || "",
      isActive: partner.isActive,
    })
    setHasSetForm(true)
  }

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/partners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update partner")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", id] })
      queryClient.invalidateQueries({ queryKey: ["partners"] })
      setIsEditOpen(false)
      toast({
        title: "Success",
        description: "Partner updated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update partner",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/partners/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete partner")
      }
      return res.json()
    },
    onSuccess: () => {
      router.push("/partners")
      toast({
        title: "Success",
        description: "Partner deleted successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete partner",
        variant: "destructive",
      })
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-700",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700",
      DELIVERED: "bg-purple-100 text-purple-700",
      CLOSED: "bg-gray-100 text-gray-700",
      PAID: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Partner not found</p>
        <Link href="/partners">
          <Button variant="link">Back to Partners</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/partners">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{partner.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              {partner.type === "COMPANY" ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span>{partner.type === "COMPANY" ? "Company" : "Individual"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {partner.contactEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{partner.contactEmail}</span>
              </div>
            )}
            {partner.contactPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{partner.contactPhone}</span>
              </div>
            )}
            {partner.contactAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{partner.contactAddress}</span>
              </div>
            )}
            {partner.user && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span>Portal Access: {partner.user.email}</span>
                </div>
              </div>
            )}
            {partner.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">{partner.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(partner.totalEarned)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(partner.pendingPayments)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Total Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partner.deals.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deals */}
      <Card>
        <CardHeader>
          <CardTitle>Associated Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {partner.deals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Partner Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partner.deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                        {deal.name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatCurrency(deal.partnerCost)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(deal.status)}>
                        {deal.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {deal.payments.filter((p) => p.status === "PAID").length} / {deal.payments.length} paid
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No deals yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {partner.payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partner.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link href={`/deals/${payment.deal.id}`} className="hover:underline">
                        {payment.deal.name}
                      </Link>
                    </TableCell>
                    <TableCell>{format(new Date(payment.dueDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {payment.paidDate
                        ? format(new Date(payment.paidDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No payment history</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Partner</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate(formData)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.contactAddress}
                onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {partner.name}? This will permanently remove the partner and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
