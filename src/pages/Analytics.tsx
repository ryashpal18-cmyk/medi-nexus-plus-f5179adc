import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Users, TrendingUp, Receipt, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { isElectron } from "@/lib/electronBridge";

const COLORS = [
  "hsl(210, 80%, 35%)", "hsl(185, 65%, 45%)", "hsl(142, 70%, 40%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Patient = { id?: string; created_at?: string; mobile?: string };
type Bill = { id?: string; created_at?: string; amount?: number; amount_paid?: number; status?: string; service?: string };

function buildLast6Months(): { key: string; month: string; year: number; m: number }[] {
  const out: { key: string; month: string; year: number; m: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: MONTHS[d.getMonth()],
      year: d.getFullYear(),
      m: d.getMonth(),
    });
  }
  return out;
}

async function loadOfflinePatients(): Promise<Patient[]> {
  // Try Electron IPC first
  try {
    const ipc = (window as Window).ipcRenderer;
    if (ipc?.invoke) {
      const data = await ipc.invoke("read-local-data", "patients");
      if (Array.isArray(data)) return data as Patient[];
    }
  } catch { /* ignore */ }
  // Browser mirror fallback
  try {
    const raw = localStorage.getItem("balaji.localData");
    if (raw) {
      const store = JSON.parse(raw);
      if (Array.isArray(store?.patients)) return store.patients;
    }
  } catch { /* ignore */ }
  return [];
}

export default function Analytics() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [physioCount, setPhysioCount] = useState(0);
  const [source, setSource] = useState<"cloud" | "offline">("cloud");

  const fetchAll = async () => {
    const online = typeof navigator === "undefined" || navigator.onLine;
    if (online) {
      const [{ data: p }, { data: b }, { data: ph }] = await Promise.all([
        supabase.from("patients").select("id, created_at, mobile"),
        supabase.from("billing").select("id, created_at, amount, amount_paid, status, service"),
        supabase.from("physiotherapy_sessions").select("id, created_at"),
      ]);
      setPatients((p as Patient[]) ?? []);
      setBills((b as Bill[]) ?? []);
      setPhysioCount((ph ?? []).filter((s: { created_at?: string }) => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length);
      setSource("cloud");
    } else if (isElectron()) {
      const local = await loadOfflinePatients();
      setPatients(local);
      setBills([]);
      setPhysioCount(0);
      setSource("offline");
    }
  };

  useEffect(() => {
    fetchAll();
    // Realtime: refresh when patients/billing change
    const channel = supabase
      .channel("analytics-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "billing" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "physiotherapy_sessions" }, fetchAll)
      .subscribe();
    const onOnline = () => fetchAll();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
    };
  }, []);

  const months = useMemo(buildLast6Months, []);

  const monthlyPatients = useMemo(() => {
    return months.map((mm) => ({
      month: mm.month,
      patients: patients.filter((p) => {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return d.getMonth() === mm.m && d.getFullYear() === mm.year;
      }).length,
    }));
  }, [patients, months]);

  const revenueData = useMemo(() => {
    return months.map((mm) => ({
      month: mm.month,
      revenue: bills.reduce((sum, b) => {
        if (!b.created_at) return sum;
        const d = new Date(b.created_at);
        if (d.getMonth() !== mm.m || d.getFullYear() !== mm.year) return sum;
        return sum + Number(b.amount_paid ?? 0);
      }, 0),
    }));
  }, [bills, months]);

  const totalPatients = patients.length;

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    return bills.reduce((sum, b) => {
      if (!b.created_at) return sum;
      const d = new Date(b.created_at);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return sum;
      return sum + Number(b.amount_paid ?? 0);
    }, 0);
  }, [bills]);

  const pendingDues = useMemo(
    () => bills.reduce((sum, b) => sum + Math.max(0, Number(b.amount ?? 0) - Number(b.amount_paid ?? 0)), 0),
    [bills],
  );

  const serviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bills) {
      const key = (b.service || "Other").toString();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const total = Object.values(counts).reduce((a, c) => a + c, 0) || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }));
  }, [bills]);

  const fmtINR = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString("en-IN")}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="module-header">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Clinic performance overview · {source === "cloud" ? "Live data" : "Offline backup"}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Patients" value={totalPatients.toLocaleString("en-IN")} icon={Users} variant="primary" />
          <StatCard title="Monthly Revenue" value={fmtINR(monthlyRevenue)} icon={TrendingUp} variant="success" />
          <StatCard title="Pending Dues" value={fmtINR(pendingDues)} icon={Receipt} variant="warning" />
          <StatCard title="Physio Sessions" value={physioCount} icon={Activity} variant="secondary" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Monthly Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyPatients}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="patients" fill="hsl(210, 80%, 35%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(val: number) => `₹${val.toLocaleString("en-IN")}`} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(185, 65%, 45%)" strokeWidth={2} dot={{ fill: "hsl(185, 65%, 45%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading text-base">Service Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {serviceBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No billing data yet.</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={serviceBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                        {serviceBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3">
                    {serviceBreakdown.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2 text-sm">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{s.name} ({s.value}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
