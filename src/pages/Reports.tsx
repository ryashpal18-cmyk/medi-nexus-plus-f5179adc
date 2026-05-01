import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, RotateCcw, Sparkles, AlertCircle, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CLINIC = {
  name: "Balaji Ortho Care Center",
  doctor: "Dr. S. S. Rathore (DMRT | BPT)",
  address: "Opp Govt Hospital, Bay Pass Road, Khinwara, Raj. – 306502",
  phone: "+91 8005707783",
};

const COLORS = {
  primary: "#1a5fa8",
  accent: "#00bcd4",
  text: "#333",
};

function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.split(",")[1] || "";
      resolve({ base64, mime: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export default function Reports() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [studyName, setStudyName] = useState("");
  const [complaint, setComplaint] = useState("");
  const [side, setSide] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast({ title: "Invalid file", description: "Only JPG and PNG images are allowed.", variant: "destructive" });
      return;
    }

    try {
      const { base64, mime } = await fileToBase64(file);
      setImageFile(file);
      setBase64Image(base64);
      setMimeType(mime);
      setImagePreview(`data:${mime};base64,${base64}`);
      setError(null);
    } catch {
      toast({ title: "Error", description: "Could not process image.", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setName("");
    setAge("");
    setStudyName("");
    setComplaint("");
    setSide("");
    setImageFile(null);
    setImagePreview(null);
    setBase64Image(null);
    setReport(null);
    setError(null);
    setReportDate("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!name.trim() || !age.trim() || !studyName.trim() || !complaint.trim() || !side) {
      toast({ title: "Missing fields", description: "Please fill all the form fields.", variant: "destructive" });
      return;
    }
    if (!base64Image) {
      toast({ title: "No image", description: "Please upload an X-ray image.", variant: "destructive" });
      return;
    }

    const apiKey = "AIzaSyAgjZw9QfzT7ESgFz2qzo-bIM1g7hbdYzw";

    setLoading(true);
    setError(null);
    setReport(null);
    const today = new Date().toLocaleDateString("en-IN");
    setReportDate(today);

    const promptText = `You are a Senior Orthopedic Radiologist at Balaji Ortho Care Center.
Analyze this X-ray for:
Patient: ${name}, Age: ${age} years
Study: ${studyName}, Side: ${side}
History/Complaint: ${complaint}
Date: ${today}

Generate a detailed professional radiology report:

**1. Alignment & Bone Integrity**
(detailed findings here)

**2. Fracture / Dislocation Detection**
(detailed findings here)

**3. Joint Space & Degenerative Changes**
(detailed findings here)

**4. Soft Tissue & Implants**
(detailed findings here)

**5. Impression & Diagnosis**
(summary diagnosis here)

**Hindi Summary (मरीज के लिए)**
(2 line mein simple Hindi mein)

**Disclaimer**
यह रिपोर्ट AI द्वारा तैयार की गई है। 
अंतिम निदान के लिए डॉक्टर से परामर्श अनिश्चित है।
This is an AI-assisted draft. Final diagnosis must be 
verified by a qualified doctor.

If the image is NOT a medical X-ray, respond ONLY with:
ERROR: Please upload a clear medical X-ray image.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64Image } },
                  { text: promptText },
                ],
              },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Gemini API error");

      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (text.trim().startsWith("ERROR:")) {
        setError("Please upload a clear medical X-ray image.");
        setReport(null);
      } else {
        setReport(text.trim());
      }
    } catch (e) {
      setError("Failed to generate report: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Convert markdown-ish bold + section headers to HTML
  const renderReport = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: "8px" }} />;
      // Bold heading: **text**
      const headingMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
      if (headingMatch) {
        return (
          <h3
            key={idx}
            style={{
              color: COLORS.accent,
              fontSize: "15px",
              fontWeight: 700,
              marginTop: "14px",
              marginBottom: "6px",
              borderBottom: `1px solid ${COLORS.accent}33`,
              paddingBottom: "3px",
            }}
          >
            {headingMatch[1]}
          </h3>
        );
      }
      // Inline bold replacement
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={idx} style={{ margin: "4px 0", lineHeight: 1.6, color: COLORS.text, fontSize: "13.5px" }}>
          {parts.map((p, i) =>
            p.startsWith("**") && p.endsWith("**") ? (
              <strong key={i}>{p.slice(2, -2)}</strong>
            ) : (
              <span key={i}>{p}</span>
            )
          )}
        </p>
      );
    });
  };

  return (
    <DashboardLayout>
      {/* Print-only styles */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          nav, header, aside, .form-section, button, .sidebar,
          [data-sidebar], .no-print { display: none !important; }
          .report-panel {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .clinic-header { display: flex !important; }
          body { background: white !important; }
          @page { margin: 12mm; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="no-print">
          <h1 className="module-header flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Orthopedic X-Ray AI Analysis
          </h1>
          <p className="text-sm text-muted-foreground">
            Professional AI-assisted X-ray report generator · {CLINIC.name}
          </p>
        </div>

        {/* FORM */}
        <Card className="form-section no-print">
          <CardHeader>
            <CardTitle className="font-heading text-base">Patient & Study Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Patient Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 45" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="study">Study Name</Label>
                <Input id="study" value={studyName} onChange={(e) => setStudyName(e.target.value)} placeholder="e.g. Knee AP View, Spine LAT" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="side">Side</Label>
                <Select value={side} onValueChange={setSide}>
                  <SelectTrigger id="side"><SelectValue placeholder="Select side" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Left">Left</SelectItem>
                    <SelectItem value="Right">Right</SelectItem>
                    <SelectItem value="Bilateral">Bilateral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaint">History / Complaint</Label>
              <Textarea
                id="complaint"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Pain duration, trauma history, swelling, prior surgery, etc."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="xray">X-Ray Image (JPG, PNG)</Label>
              <Input
                id="xray"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-2 rounded-md border p-2 bg-muted/30">
                  <img src={imagePreview} alt="X-ray preview" className="max-h-64 mx-auto rounded" />
                  <p className="mt-1 text-xs text-muted-foreground text-center">{imageFile?.name}</p>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleGenerate} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Analyzing..." : "Generate AI Report"}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={loading} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LOADING */}
        {loading && (
          <div className="no-print flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: COLORS.accent }} />
            <p className="text-sm font-medium" style={{ color: COLORS.accent }}>
              Analyzing X-ray, please wait...
            </p>
          </div>
        )}

        {/* REPORT PANEL */}
        {report && (
          <>
            <div className="no-print flex justify-end">
              <Button
                onClick={() => window.print()}
                className="gap-2"
                style={{ background: COLORS.accent, color: "white" }}
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </div>

            <div
              className="report-panel mx-auto"
              style={{
                background: "white",
                color: COLORS.text,
                padding: "32px",
                maxWidth: "850px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                borderRadius: "8px",
                fontFamily: "Arial, sans-serif",
              }}
            >
              {/* CLINIC HEADER */}
              <div
                className="clinic-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  borderBottom: `2px solid ${COLORS.accent}`,
                  paddingBottom: "14px",
                  marginBottom: "16px",
                }}
              >
                <img
                  src="/images/logo.png"
                  alt="Balaji Logo"
                  style={{ height: "70px", width: "70px", objectFit: "contain" }}
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: COLORS.primary, lineHeight: 1.2 }}>
                    {CLINIC.name}
                  </div>
                  <div style={{ fontSize: "13px", color: COLORS.text, marginTop: "2px" }}>{CLINIC.doctor}</div>
                  <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>{CLINIC.address}</div>
                  <div style={{ fontSize: "12px", color: "#555" }}>Phone: {CLINIC.phone}</div>
                </div>
              </div>

              {/* TITLE */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  color: COLORS.primary,
                  borderBottom: `2px solid ${COLORS.accent}`,
                  paddingBottom: "10px",
                  marginBottom: "14px",
                }}
              >
                X-RAY ANALYSIS REPORT
              </div>

              {/* PATIENT META */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 24px",
                  fontSize: "13.5px",
                  paddingBottom: "12px",
                  borderBottom: `1px solid ${COLORS.accent}66`,
                  marginBottom: "14px",
                }}
              >
                <div><strong>Patient:</strong> {name}</div>
                <div><strong>Date:</strong> {reportDate}</div>
                <div><strong>Age:</strong> {age} years</div>
                <div><strong>Study:</strong> {studyName}</div>
                <div><strong>Side:</strong> {side}</div>
                <div />
                <div style={{ gridColumn: "1 / -1" }}><strong>History:</strong> {complaint}</div>
              </div>

              {/* AI REPORT BODY */}
              <div style={{ paddingBottom: "16px", borderBottom: `1px solid ${COLORS.accent}66` }}>
                {renderReport(report)}
              </div>

              {/* FOOTER */}
              <div style={{ textAlign: "center", marginTop: "14px", fontSize: "12px", color: "#666" }}>
                <div style={{ fontWeight: 600, color: COLORS.primary }}>Medix Medical</div>
                <div>Thank you for choosing {CLINIC.name}</div>
              </div>
            </div>
          </>
        )}

        {/* PAGE FOOTER */}
        <div className="no-print text-center text-xs text-muted-foreground border-t pt-4 mt-6">
          <div className="font-semibold">{CLINIC.name} | {CLINIC.doctor}</div>
          <div>{CLINIC.address}</div>
          <div className="mt-1">AI-assisted analysis | For doctor verification only.</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
