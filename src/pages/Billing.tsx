import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, Plus, MessageCircle, Printer, Trash2, Pencil, Download, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBills, useAddBill, usePatients, useUpdateBill } from "@/hooks/useDatabase";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

const statusStyle: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Partial: "bg-info/10 text-info",
};

const SERVICE_OPTIONS = [
  "OPD Consultation",
  "X-Ray",
  "Physiotherapy",
  "Procedure",
  "IPD Stay",
  "Plaster",
  "MOT Charge",
  "Medicine",
  "Dressing",
  "Injection",
  "Blood Test",
  "Other",
];

interface ServiceItem {
  name: string;
  amount: string;
}

function getSMSText(patientName: string, services: string, totalAmount: number, date: string, invoiceNo: string, pdfLink: string) {
  return `Balaji Ortho Care Center

Patient Name: ${patientName}
Service: ${services}
Amount: ₹${totalAmount.toLocaleString()}
Date: ${date}
Invoice No: ${invoiceNo}

Download Invoice PDF:
${pdfLink}

View reports & book appointment online:
https://balaji-health-hub.lovable.app/

Contact: +91 8005707783
Thank you for visiting.`;
}

function openSMS(mobile: string, text: string) {
  const cleanMobile = mobile?.replace(/\D/g, "") || "";
  const num = cleanMobile.startsWith("91") ? cleanMobile : `91${cleanMobile}`;
  // sms: link works on mobile devices
  const smsUrl = `sms:+${num}?body=${encodeURIComponent(text)}`;
  window.open(smsUrl, "_self");
}

