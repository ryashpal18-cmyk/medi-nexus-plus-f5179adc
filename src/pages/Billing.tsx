import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function buildInvoiceHTML(bill: any, index: number, logoUrl: string = "/images/logo.png") {
  const patientName = (bill.patients as any)?.name || "Patient";
  const invoiceNo = `INV-${bill.id.slice(0, 8).toUpperCase()}`;
  const date = new Date(bill.created_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const amount = Number(bill.amount).toLocaleString();

  return `
    <div style="
      width: 100%;
      height: 48%;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      border: 1.5px solid #e0e0e0;
      border-radius: 10px;
      background: #fff;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      page-break-inside: avoid;
    ">
      <!-- Top-left cyan wave -->
      <svg style="position:absolute;top:0;left:0;width:220px;height:120px;z-index:0;" viewBox="0 0 220 120" fill="none">
        <path d="M0 0 H220 C180 30 140 80 0 120 Z" fill="#0891b2" opacity="0.13"/>
        <path d="M0 0 H180 C140 25 100 60 0 90 Z" fill="#06b6d4" opacity="0.18"/>
      </svg>
      <!-- Bottom-right cyan wave -->
      <svg style="position:absolute;bottom:0;right:0;width:200px;height:100px;z-index:0;" viewBox="0 0 200 100" fill="none">
        <path d="M200 100 H0 C40 70 80 30 200 0 Z" fill="#0891b2" opacity="0.10"/>
        <path d="M200 100 H30 C60 75 100 40 200 15 Z" fill="#06b6d4" opacity="0.14"/>
      </svg>

      <div style="position:relative;z-index:1;padding:18px 24px 14px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${logoUrl}" style="width:50px;height:50px;object-fit:contain;" alt="Logo" />
            <div>
              <div style="font-size:17px;font-weight:800;color:#1e3a5f;letter-spacing:-0.3px;">Balaji Ortho Care Center</div>
              <div style="font-size:10px;color:#475569;margin-top:2px;">Dr. S. S. Rathore (DMRT | BPT)</div>
              <div style="font-size:9px;color:#64748b;margin-top:1px;">Opp Govt Hospital, Bay Pass Road, Khinwara, Raj. – 306502</div>
              <div style="font-size:9px;color:#64748b;">Phone: +91 8005707783</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:800;color:#0891b2;letter-spacing:1px;">INVOICE</div>
            <div style="font-size:9px;color:#64748b;margin-top:3px;">${invoiceNo}</div>
            <div style="font-size:9px;color:#64748b;">Date: ${date}</div>
          </div>
        </div>

        <!-- Divider -->
        <div style="height:2px;background:linear-gradient(90deg,#0891b2,#1e3a5f);border-radius:2px;margin-bottom:12px;"></div>

        <!-- Patient info -->
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <div>
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Bill To</div>
            <div style="font-size:13px;font-weight:700;color:#1e3a5f;margin-top:2px;">${patientName}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Status</div>
            <div style="font-size:11px;font-weight:700;color:${bill.status === "Paid" ? "#16a34a" : bill.status === "Pending" ? "#ea580c" : "#0284c7"};margin-top:2px;">${bill.status}</div>
          </div>
        </div>

        <!-- Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:11px;">
          <thead>
            <tr style="background:#f0f9ff;">
              <th style="text-align:left;padding:6px 10px;color:#1e3a5f;font-weight:600;border-bottom:1px solid #e2e8f0;">#</th>
              <th style="text-align:left;padding:6px 10px;color:#1e3a5f;font-weight:600;border-bottom:1px solid #e2e8f0;">Service</th>
              <th style="text-align:right;padding:6px 10px;color:#1e3a5f;font-weight:600;border-bottom:1px solid #e2e8f0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:6px 10px;color:#334155;">1</td>
              <td style="padding:6px 10px;color:#334155;">${bill.service}</td>
              <td style="padding:6px 10px;text-align:right;color:#334155;">₹${amount}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid #0891b2;">
              <td colspan="2" style="padding:8px 10px;font-weight:800;color:#1e3a5f;font-size:12px;">Grand Total</td>
              <td style="padding:8px 10px;text-align:right;font-weight:800;color:#0891b2;font-size:14px;">₹${amount}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Footer -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:8px;">
          <div style="display:flex;gap:6px;align-items:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <span style="font-size:8px;color:#94a3b8;">Medix Medical Invoice</span>
          </div>
          <div style="font-size:8px;color:#94a3b8;">Thank you for choosing Balaji Ortho Care Center</div>
        </div>
      </div>
    </div>
  `;
}

function printInvoice(bill: any) {
  const logoUrl = window.location.origin + "/images/logo.png";
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return;

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Invoice – ${(bill.patients as any)?.name || "Patient"}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #fff; }
        @page { size: A4 landscape; margin: 8mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .page {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10mm;
          padding: 4mm;
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${buildInvoiceHTML(bill, 1, logoUrl)}
        ${buildInvoiceHTML(bill, 2, logoUrl)}
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  win.document.write(invoiceHTML);
  win.document.close();
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printInvoice(bill)}>
                              <Printer className="h-3 w-3" />
                            </Button>
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
