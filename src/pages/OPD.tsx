import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Search, FileText, Printer, Download, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useAddPatient, useSearchPatients, useAddPrescription, usePatients } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";

const orthoAdvice: Record<string, string> = {
  "Plaster Care": "प्लास्टर केयर सलाह:\n• प्लास्टर को सूखा रखें\n• उंगलियों को हिलाते रहें\n• सूजन या सुन्नपन होने पर तुरंत डॉक्टर से मिलें\n• प्लास्टर को खुद न निकालें",
  "Fracture Healing": "फ्रैक्चर हीलिंग सलाह:\n• कैल्शियम युक्त भोजन लें (दूध, दही, पनीर)\n• प्रोटीन से भरपूर खाना खाएं\n• विटामिन D के लिए धूप में बैठें\n• डॉक्टर की सलाह के बिना वजन न डालें",
  "Upper Limb": "ऊपरी अंग सलाह:\n• हाथ को ऊंचा रखें (तकिये पर)\n• उंगलियों की एक्सरसाइज करें\n• भारी वस्तु न उठाएं\n• स्लिंग नियमित पहनें",
  "Lower Limb": "निचले अंग सलाह:\n• पैर को ऊंचा रखें\n• बिना सहारे के न चलें\n• बर्फ की सिकाई करें\n• वजन डालने से पहले डॉक्टर से पूछें",
  "Physiotherapy": "फिजियोथेरेपी सलाह:\n• रोजाना बताई गई एक्सरसाइज करें\n• दर्द होने पर रुकें, जबरदस्ती न करें\n• गर्म/ठंडी सिकाई नियम से करें\n• फॉलो-अप में आएं",
  "Emergency Warning": "आपातकालीन चेतावनी:\n⚠️ तुरंत डॉक्टर से मिलें यदि:\n• उंगलियां नीली/सुन्न हो जाएं\n• असहनीय दर्द हो\n• प्लास्टर टूट जाए\n• बुखार आए\n• सूजन बहुत बढ़ जाए",
};

export default function OPD() {
  const [advice, setAdvice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [regForm, setRegForm] = useState({ name: "", mobile: "", age: "", gender: "", address: "" });
  const [rxForm, setRxForm] = useState({ patient_id: "", diagnosis: "", medicines: "", followup_date: "" });

  const addPatient = useAddPatient();
  const { data: searchResults } = useSearchPatients(searchQuery);
  const { data: allPatients } = usePatients();
  const addPrescription = useAddPrescription();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.mobile) {
      toast({ title: "Error", description: "Name and mobile are required", variant: "destructive" });
      return;
    }
    try {
      await addPatient.mutateAsync({
        name: regForm.name,
        mobile: regForm.mobile,
        age: regForm.age ? parseInt(regForm.age) : null,
        gender: regForm.gender || null,
        address: regForm.address || null,
      });
      toast({ title: "Success", description: "Patient registered successfully!" });
      setRegForm({ name: "", mobile: "", age: "", gender: "", address: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handlePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxForm.patient_id || !rxForm.diagnosis) {
      toast({ title: "Error", description: "Select patient and enter diagnosis", variant: "destructive" });
      return;
    }
    try {
      await addPrescription.mutateAsync({
        patient_id: rxForm.patient_id,
        diagnosis: rxForm.diagnosis,
        medicines: rxForm.medicines,
        advice,
        followup_date: rxForm.followup_date || null,
      });
      toast({ title: "Success", description: "Prescription saved!" });
      setRxForm({ patient_id: "", diagnosis: "", medicines: "", followup_date: "" });
      setAdvice("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="module-header">OPD Module</h1>
            <p className="text-sm text-muted-foreground">Out Patient Department Management</p>
          </div>
        </div>

        <Tabs defaultValue="register" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  New Patient Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient Name *</Label>
                    <Input placeholder="Enter full name" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <Input placeholder="+91 XXXXX XXXXX" value={regForm.mobile} onChange={e => setRegForm(p => ({ ...p, mobile: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" placeholder="Age" value={regForm.age} onChange={e => setRegForm(p => ({ ...p, age: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={regForm.gender} onValueChange={v => setRegForm(p => ({ ...p, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Address</Label>
                    <Textarea placeholder="Full address" value={regForm.address} onChange={e => setRegForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={addPatient.isPending} className="w-full sm:w-auto">
                      {addPatient.isPending ? "Registering..." : "Register Patient"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Search Patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Search by mobile number or name" className="flex-1" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <Button variant="outline" className="gap-2"><Search className="h-4 w-4" />Search</Button>
                </div>
                {searchResults && searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.mobile} · {p.age}y · {p.gender}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{p.address}</Badge>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">No patients found</p>
                ) : (
                  <p className="text-center py-8 text-muted-foreground text-sm">Enter a mobile number or name to search</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescription">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Digital Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePrescription} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Patient *</Label>
                        <Select value={rxForm.patient_id} onValueChange={v => setRxForm(p => ({ ...p, patient_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                          <SelectContent>
                            {allPatients?.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} ({p.mobile})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Follow-up Date</Label>
                        <Input type="date" value={rxForm.followup_date} onChange={e => setRxForm(p => ({ ...p, followup_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Diagnosis *</Label>
                      <Input placeholder="e.g., Radius Fracture, Knee OA" value={rxForm.diagnosis} onChange={e => setRxForm(p => ({ ...p, diagnosis: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Medicines</Label>
                      <Textarea placeholder="Medicine 1 - Dose - Duration&#10;Medicine 2 - Dose - Duration" rows={4} value={rxForm.medicines} onChange={e => setRxForm(p => ({ ...p, medicines: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Advice</Label>
                      <Textarea placeholder="Special instructions..." rows={3} value={advice} onChange={e => setAdvice(e.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={addPrescription.isPending}>
                        {addPrescription.isPending ? "Saving..." : "Save Prescription"}
                      </Button>
                      <Button type="button" variant="outline" className="gap-2"><Printer className="h-4 w-4" />Print</Button>
                      <Button type="button" variant="outline" className="gap-2"><Download className="h-4 w-4" />PDF</Button>
                      <Button type="button" variant="outline" className="gap-2 text-success"><MessageCircle className="h-4 w-4" />WhatsApp</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-sm">Smart Advice Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.keys(orthoAdvice).map((key) => (
                    <Button key={key} variant="outline" size="sm" className="w-full justify-start text-xs"
                      onClick={() => setAdvice(prev => prev ? prev + "\n\n" + orthoAdvice[key] : orthoAdvice[key])}>
                      {key}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