function getWhatsAppBillLink(patient: string, mobile: string, amount: number, services: string, status: string) {
  const msg = `Namaste ${patient},\n\nBalaji Ortho Care Center\nDr. S. S. Rathore (DMRT | BPT)\n\n📋 Bill Details:\n${services}\n\n💰 Total: ₹${amount.toLocaleString()}\n📌 Status: ${status}\n\nDhanyawad!\n📞 +91 8005707783`;
  const cleanMobile = mobile?.replace(/\D/g, "") || "";
  const num = cleanMobile.startsWith("91") ? cleanMobile : `91${cleanMobile}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

function getWhatsAppReminderLink(patient: string, mobile: string, amount: number) {
  const msg = `Namaste ${patient}, Balaji Ortho Care Center se nivedan hai ki aapka Rs. ${amount} pending hai. Kripya clinic par jama karein. Dhanyawad!`;
  const cleanMobile = mobile?.replace(/\D/g, "") || "";
  const num = cleanMobile.startsWith("91") ? cleanMobile : `91${cleanMobile}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

function buildInvoiceHTML(bill: any, logoUrl: string = "/images/logo.png") {
  const patientName = (bill.patients as any)?.name || "Patient";
  const invoiceNo = `INV-${bill.id.slice(0, 8).toUpperCase()}`;
  const date = new Date(bill.created_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const services = bill.service.split("|").map((s: string) => {
    const parts = s.trim().split(":");
    return { name: parts[0]?.trim() || s.trim(), amount: parts[1] ? Number(parts[1].trim()) : Number(bill.amount) };
  });
  const totalAmount = services.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

  const serviceRows = services.map((s: any, i: number) => `
    <tr>
      <td style="padding:5px 10px;color:#334155;font-size:10px;">${i + 1}</td>
      <td style="padding:5px 10px;color:#334155;font-size:10px;">${s.name}</td>
      <td style="padding:5px 10px;text-align:right;color:#334155;font-size:10px;">₹${Number(s.amount).toLocaleString()}</td>
    </tr>
  `).join("");

  return `
    <div style="
      width: 5.5in;
      height: 4.1in;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      border: 1.5px solid #e0e0e0;
      border-radius: 8px;
      background: #fff;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      page-break-inside: avoid;
    ">
      <svg style="position:absolute;top:0;left:0;width:180px;height:90px;z-index:0;" viewBox="0 0 220 120" fill="none">
        <path d="M0 0 H220 C180 30 140 80 0 120 Z" fill="#0891b2" opacity="0.13"/>
        <path d="M0 0 H180 C140 25 100 60 0 90 Z" fill="#06b6d4" opacity="0.18"/>
      </svg>
      <svg style="position:absolute;bottom:0;right:0;width:160px;height:80px;z-index:0;" viewBox="0 0 200 100" fill="none">
        <path d="M200 100 H0 C40 70 80 30 200 0 Z" fill="#0891b2" opacity="0.10"/>
        <path d="M200 100 H30 C60 75 100 40 200 15 Z" fill="#06b6d4" opacity="0.14"/>
      </svg>

      <div style="position:relative;z-index:1;padding:12px 16px 10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="${logoUrl}" style="width:40px;height:40px;object-fit:contain;" alt="Logo" />
            <div>
              <div style="font-size:13px;font-weight:800;color:#1e3a5f;">Balaji Ortho Care Center</div>
              <div style="font-size:8px;color:#475569;margin-top:1px;">Dr. S. S. Rathore (DMRT | BPT)</div>
              <div style="font-size:7px;color:#64748b;">Opp Govt Hospital, Bay Pass Road, Khinwara, Raj. – 306502</div>
              <div style="font-size:7px;color:#64748b;">Phone: +91 8005707783</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px;font-weight:800;color:#0891b2;letter-spacing:1px;">INVOICE</div>
            <div style="font-size:8px;color:#64748b;margin-top:2px;">${invoiceNo}</div>
            <div style="font-size:8px;color:#64748b;">Date: ${date}</div>
          </div>
        </div>

        <div style="height:1.5px;background:linear-gradient(90deg,#0891b2,#1e3a5f);border-radius:2px;margin-bottom:8px;"></div>

        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <div>
            <div style="font-size:7px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Bill To</div>
            <div style="font-size:11px;font-weight:700;color:#1e3a5f;margin-top:1px;">${patientName}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:7px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Status</div>
            <div style="font-size:10px;font-weight:700;color:${bill.status === "Paid" ? "#16a34a" : bill.status === "Pending" ? "#ea580c" : "#0284c7"};margin-top:1px;">${bill.status}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:6px;font-size:10px;">
          <thead>
            <tr style="background:#f0f9ff;">
              <th style="text-align:left;padding:4px 10px;color:#1e3a5f;font-weight:600;border-bottom:1px solid #e2e8f0;font-size:9px;">#</th>
              <th style="text-align:left;padding:4px 10px;color:#1e3a5f;font-weight:600;border-bottom:1px solid #e2e8f0;font-size:9px;">Service</th>
              <th style="text-align:right;padding:4px 10px;color:#1e3a5f;font-weight:600;border-bottom:1px solid #e2e8f0;font-size:9px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${serviceRows}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid #0891b2;">
              <td colspan="2" style="padding:6px 10px;font-weight:800;color:#1e3a5f;font-size:11px;">Grand Total</td>
              <td style="padding:6px 10px;text-align:right;font-weight:800;color:#0891b2;font-size:12px;">₹${totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:5px;">
          <span style="font-size:7px;color:#94a3b8;">Medix Medical Invoice</span>
          <div style="font-size:7px;color:#94a3b8;">Thank you for choosing Balaji Ortho Care Center</div>
        </div>
      </div>
    </div>
  `;
}

function printInvoice(bill: any) {
  const logoUrl = window.location.origin + "/images/logo.png";
  const win = window.open("", "_blank", "width=700,height=1000");
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
        @page { size: 5.5in 8.5in; margin: 5mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .page {
          width: 5.5in;
          height: 8.5in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 4mm;
          padding: 2mm;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${buildInvoiceHTML(bill, logoUrl)}
        ${buildInvoiceHTML(bill, logoUrl)}
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

async function generateAndUploadPDF(bill: any): Promise<string | null> {
  const logoUrl = window.location.origin + "/images/logo.png";
  const html = buildInvoiceHTML(bill, logoUrl);

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  try {
    const pdfBlob = await html2pdf()
      .set({
        margin: 2,
        filename: `invoice.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: [5.5, 8.5], orientation: "portrait" },
      })
      .from(container)
      .outputPdf("blob");

    const invoiceNo = `INV-${bill.id.slice(0, 8).toUpperCase()}`;
    const fileName = `${invoiceNo}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);

    // Save URL to billing record
    await supabase.from("billing").update({ invoice_pdf_url: urlData.publicUrl } as any).eq("id", bill.id);

    return urlData.publicUrl;
  } catch (err) {
    console.error("PDF generation error:", err);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

function sendBillWhatsApp(bill: any) {
  const patient = (bill.patients as any);
  const mobile = patient?.mobile || "";
  const name = patient?.name || "Patient";
  if (!mobile) {
    return null;
  }
  const serviceList = bill.service.split("|").map((s: string) => {
    const parts = s.trim().split(":");
    return `• ${parts[0]?.trim()}: ₹${parts[1]?.trim() || bill.amount}`;
  }).join("\n");
  return getWhatsAppBillLink(name, mobile, Number(bill.amount), serviceList, bill.status);
}

export default function Billing() {
  const { data: bills, isLoading } = useBills();
  const { data: patients } = usePatients();
  const addBill = useAddBill();
  const updateBill = useUpdateBill();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([{ name: "", amount: "" }]);
  const [isSending, setIsSending] = useState(false);

  const addServiceRow = () => setServices(prev => [...prev, { name: "", amount: "" }]);
  const removeServiceRow = (idx: number) => setServices(prev => prev.filter((_, i) => i !== idx));
  const updateService = (idx: number, field: keyof ServiceItem, value: string) => {
    setServices(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const totalAmount = services.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const validServices = services.filter(s => s.name && s.amount);
    if (!selectedPatient || validServices.length === 0) {
      toast({ title: "Error", description: "Patient और कम से कम एक service ज़रूरी है", variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      const serviceStr = validServices.map(s => `${s.name}:${s.amount}`).join("|");
      const result = await addBill.mutateAsync({
        patient_id: selectedPatient,
        service: serviceStr,
        amount: totalAmount,
      });

      toast({ title: "Bill Created", description: "Generating PDF & preparing SMS..." });

      // Generate PDF and upload
      const pdfUrl = await generateAndUploadPDF(result);
      const patient = (result.patients as any);
      const patientName = patient?.name || "Patient";
      const mobile = patient?.mobile || "";
      const invoiceNo = `INV-${result.id.slice(0, 8).toUpperCase()}`;
      const date = new Date(result.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const displayServices = validServices.map(s => s.name).join(", ");

      if (pdfUrl && mobile) {
        const smsText = getSMSText(patientName, displayServices, totalAmount, date, invoiceNo, pdfUrl);
        openSMS(mobile, smsText);
        toast({ title: "✅ SMS Ready", description: "SMS sharing screen opened" });
      } else if (!mobile) {
        toast({ title: "⚠️ No Mobile", description: "Patient का mobile number नहीं है, SMS नहीं भेजा जा सका", variant: "destructive" });
      } else {
        toast({ title: "⚠️ PDF Error", description: "PDF upload में error, WhatsApp से भेजा जाएगा", variant: "destructive" });
        const whatsappUrl = sendBillWhatsApp(result);
        if (whatsappUrl) window.open(whatsappUrl, "_blank");
      }

      setSelectedPatient("");
      setServices([{ name: "", amount: "" }]);
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleResendSMS = async (bill: any) => {
    const patient = (bill.patients as any);
    const mobile = patient?.mobile || "";
    const patientName = patient?.name || "Patient";
    if (!mobile) {
      toast({ title: "Error", description: "Patient का mobile number नहीं है", variant: "destructive" });
      return;
    }

    const invoiceNo = `INV-${bill.id.slice(0, 8).toUpperCase()}`;
    const date = new Date(bill.created_at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
    const displayServices = bill.service.split("|").map((s: string) => s.split(":")[0].trim()).join(", ");

    let pdfUrl = (bill as any).invoice_pdf_url;

    // If no stored PDF URL, generate one now
    if (!pdfUrl) {
      toast({ title: "Generating PDF...", description: "Please wait" });
      pdfUrl = await generateAndUploadPDF(bill);
    }

    if (pdfUrl) {
      const smsText = getSMSText(patientName, displayServices, Number(bill.amount), date, invoiceNo, pdfUrl);
      openSMS(mobile, smsText);
    } else {
      toast({ title: "Error", description: "PDF generate नहीं हो पाया", variant: "destructive" });
    }
  };

  const handleEdit = (bill: any) => {
    setEditingBill(bill);
    const parsedServices = bill.service.split("|").map((s: string) => {
      const parts = s.trim().split(":");
      return { name: parts[0]?.trim() || "", amount: parts[1]?.trim() || String(bill.amount) };
    });
    setServices(parsedServices);
    setEditOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;
    const validServices = services.filter(s => s.name && s.amount);
    if (validServices.length === 0) {
      toast({ title: "Error", description: "कम से कम एक service ज़रूरी है", variant: "destructive" });
      return;
    }
    try {
      const serviceStr = validServices.map(s => `${s.name}:${s.amount}`).join("|");
      const newTotal = validServices.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      await updateBill.mutateAsync({
        id: editingBill.id,
        service: serviceStr,
        amount: newTotal,
      });
      toast({ title: "Success", description: "Bill updated!" });
      setEditOpen(false);
      setEditingBill(null);
      setServices([{ name: "", amount: "" }]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const exportToExcel = () => {
    if (!bills || bills.length === 0) {
      toast({ title: "No data", description: "कोई bill data नहीं है export करने के लिए", variant: "destructive" });
      return;
    }
    const data = bills.map((bill) => {
      const patient = bill.patients as any;
      const displayService = bill.service.includes("|")
        ? bill.service.split("|").map((s: string) => s.split(":")[0].trim()).join(", ")
        : bill.service;
      return {
        "Patient Name": patient?.name || "",
        "Age": "",
        "Mobile": patient?.mobile || "",
        "Village/Address": patient?.address || "",
        "Service": displayService,
        "Amount (₹)": Number(bill.amount),
        "Status": bill.status,
        "Date": new Date(bill.created_at).toLocaleDateString("en-IN"),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patient Bills");
    XLSX.writeFile(wb, `Patient_Bills_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Exported!", description: "Excel file download हो गई" });
  };

  const renderServiceForm = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Services</Label>
        <Button type="button" variant="outline" size="sm" onClick={addServiceRow} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add Service
        </Button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {services.map((s, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Select value={s.name} onValueChange={v => updateService(idx, "name", v)}>
              <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Service" /></SelectTrigger>
              <SelectContent>
                {SERVICE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="₹"
              className="w-24 h-9"
              value={s.amount}
              onChange={e => updateService(idx, "amount", e.target.value)}
            />
            {services.length > 1 && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeServiceRow(idx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="module-header">Billing</h1>
            <p className="text-sm text-muted-foreground">Manage invoices, receipts, and payments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={exportToExcel}>
              <Download className="h-4 w-4" /> Excel Export
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />New Bill</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-heading">New Bill</DialogTitle></DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>
                        {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {renderServiceForm()}
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total Amount</span>
                    <span className="text-lg font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <Button type="submit" className="w-full" disabled={addBill.isPending || isSending}>
                    {isSending ? "Generating PDF & SMS..." : addBill.isPending ? "Creating..." : "Save Bill & Send SMS"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit Bill Dialog */}
        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { setEditingBill(null); setServices([{ name: "", amount: "" }]); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Edit Bill</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Patient: <span className="text-primary">{(editingBill?.patients as any)?.name}</span></p>
              </div>
              {renderServiceForm()}
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total Amount</span>
                <span className="text-lg font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
              </div>
              <Button type="submit" className="w-full" disabled={updateBill.isPending}>
                {updateBill.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

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
                    {bills?.map(bill => {
                      const patient = bill.patients as any;
                      const displayService = bill.service.includes("|")
                        ? bill.service.split("|").map((s: string) => s.split(":")[0].trim()).join(", ")
                        : bill.service;
                      return (
                        <tr key={bill.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 font-medium">{patient?.name}</td>
                          <td className="py-3 hidden sm:table-cell text-muted-foreground text-xs">{displayService}</td>
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
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(bill)} title="Edit Bill">
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printInvoice(bill)} title="Print">
                                <Printer className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => handleResendSMS(bill)} title="Resend SMS">
                                <Send className="h-3 w-3" />
                              </Button>
                              {bill.status !== "Paid" && patient?.mobile && (
                                <a href={getWhatsAppReminderLink(patient?.name || "", patient?.mobile || "", Number(bill.amount))} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-success" title="WhatsApp Reminder"><MessageCircle className="h-3 w-3" /></Button>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
