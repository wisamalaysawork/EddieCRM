"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CreditCard,
  Settings,
  Menu,
  X,
  Bell,
  UserCircle,
} from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: UserCircle },
  { name: "Sources", href: "/sources", icon: Users },
  { name: "Partners", href: "/partners", icon: Building2 },
  { name: "Deals", href: "/deals", icon: Briefcase },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reminders", href: "/reminders", icon: Bell },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-24 px-6 border-b border-slate-800">
          <Link href="/" className="flex flex-col gap-0">
            <span className="font-heading text-2xl font-light tracking-widest uppercase">Eddie</span>
            <span className="text-[10px] tracking-[0.3em] font-bold text-slate-500 uppercase -mt-1">Partners CRM</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200 group",
                  isActive
                    ? "bg-white text-slate-950 font-bold shadow-lg shadow-white/10 scale-105"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-slate-950" : "text-slate-500 group-hover:text-white")} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen luxury-gradient">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-full px-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex-1" />
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
