"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Percent,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useState, useMemo } from "react"

interface DealDetailData {
  id: string
  name: string
  status: string
  clientPaymentAmount: number
  clientPaymentType: string
  clientPaymentDueDate: string | null
  clientPaymentMonths: number | null
  clientPaymentStartDate: string | null
  commissionType: string
  commissionValue: number
  commissionDueDate: string | null
  commissionMonths: number | null
  commissionStartDate: string | null
  partnerCost: number
  partnerPaymentType: string
  partnerPaymentDueDate: string | null
  partnerPaymentMonths: number | null
  partnerPaymentStartDate: string | null
  notes: string | null
  commissionAmount: number
  paidCommissions: number
  remainingCommissions: number
  paidPartnerCost: number
  remainingPartnerCost: number
  paidClientPayments: number
  remainingClientPayments: number
  profit: number
  client?: {
    id: string
    name: string
    type: string
    contactEmail?: string
  } | null
  source?: {
    id: string
    name: string
    type: string
    contactEmail?: string
  } | null
  partner?: {
    id: string
    name: string
    type: string
    contactEmail?: string
  } | null
  payments: Array<{
    id: string
    type: string
    amount: number
    dueDate: string
    paidDate: string | null
    status: string
    notes: string | null
    client?: { name: string }
    source?: { name: string }
    partner?: { name: string }
  }>
}

