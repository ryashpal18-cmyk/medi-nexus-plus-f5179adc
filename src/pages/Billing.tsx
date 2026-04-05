import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, Plus, MessageCircle, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBills, useAddBill, usePatients, useUpdateBill } from "@/hooks/useDatabase";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const statusStyle: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Partial: "bg-info/10 text-info",
};

function getWhatsAppLink(patient: string, amount: number) {
  const msg = `Namaste ${patient}, Balaji Ortho Care Center se nivedan hai ki aapka Rs. ${amount} pending hai. Kripya clinic par jama karein. Dhanyawad!`;
  return `https://wa.me/918005707783?text=${encodeURIComponent(msg)}`;
}

export default function Billing() {
  const { data: bills, isLoading } = useBills();
  const { data: patients } = usePatients();
  const addBill = useAddBill();
  const updateBill = useUpdateBill();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: "", service: "", amount: "" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id || !form.service || !form.amount) {
      toast({ title: "Error", description: "All fields required", variant: "destructive" });
      return;
    }
    try {
      await addBill.mutateAsync({
        patient_id: form.patient_id,
        service: form.service,
        amount: parseFloat(form.amount),
      });
      toast({ title: "Success", description: "Bill created!" });
      setForm({ patient_id: "", service: "", amount: "" });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="module-header">Billing</h1>
            <p className="text-sm text-muted-foreground">Manage invoices, receipts, and payments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />New Bill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">New Bill</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={form.patient_id} onValueChange={v => setForm(p => ({ ...p, patient_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select value={form.service} onValueChange={v => setForm(p => ({ ...p, service: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPD Consultation">OPD Consultation</SelectItem>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                      <SelectItem value="Procedure">Procedure</SelectItem>
                      <SelectItem value="IPD Stay">IPD Stay</SelectItem>
                      <SelectItem value="Plaster">Plaster</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" placeholder="500" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
                </div>
                <Button type="submit" className="w-full" disabled={addBill.isPending}>
                  {addBill.isPending ? "Creating..." : "Create Bill"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              All Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-2 font-medium">Patient</th>
                      <th className="text-left py-2 font-medium hidden sm:table-cell">Service</th>
                      <th className="text-right py-2 font-medium">Amount</th>
                      <th className="text-center py-2 font-medium">Status</th>
                      <th className="text-right py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills?.map(bill => (
                      <tr key={bill.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-medium">{(bill.patients as any)?.name}</td>
                        <td className="py-3 hidden sm:table-cell text-muted-foreground">{bill.service}</td>
                        <td className="py-3 text-right font-medium">₹{Number(bill.amount).toLocaleString()}</td>
                        <td className="py-3 text-center">
                          <Select value={bill.status} onValueChange={v => updateBill.mutate({ id: bill.id, status: v })}>
                            <SelectTrigger className={cn("h-7 w-20 text-[10px] border-0 mx-auto", statusStyle[bill.status] || "")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Partial">Partial</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Printer className="h-3 w-3" /></Button>
                            {bill.status !== "Paid" && (
                              <a href={getWhatsAppLink((bill.patients as any)?.name || "", Number(bill.amount))} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-success"><MessageCircle className="h-3 w-3" /></Button>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
