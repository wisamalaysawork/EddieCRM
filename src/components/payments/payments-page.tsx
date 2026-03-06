"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, CreditCard, CheckCircle2, Clock, AlertTriangle, ArrowUpDown, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Payment {
  id: string
  type: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
  notes: string | null
  deal: {
    id: string
    name: string
    status: string
    clientPaymentType?: string
    commissionType?: string
    partnerPaymentType?: string
  }
  client?: {
    id: string
    name: string
  }
  source?: {
    id: string
    name: string
  }
  partner?: {
    id: string
    name: string
  }
}

export function PaymentsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "PAID" | "OVERDUE">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "CLIENT_PAYMENT" | "SOURCE_COMMISSION" | "PARTNER_PAYMENT">("all")
  const [agreementTypeFilter, setAgreementTypeFilter] = useState<"all" | "ONE_TIME" | "MONTHLY" | "MULTI_PAYMENT" | "PERCENTAGE">("all")
  const [markPaidId, setMarkPaidId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments")
      if (!res.ok) throw new Error("Failed to fetch payments")
      return res.json()
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      })
      if (!res.ok) throw new Error("Failed to mark payment as paid")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setMarkPaidId(null)
      toast({
        title: "Success",
        description: "Payment marked as paid",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      })
    },
  })

  const getAgreementType = (payment: Payment) => {
    switch (payment.type) {
      case "CLIENT_PAYMENT":
        return payment.deal.clientPaymentType || "ONE_TIME"
      case "SOURCE_COMMISSION":
        return payment.deal.commissionType || "ONE_TIME"
      case "PARTNER_PAYMENT":
        return payment.deal.partnerPaymentType || "ONE_TIME"
      default:
        return "ONE_TIME"
    }
  }

  const filteredPayments = payments
    ?.filter((payment) => {
      const matchesSearch =
        payment.deal.name.toLowerCase().includes(search.toLowerCase()) ||
        payment.client?.name.toLowerCase().includes(search.toLowerCase()) ||
        payment.source?.name.toLowerCase().includes(search.toLowerCase()) ||
        payment.partner?.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter
      const matchesType = typeFilter === "all" || payment.type === typeFilter
      const matchesAgreement = agreementTypeFilter === "all" || getAgreementType(payment) === agreementTypeFilter
      return matchesSearch && matchesStatus && matchesType && matchesAgreement
    })
    .sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime()
      const dateB = new Date(b.dueDate).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
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
      PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      PAID: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="h-4 w-4" />
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeInfo = (type: string) => {
    switch (type) {
      case "CLIENT_PAYMENT":
        return {
          label: "Client Payment",
          color: "border-green-200 text-green-700 dark:border-green-800 dark:text-green-300 bg-green-50 dark:bg-green-950",
          icon: <ArrowDownLeft className="h-3 w-3 mr-1" />,
          direction: "IN" // Money coming in
        }
      case "SOURCE_COMMISSION":
        return {
          label: "Source Commission",
          color: "border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-950",
          icon: <ArrowUpRight className="h-3 w-3 mr-1" />,
          direction: "OUT" // Money going out
        }
      case "PARTNER_PAYMENT":
        return {
          label: "Partner Payment",
          color: "border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950",
          icon: <ArrowUpRight className="h-3 w-3 mr-1" />,
          direction: "OUT" // Money going out
        }
      default:
        return {
          label: type,
          color: "border-gray-200 text-gray-700",
          icon: null,
          direction: "UNKNOWN"
        }
    }
  }

  const getPartyName = (payment: Payment) => {
    switch (payment.type) {
      case "CLIENT_PAYMENT":
        return payment.client?.name || "-"
      case "SOURCE_COMMISSION":
        return payment.source?.name || "-"
      case "PARTNER_PAYMENT":
        return payment.partner?.name || "-"
      default:
        return "-"
    }
  }

  // Calculate summary stats by type
  const clientPaymentsTotal = payments?.filter((p) => p.type === "CLIENT_PAYMENT" && p.status !== "PAID").reduce((sum, p) => sum + p.amount, 0) || 0
  const sourceCommissionTotal = payments?.filter((p) => p.type === "SOURCE_COMMISSION" && p.status !== "PAID").reduce((sum, p) => sum + p.amount, 0) || 0
  const partnerPaymentsTotal = payments?.filter((p) => p.type === "PARTNER_PAYMENT" && p.status !== "PAID").reduce((sum, p) => sum + p.amount, 0) || 0

  const pendingTotal = payments?.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0) || 0
  const overdueTotal = payments?.filter((p) => p.status === "OVERDUE").reduce((sum, p) => sum + p.amount, 0) || 0
  const paidTotal = payments?.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track all incoming (from clients) and outgoing (to sources/partners) payments
          </p>
        </div>
      </div>

      {/* Summary Cards - By Payment Type */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
              From Clients (Pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(clientPaymentsTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Money to receive</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-orange-600" />
              To Sources (Pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(sourceCommissionTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Commission to pay</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-purple-600" />
              To Partners (Pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(partnerPaymentsTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Project costs to pay</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards - By Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(pendingTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(overdueTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(paidTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                <SelectItem value="CLIENT_PAYMENT">Client Payment</SelectItem>
                <SelectItem value="SOURCE_COMMISSION">Source Commission</SelectItem>
                <SelectItem value="PARTNER_PAYMENT">Partner Payment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agreementTypeFilter} onValueChange={(v) => setAgreementTypeFilter(v as typeof agreementTypeFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ONE_TIME">One-Time</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="MULTI_PAYMENT">Multi Payments</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={sortOrder === "asc" ? "Sort by date (newest first)" : "Sort by date (oldest first)"}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="w-[200px] font-semibold">Deal</TableHead>
                    <TableHead className="w-[160px] font-semibold">Type</TableHead>
                    <TableHead className="w-[160px] font-semibold">Party</TableHead>
                    <TableHead className="w-[180px] font-semibold">Milestone / Notes</TableHead>
                    <TableHead className="w-[130px] font-semibold">Due Date</TableHead>
                    <TableHead className="w-[120px] font-semibold text-right">Amount</TableHead>
                    <TableHead className="w-[110px] font-semibold">Status</TableHead>
                    <TableHead className="w-[100px] font-semibold text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const typeInfo = getTypeInfo(payment.type)
                    return (
                      <TableRow key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell className="w-[200px]">
                          <Link
                            href={`/deals/${payment.deal.id}`}
                            className="font-medium text-primary hover:underline line-clamp-1"
                          >
                            {payment.deal.name}
                          </Link>
                        </TableCell>
                        <TableCell className="w-[160px]">
                          <Badge
                            variant="outline"
                            className={typeInfo.color}
                          >
                            <span className="flex items-center">
                              {typeInfo.icon}
                              {typeInfo.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[160px]">
                          <span className="line-clamp-1">
                            {getPartyName(payment)}
                          </span>
                        </TableCell>
                        <TableCell className="w-[180px]">
                          <span className="text-sm text-muted-foreground line-clamp-2" title={payment.notes || ""}>
                            {payment.notes || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="w-[130px] whitespace-nowrap">
                          {format(new Date(payment.dueDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="w-[120px] text-right font-semibold whitespace-nowrap">
                          <span className={payment.type === "CLIENT_PAYMENT" ? "text-green-600" : "text-orange-600"}>
                            {payment.type === "CLIENT_PAYMENT" ? "+" : "-"}{formatCurrency(payment.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="w-[110px]">
                          <Badge className={`${getStatusColor(payment.status)} whitespace-nowrap`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          {payment.status !== "PAID" ? (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setMarkPaidId(payment.id)}
                              className="whitespace-nowrap"
                            >
                              Mark Paid
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark as Paid Confirmation Dialog */}
      <Dialog open={!!markPaidId} onOpenChange={() => setMarkPaidId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payment as Paid</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this payment as paid? This will record today&apos;s date
              as the payment date.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => markPaidId && markPaidMutation.mutate(markPaidId)}
              disabled={markPaidMutation.isPending}
            >
              {markPaidMutation.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