export function DealDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCommissionEditOpen, setIsCommissionEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null)

  const { data: deal, isLoading } = useQuery<DealDetailData>({
    queryKey: ["deal", id],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${id}`)
      if (!res.ok) throw new Error("Failed to fetch deal")
      return res.json()
    },
  })

  const { data: sources } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch("/api/sources")
      if (!res.ok) throw new Error("Failed to fetch sources")
      return res.json()
    },
  })

  const { data: partners } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["partners"],
    queryFn: async () => {
      const res = await fetch("/api/partners")
      if (!res.ok) throw new Error("Failed to fetch partners")
      return res.json()
    },
  })

  const initialFormData = useMemo(() => {
    if (!deal) return {
      name: "",
      status: "NEW",
      notes: "",
      clientId: "",
      sourceId: "",
      partnerId: "",
      clientPaymentAmount: "",
      clientPaymentType: "ONE_TIME",
      clientPaymentDueDate: "",
      clientPaymentMonths: "",
      clientPaymentStartDate: "",
      commissionType: "ONE_TIME",
      commissionValue: "",
      commissionDueDate: "",
      commissionMonths: "",
      commissionStartDate: "",
      partnerCost: "",
      partnerPaymentType: "ONE_TIME",
      partnerPaymentDueDate: "",
      partnerPaymentMonths: "",
      partnerPaymentStartDate: "",
    }
    return {
      name: deal.name,
      status: deal.status,
      notes: deal.notes || "",
      clientId: deal.client?.id || "",
      sourceId: deal.source?.id || "",
      partnerId: deal.partner?.id || "",
      clientPaymentAmount: deal.clientPaymentAmount?.toString() || "0",
      clientPaymentType: deal.clientPaymentType || "ONE_TIME",
      clientPaymentDueDate: deal.clientPaymentDueDate ? deal.clientPaymentDueDate.split('T')[0] : "",
      clientPaymentMonths: deal.clientPaymentMonths?.toString() || "",
      clientPaymentStartDate: deal.clientPaymentStartDate ? deal.clientPaymentStartDate.split('T')[0] : "",
      commissionType: deal.commissionType || "ONE_TIME",
      commissionValue: deal.commissionValue?.toString() || "0",
      commissionDueDate: deal.commissionDueDate ? deal.commissionDueDate.split('T')[0] : "",
      commissionMonths: deal.commissionMonths?.toString() || "",
      commissionStartDate: deal.commissionStartDate ? deal.commissionStartDate.split('T')[0] : "",
      partnerCost: deal.partnerCost?.toString() || "0",
      partnerPaymentType: deal.partnerPaymentType || "ONE_TIME",
      partnerPaymentDueDate: deal.partnerPaymentDueDate ? deal.partnerPaymentDueDate.split('T')[0] : "",
      partnerPaymentMonths: deal.partnerPaymentMonths?.toString() || "",
      partnerPaymentStartDate: deal.partnerPaymentStartDate ? deal.partnerPaymentStartDate.split('T')[0] : "",
    }
  }, [deal])

  const [formData, setFormData] = useState(initialFormData)

  const [lastDealId, setLastDealId] = useState<string | null>(null)
  if (deal && deal.id !== lastDealId) {
    setLastDealId(deal.id)
    setFormData(initialFormData)
  }

  const initialCommissionForm = useMemo(() => {
    if (!deal) return {
      commissionType: "ONE_TIME",
      commissionValue: "",
      commissionDueDate: "",
      commissionMonths: "",
      commissionStartDate: "",
    }
    return {
      commissionType: deal.commissionType || "ONE_TIME",
      commissionValue: deal.commissionValue?.toString() || "0",
      commissionDueDate: deal.commissionDueDate ? deal.commissionDueDate.split('T')[0] : "",
      commissionMonths: deal.commissionMonths?.toString() || "",
      commissionStartDate: deal.commissionStartDate ? deal.commissionStartDate.split('T')[0] : "",
    }
  }, [deal])

  const [commissionForm, setCommissionForm] = useState(initialCommissionForm)

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        status: data.status,
        notes: data.notes || null,
        sourceId: data.sourceId || undefined,
        partnerId: data.partnerId || undefined,
        sourcePaymentAmount: data.sourcePaymentAmount ? parseFloat(data.sourcePaymentAmount) : undefined,
        partnerCost: data.partnerCost ? parseFloat(data.partnerCost) : undefined,
        commissionType: data.commissionType,
        commissionValue: data.commissionValue ? parseFloat(data.commissionValue) : undefined,
        commissionDueDate: data.commissionDueDate || null,
        commissionMonths: data.commissionMonths ? parseInt(data.commissionMonths) : null,
        commissionStartDate: data.commissionStartDate || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      }
      const res = await fetch(`/api/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update deal")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", id] })
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      setIsEditOpen(false)
      toast({
        title: "Success",
        description: "Deal updated successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update deal",
        variant: "destructive",
      })
    },
  })

  const updateCommissionMutation = useMutation({
    mutationFn: async (data: typeof commissionForm) => {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionType: data.commissionType,
          commissionValue: parseFloat(data.commissionValue),
          commissionDueDate: data.commissionDueDate || null,
          commissionMonths: data.commissionMonths ? parseInt(data.commissionMonths) : null,
          commissionStartDate: data.commissionStartDate || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update commission")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", id] })
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      setIsCommissionEditOpen(false)
      toast({
        title: "Success",
        description: "Commission updated successfully. Pending payments have been recreated.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update commission",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deals/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete deal")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      router.push("/deals")
      toast({
        title: "Success",
        description: "Deal deleted successfully",
      })
    },
    onError: (error: Error) => {
      if (error.message.includes("not found")) {
        queryClient.invalidateQueries({ queryKey: ["deals"] })
        router.push("/deals")
        toast({
          title: "Info",
          description: "Deal was already deleted",
        })
        return
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete deal",
        variant: "destructive",
      })
    },
  })

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete payment")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", id] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      setDeletePaymentId(null)
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      })
    },
  })

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = amount ?? 0
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(safeAmount)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-700",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700",
      DELIVERED: "bg-purple-100 text-purple-700",
      CLOSED: "bg-gray-100 text-gray-700",
      PAID: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      OVERDUE: "bg-red-100 text-red-700",
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

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Deal not found</p>
        <Link href="/deals">
          <Button variant="link">Back to Deals</Button>
        </Link>
      </div>
    )
  }

  const sourcePayments = deal.payments.filter((p) => p.type === "SOURCE_COMMISSION")
  const partnerPayments = deal.payments.filter((p) => p.type === "PARTNER_PAYMENT")

  const totalCommissionPaid = sourcePayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0)
  const totalCommissionRemaining = sourcePayments
    .filter((p) => p.status !== "PAID")
    .reduce((sum, p) => sum + p.amount, 0)
  const commissionProgress = deal.commissionAmount > 0 
    ? (totalCommissionPaid / deal.commissionAmount) * 100 
    : 0

  const totalPartnerPaid = partnerPayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0)
  const totalPartnerRemaining = partnerPayments
    .filter((p) => p.status !== "PAID")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/deals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deal.name}</h1>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(deal.status)}>
                {deal.status.replace("_", " ")}
              </Badge>
              {deal.assignedUser && (
                <span className="text-sm text-muted-foreground">
                  Assigned to: {deal.assignedUser.name}
                </span>
              )}
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

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Source Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(deal.sourcePaymentAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Source Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(deal.commissionAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {deal.paidCommissions > 0 && (
                <span className="text-green-600">Paid: {formatCurrency(deal.paidCommissions)} • </span>
              )}
              <span className="text-yellow-600">Remaining: {formatCurrency(deal.remainingCommissions)}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Partner Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              -{formatCurrency(deal.partnerCost)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${deal.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(deal.profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((deal.profit / deal.sourcePaymentAmount) * 100).toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Commission Summary (Paid to Source)
              </CardTitle>
              <CardDescription>
                {deal.commissionType === "PERCENTAGE" 
                  ? `${deal.commissionValue}% of source payment`
                  : deal.commissionType === "MONTHLY"
                  ? `Monthly: ${formatCurrency(deal.commissionValue)} for ${deal.commissionMonths || 12} months`
                  : "One-time commission"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsCommissionEditOpen(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Modify Commission
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <p className="text-xl font-bold">{formatCurrency(deal.commissionAmount)}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalCommissionPaid)}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(totalCommissionRemaining)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{commissionProgress.toFixed(0)}%</span>
              </div>
              <Progress value={commissionProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <Link href={`/sources/${deal.source.id}`} className="font-medium hover:underline">
                  {deal.source.name}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partner</p>
                <Link href={`/partners/${deal.partner.id}`} className="font-medium hover:underline">
                  {deal.partner.name}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {deal.startDate ? format(new Date(deal.startDate), "MMM d, yyyy") : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {deal.endDate ? format(new Date(deal.endDate), "MMM d, yyyy") : "-"}
                </p>
              </div>
            </div>
            {deal.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{deal.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payments Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm text-muted-foreground">Source Commission</p>
                <p className="text-lg font-bold">
                  {sourcePayments.filter((p) => p.status === "PAID").length} / {sourcePayments.length}
                </p>
                <p className="text-xs text-muted-foreground">payments made</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm text-muted-foreground">Partner Payments</p>
                <p className="text-lg font-bold">
                  {partnerPayments.filter((p) => p.status === "PAID").length} / {partnerPayments.length}
                </p>
                <p className="text-xs text-muted-foreground">payments made</p>
              </div>
            </div>
            
            {partnerPayments.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-sm font-medium">Partner Payment Progress</p>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Paid: {formatCurrency(totalPartnerPaid)}</span>
                  <span>Remaining: {formatCurrency(totalPartnerRemaining)}</span>
                </div>
                <Progress 
                  value={deal.partnerCost > 0 ? (totalPartnerPaid / deal.partnerCost) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Source Commission Payments Table */}
      {sourcePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Source Commission Payments</CardTitle>
            <CardDescription>Commission payments to {deal.source.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Paid Date</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-center w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourcePayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(payment.dueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {payment.paidDate
                          ? format(new Date(payment.paidDate), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium text-right whitespace-nowrap">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletePaymentId(payment.id)}
                          title="Delete payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partner Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Payments</CardTitle>
          <CardDescription>Payments to {deal.partner.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {partnerPayments.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Paid Date</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-center w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(payment.dueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {payment.paidDate
                          ? format(new Date(payment.paidDate), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium text-right whitespace-nowrap">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletePaymentId(payment.id)}
                          title="Delete payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No partner payments scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Deal Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>
              Update deal information
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate(formData)
            }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceId">Source</Label>
                  <Select
                    value={formData.sourceId}
                    onValueChange={(v) => setFormData({ ...formData, sourceId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partnerId">Partner</Label>
                  <Select
                    value={formData.partnerId}
                    onValueChange={(v) => setFormData({ ...formData, partnerId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select partner" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Financial Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourcePaymentAmount">Source Payment Amount ($)</Label>
                  <Input
                    id="sourcePaymentAmount"
                    type="number"
                    value={formData.sourcePaymentAmount}
                    onChange={(e) => setFormData({ ...formData, sourcePaymentAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partnerCost">Partner Cost ($)</Label>
                  <Input
                    id="partnerCost"
                    type="number"
                    value={formData.partnerCost}
                    onChange={(e) => setFormData({ ...formData, partnerCost: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Commission</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionType">Commission Type</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(v) => setFormData({ ...formData, commissionType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONE_TIME">One-Time</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionValue">
                    {formData.commissionType === "PERCENTAGE" ? "Percentage (%)" : "Amount ($)"}
                  </Label>
                  <Input
                    id="commissionValue"
                    type="number"
                    value={formData.commissionValue}
                    onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Timeline</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
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

      {/* Commission Edit Dialog */}
      <Dialog open={isCommissionEditOpen} onOpenChange={setIsCommissionEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Commission</DialogTitle>
            <DialogDescription>
              Update commission settings. This will recreate pending commission payments.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateCommissionMutation.mutate(commissionForm)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Commission Type</Label>
              <Select
                value={commissionForm.commissionType}
                onValueChange={(v) => setCommissionForm({ ...commissionForm, commissionType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_TIME">One-Time</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {commissionForm.commissionType === "PERCENTAGE" ? "Percentage (%)" : "Amount ($)"}
              </Label>
              <Input
                type="number"
                value={commissionForm.commissionValue}
                onChange={(e) => setCommissionForm({ ...commissionForm, commissionValue: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCommissionEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCommissionMutation.isPending}>
                {updateCommissionMutation.isPending ? "Updating..." : "Update Commission"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Deal Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deal.name}&quot;? This will also delete all associated payments and reminders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Confirmation */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePaymentId && deletePaymentMutation.mutate(deletePaymentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
