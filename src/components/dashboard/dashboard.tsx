"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Briefcase,
  Users,
  ArrowRight,
  CheckCircle2,
  UserCircle,
  Building2,
  Calendar,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
}

interface DashboardData {
  activeDeals: number
  totalProfit: number
  pendingClientPayments: number
  pendingSourcePayments: number
  pendingPartnerPayments: number
  totalClients: number
  totalSources: number
  totalPartners: number
  upcomingPayments: Array<{
    id: string
    amount: number
    dueDate: string
    status: string
    type: string
    deal: { id: string, name: string }
    client?: { name: string }
    source?: { name: string }
    partner?: { name: string }
  }>
  urgentPayments: Array<{
    id: string
    amount: number
    dueDate: string
    type: string
    deal: { id: string, name: string }
  }>
  overduePayments: Array<{
    id: string
    amount: number
    dueDate: string
    type: string
    deal: { id: string, name: string }
  }>
  recentDeals: Array<{
    id: string
    name: string
    status: string
    client?: { name: string }
    source?: { name: string }
    partner?: { name: string }
    updatedAt: string
  }>
}

export function Dashboard() {
  const [isIssuesOpen, setIsIssuesOpen] = useState(false)
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error("Failed to fetch dashboard")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      DELIVERED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      CLOSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      PAID: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      PENDING: "bg-yellow-100 text-yellow-700",
      OVERDUE: "bg-red-100 text-red-700",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  const getPaymentTypeLabel = (type: string, payment: { client?: { name: string }; source?: { name: string }; partner?: { name: string } }) => {
    switch (type) {
      case "CLIENT_PAYMENT":
        return `From: ${payment.client?.name || "Client"}`
      case "SOURCE_COMMISSION":
        return `To: ${payment.source?.name || "Source"}`
      case "PARTNER_PAYMENT":
        return `To: ${payment.partner?.name || "Partner"}`
      default:
        return type
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      <motion.div variants={item} className="flex items-end justify-between border-b pb-6 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-5xl font-heading font-black tracking-tighter text-luxury uppercase">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            A refined overview of your current business flow.
          </p>
        </div>
        <Link href="/deals">
          <Button className="rounded-full px-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black">
            <Briefcase className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </Link>
      </motion.div>

      {/* Primary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Deals", value: dashboardData?.activeDeals || 0, icon: Briefcase, color: "text-slate-600" },
          { label: "Total Profit", value: formatCurrency(dashboardData?.totalProfit || 0), icon: TrendingUp, color: "text-emerald-600" },
          { label: "Owed to Sources", value: formatCurrency(dashboardData?.pendingSourcePayments || 0), icon: Users, color: "text-orange-600" },
          { label: "Partner Liabilities", value: formatCurrency(dashboardData?.pendingPartnerPayments || 0), icon: DollarSign, color: "text-yellow-600" },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="glass-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground group-hover:rotate-12 transition-transform" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className={cn("text-3xl font-heading", stat.color)}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {/* Status Highlights */}
        <motion.div variants={item} className="space-y-6">
          <h2 className="text-2xl font-heading mb-4 border-l-4 border-slate-900 dark:border-white pl-4">Priority Actions</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Pending from Clients */}
            <Card className="relative overflow-hidden border-none bg-slate-900 text-white dark:bg-white dark:text-black">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <DollarSign size={100} />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Receivables</CardTitle>
                <CardDescription className="text-slate-400 dark:text-slate-500">
                  Awaiting from clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-heading">
                  {formatCurrency(dashboardData?.pendingClientPayments || 0)}
                </div>
              </CardContent>
            </Card>

            {/* Overdue Alert */}
            <Card
              className={cn(
                "relative overflow-hidden border-none transition-all cursor-pointer group",
                (dashboardData?.overduePayments?.length || 0) > 0
                  ? "bg-red-600 text-white animate-pulse hover:animate-none hover:bg-red-700"
                  : "bg-emerald-600 text-white"
              )}
              onClick={() => (dashboardData?.overduePayments?.length || 0) > 0 && setIsIssuesOpen(true)}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                {(dashboardData?.overduePayments?.length || 0) > 0 ? <AlertTriangle size={100} /> : <CheckCircle2 size={100} />}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Critical Status</CardTitle>
                <CardDescription className="text-white/60">
                  {(dashboardData?.overduePayments?.length || 0) > 0 ? "Urgent attention required (Click to view)" : "System in equilibrium"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-heading">
                  {dashboardData?.overduePayments?.length || 0} Issues
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Contacts Column */}
        <motion.div variants={item} className="space-y-6">
          <h2 className="text-2xl font-heading mb-4 border-l-4 border-slate-900 dark:border-white pl-4">Network</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "End Clients", value: dashboardData?.totalClients || 0, icon: UserCircle, sub: "Direct entities" },
              { label: "Project Sources", value: dashboardData?.totalSources || 0, icon: Users, sub: "Referral partners" },
              { label: "Operation Partners", value: dashboardData?.totalPartners || 0, icon: Building2, sub: "Execution teams" },
            ].map((item, i) => (
              <Card key={i} className="glass-card hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <item.icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-heading">{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Overdue Issues Dialog */}
      <Dialog open={isIssuesOpen} onOpenChange={setIsIssuesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <DialogTitle className="text-2xl font-heading uppercase font-black">Overdue Issues</DialogTitle>
            </div>
            <DialogDescription>
              The following payments are PAST DUE and require immediate action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dashboardData?.overduePayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-red-900 dark:text-red-100">{payment.deal.name}</p>
                    <Badge variant="outline" className="text-[10px] uppercase border-red-200 text-red-700">
                      {payment.type.split('_')[0]}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700/70 dark:text-red-300/50 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due on {format(new Date(payment.dueDate), "MMMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-heading text-red-600">{formatCurrency(payment.amount)}</p>
                    <p className="text-[10px] font-black uppercase text-red-500">PAST DUE</p>
                  </div>
                  <Link href={`/deals/${payment.deal.id}`}>
                    <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsIssuesOpen(false)}>Close</Button>
            <Link href="/payments" onClick={() => setIsIssuesOpen(false)}>
              <Button className="bg-slate-900 text-white">Go to Ledger</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 lg:grid-cols-2 mt-8">
        {/* Upcoming Payments */}
        <motion.div variants={item}>
          <Card className="glass-card h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-heading">Payment Schedule</CardTitle>
                <CardDescription>Next 30 days of expected liquidity</CardDescription>
              </div>
              <Calendar className="h-6 w-6 text-muted-foreground opacity-50" />
            </CardHeader>
            <CardContent>
              {dashboardData?.upcomingPayments && dashboardData.upcomingPayments.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.upcomingPayments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="group flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl hover:shadow-md transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold">{payment.deal.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(payment.dueDate), "MMM dd")}
                          </span>
                          <span className="opacity-30">|</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                            payment.type === "CLIENT_PAYMENT" ? "bg-blue-100 text-blue-700" :
                              payment.type === "SOURCE_COMMISSION" ? "bg-orange-100 text-orange-700" :
                                "bg-yellow-100 text-yellow-700"
                          )}>
                            {payment.type.split('_')[0]}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-heading">{formatCurrency(payment.amount)}</p>
                        <p className={cn("text-[10px] font-bold", getStatusColor(payment.status).split(' ')[1])}>
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Link href="/payments" className="block mt-4">
                    <Button variant="outline" className="w-full rounded-xl hover:bg-slate-900 hover:text-white transition-colors">
                      Complete Ledger
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-40">
                  <CheckCircle2 className="h-12 w-12 mb-4" />
                  <p className="font-heading text-xl">Clear Horizon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Deals */}
        <motion.div variants={item}>
          <Card className="glass-card h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-heading">Recent Journal</CardTitle>
                <CardDescription>Latest deal architecture updates</CardDescription>
              </div>
              <Briefcase className="h-6 w-6 text-muted-foreground opacity-50" />
            </CardHeader>
            <CardContent>
              {dashboardData?.recentDeals && dashboardData.recentDeals.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentDeals.map((deal) => (
                    <Link key={deal.id} href={`/deals/${deal.id}`} className="block">
                      <div className="group flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl hover:shadow-md transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                        <div className="space-y-1">
                          <p className="font-semibold group-hover:text-emerald-600 transition-colors">{deal.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {deal.client?.name || "Private Client"}
                            <ArrowRight size={10} className="mx-1 opacity-30" />
                            {deal.partner?.name || "Unassigned"}
                          </p>
                        </div>
                        <Badge variant="secondary" className={cn("rounded-full px-3 py-1 text-[10px]", getStatusColor(deal.status))}>
                          {deal.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  <Link href="/deals" className="block mt-4">
                    <Button variant="outline" className="w-full rounded-xl hover:bg-slate-900 hover:text-white transition-colors">
                      Archive Access
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-40">
                  <Briefcase className="h-12 w-12 mb-4" />
                  <p className="font-heading text-xl">Empty Journal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
