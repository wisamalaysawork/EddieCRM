"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Eye, Briefcase, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Milestone {
  percent: string
  amount: string
}

interface Deal {
  id: string
  name: string
  status: string
  clientPaymentAmount: number
  partnerCost: number
  commissionAmount: number
  profit: number
  client?: { id: string; name: string; type: string } | null
  source?: { id: string; name: string; type: string } | null
  partner?: { id: string; name: string; type: string } | null
  payments: Array<{
    id: string
    amount: number
    status: string
    type: string
  }>
}

export function DealsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals")
      if (!res.ok) throw new Error("Failed to fetch deals")
      return res.json()
    },
  })

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients")
      if (!res.ok) throw new Error("Failed to fetch clients")
      return res.json()
    },
    enabled: isCreateOpen,
  })

  const { data: sources } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch("/api/sources")
      if (!res.ok) throw new Error("Failed to fetch sources")
      return res.json()
    },
    enabled: isCreateOpen,
  })

  const { data: partners } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const res = await fetch("/api/partners")
      if (!res.ok) throw new Error("Failed to fetch partners")
      return res.json()
    },
    enabled: isCreateOpen,
  })

  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    sourceId: "",
    partnerId: "",
    // Client Payment fields
    clientPaymentAmount: "",
    clientPaymentType: "ONE_TIME",
    clientPaymentDueDate: "",
    clientPaymentMonths: "",
    clientPaymentStartDate: "",
    // Source Commission fields
    commissionType: "ONE_TIME",
    commissionValue: "",
    commissionDueDate: "",
    commissionMonths: "",
    commissionStartDate: "",
    // Partner Payment fields
    partnerCost: "",
    partnerPaymentType: "ONE_TIME",
    partnerPaymentDueDate: "",
    partnerPaymentMonths: "",
    partnerPaymentStartDate: "",
    // Notes
    notes: "",
  })

  const [clientMilestones, setClientMilestones] = useState<Milestone[]>([{ percent: "0", amount: "" }])
  const [commissionMilestones, setCommissionMilestones] = useState<Milestone[]>([{ percent: "0", amount: "" }])
  const [partnerMilestones, setPartnerMilestones] = useState<Milestone[]>([{ percent: "0", amount: "" }])

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: Record<string, unknown> = { ...data }
      if (data.clientPaymentType === "MULTI_PAYMENT") {
        payload.clientProgressMilestones = JSON.stringify(
          clientMilestones.map(m => ({ percent: parseFloat(m.percent) || 0, amount: parseFloat(m.amount) || 0 }))
        )
        payload.clientPaymentAmount = clientMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toString()
      }
      if (data.commissionType === "MULTI_PAYMENT") {
        payload.commissionProgressMilestones = JSON.stringify(
          commissionMilestones.map(m => ({ percent: parseFloat(m.percent) || 0, amount: parseFloat(m.amount) || 0 }))
        )
        payload.commissionValue = commissionMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toString()
      }
      if (data.partnerPaymentType === "MULTI_PAYMENT") {
        payload.partnerProgressMilestones = JSON.stringify(
          partnerMilestones.map(m => ({ percent: parseFloat(m.percent) || 0, amount: parseFloat(m.amount) || 0 }))
        )
        payload.partnerCost = partnerMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toString()
      }
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create deal")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      setIsCreateOpen(false)
      setFormData({
        name: "",
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
        notes: "",
      })
      toast({
        title: "Success",
        description: "Deal created successfully",
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

  const filteredDeals = deals?.filter((deal) => {
    const matchesSearch = deal.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = amount ?? 0
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(safeAmount)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }
    createMutation.mutate(formData)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      NEW: "bg-blue-50 text-blue-700 border-blue-200",
      IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
      DELIVERED: "bg-purple-50 text-purple-700 border-purple-200",
      CLOSED: "bg-gray-50 text-gray-700 border-gray-200",
      PAID: "bg-green-50 text-green-700 border-green-200",
    }
    return (
      <Badge variant="outline" className={styles[status] || ""}>
        {status.replace("_", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Manage your projects: Client → Source → Partner
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : filteredDeals && filteredDeals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Client Amount</TableHead>
                  <TableHead>Partner Cost</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link
                        href={`/deals/${deal.id}`}
                        className="font-medium hover:underline"
                      >
                        {deal.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {deal.client ? (
                        <Link href={`/clients/${deal.client.id}`} className="hover:underline">
                          {deal.client.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {deal.source ? (
                        <Link href={`/sources/${deal.source.id}`} className="hover:underline">
                          {deal.source.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {deal.partner ? (
                        <Link href={`/partners/${deal.partner.id}`} className="hover:underline">
                          {deal.partner.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(deal.clientPaymentAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(deal.partnerCost)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-yellow-600">
                        {formatCurrency(deal.commissionAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${deal.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(deal.profit)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(deal.status)}</TableCell>
                    <TableCell>
                      <Link href={`/deals/${deal.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No deals found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Deal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <DialogDescription>
              Set up a new deal: Client → Source → Partner flow
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Project Info */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E-commerce Platform Development"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) => setFormData({ ...formData, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c: { id: string; name: string }) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.sourceId}
                  onValueChange={(v) => setFormData({ ...formData, sourceId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources?.map((s: { id: string; name: string }) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner">Partner</Label>
                <Select
                  value={formData.partnerId}
                  onValueChange={(v) => setFormData({ ...formData, partnerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners?.map((p: { id: string; name: string }) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client Payment Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-1">Client Payment (Client pays Eddie)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {formData.clientPaymentType === "MONTHLY"
                  ? "Enter the <strong>monthly payment amount</strong>. This amount will be paid each month."
                  : "Enter the <strong>total payment amount</strong> for one-time payment."}
              </p>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="clientPaymentAmount">
                    {formData.clientPaymentType === "MONTHLY" ? "Monthly Amount" : "Payment Amount"}
                  </Label>
                  <Input
                    id="clientPaymentAmount"
                    type="number"
                    value={formData.clientPaymentAmount}
                    onChange={(e) => setFormData({ ...formData, clientPaymentAmount: e.target.value })}
                    placeholder={formData.clientPaymentType === "MONTHLY" ? "2700" : "15000"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPaymentType">Payment Type</Label>
                  <Select
                    value={formData.clientPaymentType}
                    onValueChange={(v) => setFormData({ ...formData, clientPaymentType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONE_TIME">One-Time</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="MULTI_PAYMENT">Multi Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.clientPaymentType === "ONE_TIME" && (
                  <div className="space-y-2">
                    <Label htmlFor="clientPaymentDueDate">Payment Due Date</Label>
                    <Input
                      id="clientPaymentDueDate"
                      type="date"
                      value={formData.clientPaymentDueDate}
                      onChange={(e) => setFormData({ ...formData, clientPaymentDueDate: e.target.value })}
                    />
                  </div>
                )}
                {formData.clientPaymentType === "MONTHLY" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="clientPaymentMonths">Number of Months</Label>
                      <Input
                        id="clientPaymentMonths"
                        type="number"
                        min="1"
                        value={formData.clientPaymentMonths}
                        onChange={(e) => setFormData({ ...formData, clientPaymentMonths: e.target.value })}
                        placeholder="12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPaymentStartDate">First Payment Date</Label>
                      <Input
                        id="clientPaymentStartDate"
                        type="date"
                        value={formData.clientPaymentStartDate}
                        onChange={(e) => setFormData({ ...formData, clientPaymentStartDate: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {formData.clientPaymentType === "MULTI_PAYMENT" && (
                  <div className="space-y-3 md:col-span-4">
                    <Label>Payment Milestones</Label>
                    {clientMilestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0" max="100"
                          placeholder="% Complete"
                          value={m.percent}
                          onChange={(e) => {
                            const updated = [...clientMilestones]
                            updated[i] = { ...updated[i], percent: e.target.value }
                            setClientMilestones(updated)
                          }}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={m.amount}
                          onChange={(e) => {
                            const updated = [...clientMilestones]
                            updated[i] = { ...updated[i], amount: e.target.value }
                            setClientMilestones(updated)
                          }}
                          className="flex-1"
                        />
                        {clientMilestones.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setClientMilestones(clientMilestones.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setClientMilestones([...clientMilestones, { percent: "", amount: "" }])}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Milestone
                    </Button>
                    <p className="text-sm text-blue-600">
                      Total: {formatCurrency(clientMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0))}
                    </p>
                  </div>
                )}
              </div>
              {formData.clientPaymentType === "MONTHLY" && formData.clientPaymentAmount && formData.clientPaymentMonths && (
                <p className="text-sm text-green-600 mt-2">
                  Total from client: {formatCurrency(parseFloat(formData.clientPaymentAmount) * parseInt(formData.clientPaymentMonths))} ({formatCurrency(parseFloat(formData.clientPaymentAmount))}/month × {formData.clientPaymentMonths} months)
                </p>
              )}
            </div>

            {/* Source Commission Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-1">Source Commission (Eddie pays Source)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Commission paid to the source who brought you this project. For MONTHLY, enter the amount per month.
              </p>
              <div className="grid gap-6 md:grid-cols-4">
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
                      <SelectItem value="MULTI_PAYMENT">Multi Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionValue">
                    {formData.commissionType === "PERCENTAGE" ? "Commission %" : formData.commissionType === "MONTHLY" ? "Monthly Amount" : "Commission Amount"}
                  </Label>
                  <Input
                    id="commissionValue"
                    type="number"
                    value={formData.commissionValue}
                    onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                    placeholder={formData.commissionType === "PERCENTAGE" ? "10" : formData.commissionType === "MONTHLY" ? "500" : "5000"}
                  />
                </div>
                {formData.commissionType === "ONE_TIME" && (
                  <div className="space-y-2">
                    <Label htmlFor="commissionDueDate">Payment Due Date</Label>
                    <Input
                      id="commissionDueDate"
                      type="date"
                      value={formData.commissionDueDate}
                      onChange={(e) => setFormData({ ...formData, commissionDueDate: e.target.value })}
                    />
                  </div>
                )}
                {formData.commissionType === "MONTHLY" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="commissionMonths">Number of Months</Label>
                      <Input
                        id="commissionMonths"
                        type="number"
                        min="1"
                        value={formData.commissionMonths}
                        onChange={(e) => setFormData({ ...formData, commissionMonths: e.target.value })}
                        placeholder="12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commissionStartDate">First Payment Date</Label>
                      <Input
                        id="commissionStartDate"
                        type="date"
                        value={formData.commissionStartDate}
                        onChange={(e) => setFormData({ ...formData, commissionStartDate: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {formData.commissionType === "PERCENTAGE" && (
                  <div className="space-y-2">
                    <Label htmlFor="commissionDueDate">Payment Due Date</Label>
                    <Input
                      id="commissionDueDate"
                      type="date"
                      value={formData.commissionDueDate}
                      onChange={(e) => setFormData({ ...formData, commissionDueDate: e.target.value })}
                    />
                  </div>
                )}
                {formData.commissionType === "MULTI_PAYMENT" && (
                  <div className="space-y-3 md:col-span-4">
                    <Label>Commission Milestones</Label>
                    {commissionMilestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0" max="100"
                          placeholder="% Complete"
                          value={m.percent}
                          onChange={(e) => {
                            const updated = [...commissionMilestones]
                            updated[i] = { ...updated[i], percent: e.target.value }
                            setCommissionMilestones(updated)
                          }}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={m.amount}
                          onChange={(e) => {
                            const updated = [...commissionMilestones]
                            updated[i] = { ...updated[i], amount: e.target.value }
                            setCommissionMilestones(updated)
                          }}
                          className="flex-1"
                        />
                        {commissionMilestones.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setCommissionMilestones(commissionMilestones.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCommissionMilestones([...commissionMilestones, { percent: "", amount: "" }])}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Milestone
                    </Button>
                    <p className="text-sm text-orange-600">
                      Total: {formatCurrency(commissionMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0))}
                    </p>
                  </div>
                )}
              </div>
              {formData.commissionType === "MONTHLY" && formData.commissionValue && formData.commissionMonths && (
                <p className="text-sm text-orange-600 mt-2">
                  Total commission: {formatCurrency(parseFloat(formData.commissionValue) * parseInt(formData.commissionMonths))} ({formatCurrency(parseFloat(formData.commissionValue))}/month × {formData.commissionMonths} months)
                </p>
              )}
              {formData.commissionType === "PERCENTAGE" && formData.commissionValue && formData.clientPaymentAmount && (
                <p className="text-sm text-orange-600 mt-2">
                  Commission amount: {formatCurrency(parseFloat(formData.clientPaymentAmount) * parseFloat(formData.commissionValue) / 100)} ({formData.commissionValue}% of {formatCurrency(parseFloat(formData.clientPaymentAmount))})
                </p>
              )}
            </div>

            {/* Partner Payment Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-1">Partner Payment (Eddie pays Partner)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {formData.partnerPaymentType === "MONTHLY"
                  ? "Enter the <strong>monthly payment amount</strong>. This amount will be paid to the partner each month."
                  : "Enter the <strong>total payment amount</strong> for one-time payment."}
              </p>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="partnerCost">
                    {formData.partnerPaymentType === "MONTHLY" ? "Monthly Amount" : "Payment Amount"}
                  </Label>
                  <Input
                    id="partnerCost"
                    type="number"
                    value={formData.partnerCost}
                    onChange={(e) => setFormData({ ...formData, partnerCost: e.target.value })}
                    placeholder={formData.partnerPaymentType === "MONTHLY" ? "1700" : "10000"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partnerPaymentType">Payment Type</Label>
                  <Select
                    value={formData.partnerPaymentType}
                    onValueChange={(v) => setFormData({ ...formData, partnerPaymentType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONE_TIME">One-Time</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="MULTI_PAYMENT">Multi Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.partnerPaymentType === "ONE_TIME" && (
                  <div className="space-y-2">
                    <Label htmlFor="partnerPaymentDueDate">Payment Due Date</Label>
                    <Input
                      id="partnerPaymentDueDate"
                      type="date"
                      value={formData.partnerPaymentDueDate}
                      onChange={(e) => setFormData({ ...formData, partnerPaymentDueDate: e.target.value })}
                    />
                  </div>
                )}
                {formData.partnerPaymentType === "MONTHLY" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="partnerPaymentMonths">Number of Months</Label>
                      <Input
                        id="partnerPaymentMonths"
                        type="number"
                        min="1"
                        value={formData.partnerPaymentMonths}
                        onChange={(e) => setFormData({ ...formData, partnerPaymentMonths: e.target.value })}
                        placeholder="12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partnerPaymentStartDate">First Payment Date</Label>
                      <Input
                        id="partnerPaymentStartDate"
                        type="date"
                        value={formData.partnerPaymentStartDate}
                        onChange={(e) => setFormData({ ...formData, partnerPaymentStartDate: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {formData.partnerPaymentType === "MULTI_PAYMENT" && (
                  <div className="space-y-3 md:col-span-4">
                    <Label>Partner Milestones</Label>
                    {partnerMilestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0" max="100"
                          placeholder="% Complete"
                          value={m.percent}
                          onChange={(e) => {
                            const updated = [...partnerMilestones]
                            updated[i] = { ...updated[i], percent: e.target.value }
                            setPartnerMilestones(updated)
                          }}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={m.amount}
                          onChange={(e) => {
                            const updated = [...partnerMilestones]
                            updated[i] = { ...updated[i], amount: e.target.value }
                            setPartnerMilestones(updated)
                          }}
                          className="flex-1"
                        />
                        {partnerMilestones.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setPartnerMilestones(partnerMilestones.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPartnerMilestones([...partnerMilestones, { percent: "", amount: "" }])}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Milestone
                    </Button>
                    <p className="text-sm text-purple-600">
                      Total: {formatCurrency(partnerMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0))}
                    </p>
                  </div>
                )}
              </div>
              {formData.partnerPaymentType === "MONTHLY" && formData.partnerCost && formData.partnerPaymentMonths && (
                <p className="text-sm text-purple-600 mt-2">
                  Total to partner: {formatCurrency(parseFloat(formData.partnerCost) * parseInt(formData.partnerPaymentMonths))} ({formatCurrency(parseFloat(formData.partnerCost))}/month × {formData.partnerPaymentMonths} months)
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>

            {/* Profit Summary */}
            {(formData.clientPaymentAmount || formData.clientPaymentType === "MULTI_PAYMENT") && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Deal Summary</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Client pays Eddie:</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(
                        formData.clientPaymentType === "MULTI_PAYMENT"
                          ? clientMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
                          : formData.clientPaymentType === "MONTHLY"
                            ? (parseFloat(formData.clientPaymentAmount) || 0) * (parseInt(formData.clientPaymentMonths) || 1)
                            : (parseFloat(formData.clientPaymentAmount) || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Partner cost:</span>
                    <span className="font-medium text-orange-600">
                      -{formatCurrency(
                        formData.partnerPaymentType === "MULTI_PAYMENT"
                          ? partnerMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
                          : formData.partnerPaymentType === "MONTHLY"
                            ? (parseFloat(formData.partnerCost) || 0) * (parseInt(formData.partnerPaymentMonths) || 1)
                            : (parseFloat(formData.partnerCost) || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source commission:</span>
                    <span className="font-medium text-yellow-600">
                      -{formatCurrency(
                        formData.commissionType === "MULTI_PAYMENT"
                          ? commissionMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
                          : formData.commissionType === "PERCENTAGE"
                            ? (() => {
                              const ct = formData.clientPaymentType === "MULTI_PAYMENT"
                                ? clientMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
                                : formData.clientPaymentType === "MONTHLY"
                                  ? (parseFloat(formData.clientPaymentAmount) || 0) * (parseInt(formData.clientPaymentMonths) || 1)
                                  : (parseFloat(formData.clientPaymentAmount) || 0);
                              return ct * (parseFloat(formData.commissionValue) || 0) / 100
                            })()
                            : formData.commissionType === "MONTHLY"
                              ? (parseFloat(formData.commissionValue) || 0) * (parseInt(formData.commissionMonths) || 1)
                              : (parseFloat(formData.commissionValue) || 0)
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Your Profit:</span>
                    {(() => {
                      const clientTotal = formData.clientPaymentType === "MULTI_PAYMENT"
                        ? clientMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
                        : formData.clientPaymentType === "MONTHLY"
                          ? (parseFloat(formData.clientPaymentAmount) || 0) * (parseInt(formData.clientPaymentMonths) || 1)
                          : (parseFloat(formData.clientPaymentAmount) || 0)
                      const partnerTotal = formData.partnerPaymentType === "MULTI_PAYMENT"
                        ? partnerMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
                        : formData.partnerPaymentType === "MONTHLY"
                          ? (parseFloat(formData.partnerCost) || 0) * (parseInt(formData.partnerPaymentMonths) || 1)
                          : (parseFloat(formData.partnerCost) || 0)
                      const commissionTotal = formData.commissionType === "MULTI_PAYMENT"
                        ? commissionMilestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
                        : formData.commissionType === "PERCENTAGE"
                          ? clientTotal * (parseFloat(formData.commissionValue) || 0) / 100
                          : formData.commissionType === "MONTHLY"
                            ? (parseFloat(formData.commissionValue) || 0) * (parseInt(formData.commissionMonths) || 1)
                            : (parseFloat(formData.commissionValue) || 0)
                      const profit = clientTotal - partnerTotal - commissionTotal
                      return (
                        <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(profit)}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Deal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
