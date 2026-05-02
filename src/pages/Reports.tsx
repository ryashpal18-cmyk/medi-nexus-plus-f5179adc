import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Upload, Loader2, ExternalLink, Printer, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { onPrinterCapture, isElectron } from "@/lib/electronBridge";

const CLINIC = {
  name: "Balaji Ortho Care Center",
  doctor: "Dr. S. S. Rathore (DMRT | BPT)",
  address: "Opp Govt Hospital, Bay Pass Road, Khinwara, Raj. – 306502",
};

interface XrayRow {
  id: string;
  patient_id: string;
  file_url: string | null;
  uploaded_at: string;
  report_type: string | null;
  patient_name?: string;
  patient_mobile?: string;
}

export default function Reports() {
  const [rows, setRows] = useState<XrayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [mobile, setMobile] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Printer-capture viewer state
  const [capture, setCapture] = useState<{ src: string; localPath: string } | null>(null);
  const [linkMobile, setLinkMobile] = useState("");
  const [linking, setLinking] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("xray_reports")
      .select("id, patient_id, file_url, uploaded_at, report_type")
      .order("uploaded_at", { ascending: false })
      .limit(200);

    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const ids = Array.from(new Set((data ?? []).map((r) => r.patient_id)));
    let patientsMap = new Map<string, { name: string; mobile: string | null }>();
    if (ids.length) {
      const { data: pts } = await supabase
        .from("patients")
        .select("id, name, mobile")
        .in("id", ids);
      pts?.forEach((p) => patientsMap.set(p.id, { name: p.name, mobile: p.mobile }));
    }

    setRows(
      (data ?? []).map((r) => ({
        ...r,
        patient_name: patientsMap.get(r.patient_id)?.name,
        patient_mobile: patientsMap.get(r.patient_id)?.mobile ?? undefined,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Listen for X-rays captured from the printer (Electron desktop only)
  useEffect(() => {
    const unsub = onPrinterCapture((imagePath) => {
      // Electron sends an absolute file path on C:\BalajiOrtho\captures\...
      // Convert to a viewable URL.
      const src = imagePath.startsWith("file://")
        ? imagePath
        : `file:///${imagePath.replace(/\\/g, "/")}`;
      setCapture({ src, localPath: imagePath });
      setLinkMobile("");
      toast({
        title: "🖨️ X-Ray Received",
        description: "Printer से नई image आई — patient से link करें",
      });
    });
    return unsub;
  }, []);

  const handleLinkCapture = async () => {
    if (!capture) return;
    if (!/^\d{10}$/.test(linkMobile)) {
      toast({ title: "Invalid mobile", description: "10-digit mobile डालें", variant: "destructive" });
      return;
    }
    setLinking(true);
    try {
      const { data: patient, error: pErr } = await supabase
        .from("patients")
        .select("id, name")
        .eq("mobile", linkMobile)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!patient) {
        toast({ title: "Patient not found", description: "पहले patient register करें", variant: "destructive" });
        return;
      }

      // Fetch the file from the local disk and upload to storage
      const res = await fetch(capture.src);
      const blob = await res.blob();
      const fileName = capture.localPath.split(/[\\/]/).pop() || `xray-${Date.now()}.png`;
      const path = `${patient.id}/${Date.now()}-${fileName}`;
      const { error: upErr } = await supabase.storage
        .from("xray-files")
        .upload(path, blob, { contentType: blob.type || "image/png" });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("xray_reports").insert({
        patient_id: patient.id,
        file_url: path,
        report_type: "X-Ray",
      });
      if (insErr) throw insErr;

      toast({ title: "✅ Linked", description: `X-Ray ${patient.name} से link हो गई` });
      setCapture(null);
      setLinkMobile("");
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Link failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  const handleUpload = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      toast({ title: "Invalid mobile", description: "Enter a 10-digit mobile number.", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "No file", description: "Please choose an X-ray file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { data: patient, error: pErr } = await supabase
        .from("patients")
        .select("id")
        .eq("mobile", mobile)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!patient) {
        toast({ title: "Patient not found", description: "Register the patient first.", variant: "destructive" });
        return;
      }

      const path = `${patient.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("xray-files").upload(path, file);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("xray_reports").insert({
        patient_id: patient.id,
        file_url: path,
        report_type: "X-Ray",
      });
      if (insErr) throw insErr;

      toast({ title: "Uploaded", description: "X-ray saved to patient record." });
      setFile(null);
      setMobile("");
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("xray-files").createSignedUrl(path, 60 * 60);
    if (error || !data) {
      toast({ title: "Cannot open", description: error?.message ?? "No URL", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.patient_name?.toLowerCase().includes(q) ||
      r.patient_mobile?.includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="module-header flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            X-Ray Records
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage patient X-ray files · {CLINIC.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Upload New X-Ray</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mobile">Patient Mobile (10 digits)</Label>
                <Input
                  id="mobile"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xray-file">X-Ray File (JPG, PNG, PDF)</Label>
                <Input
                  id="xray-file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload X-Ray"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="font-heading text-base">Recent X-Rays</CardTitle>
            <Input
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No X-ray records found.</p>
            ) : (
              <div className="divide-y">
                {filtered.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.patient_name ?? "Unknown patient"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.patient_mobile ?? "—"} · {new Date(r.uploaded_at).toLocaleString("en-IN")} · {r.report_type ?? "X-Ray"}
                      </div>
                    </div>
                    {r.file_url && (
                      <Button size="sm" variant="outline" onClick={() => openFile(r.file_url!)} className="gap-2 flex-shrink-0">
                        <ExternalLink className="h-4 w-4" /> View
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isElectron() && (
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <Printer className="h-3.5 w-3.5" />
            Printer Capture सक्रिय है — किसी भी X-Ray को print करते ही यहाँ Digital Viewer में दिखेगी।
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          <div className="font-semibold">{CLINIC.name} | {CLINIC.doctor}</div>
          <div>{CLINIC.address}</div>
        </div>
      </div>

      {/* Digital Viewer for printer-captured X-Rays */}
      <Dialog open={!!capture} onOpenChange={(v) => !v && setCapture(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" /> Digital X-Ray Viewer
            </DialogTitle>
          </DialogHeader>
          {capture && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={capture.src}
                  alt="Captured X-Ray"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground break-all">
                Local file: {capture.localPath}
              </p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                <div className="space-y-2">
                  <Label htmlFor="link-mobile">Patient Mobile (10 digits)</Label>
                  <Input
                    id="link-mobile"
                    inputMode="numeric"
                    maxLength={10}
                    value={linkMobile}
                    onChange={(e) => setLinkMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <Button onClick={handleLinkCapture} disabled={linking} className="gap-2">
                  {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  {linking ? "Linking..." : "Link to Patient"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCapture(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
