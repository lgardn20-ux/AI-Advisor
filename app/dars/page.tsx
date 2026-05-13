'use client';

import { useState, useRef } from 'react';
import { parseDarsJson } from '@/lib/parser';
import type { DARSData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  BookOpen,
  GraduationCap,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DarsPage() {
  const [input, setInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [parsed, setParsed] = useState<DARSData | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadSample() {
    const res = await fetch('/api/sample-dars');
    const json = await res.json() as DARSData;
    setInput(JSON.stringify(json, null, 2));
    setParsed(null);
    setErrors([]);
    setSaved(false);
    setUploadedFileName('');
  }

  function handleParse() {
    const result = parseDarsJson(input);
    if (result.success && result.data) {
      setParsed(result.data);
      setErrors([]);
    } else {
      setErrors(result.errors);
      setParsed(null);
    }
  }

  async function handleSave() {
    if (!parsed) return;
    const res = await fetch('/api/save-dars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    if (res.ok) setSaved(true);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadError('');
    setUploadedFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-dars-file', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as { json?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to parse file');
      setInput(data.json ?? '');
      setParsed(null);
      setErrors([]);
      setSaved(false);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Unknown error');
      setUploadedFileName('');
    } finally {
      setUploading(false);
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Upload Your DARS Report</h1>
        <p className="text-muted-foreground">
          Upload a photo or PDF of your Degree Audit Report, or paste the JSON data directly.
          Claude will extract and structure your academic progress automatically.
        </p>
      </div>

      {/* Upload zone */}
      <Card>
        <CardContent className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={onFileInputChange}
            disabled={uploading}
          />

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 text-center cursor-pointer transition-all duration-200',
              dragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/40 hover:bg-muted/50',
              uploading && 'pointer-events-none opacity-70'
            )}
          >
            {uploading ? (
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Extracting DARS data…</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Claude is reading your document. This takes 10–20 seconds.</p>
                </div>
              </div>
            ) : uploadedFileName ? (
              <div className="space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-medium text-sm text-foreground">{uploadedFileName}</p>
                <p className="text-xs text-muted-foreground">Extracted successfully — see JSON below</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto">
                  <Upload className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Drop your DARS file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse — supports JPG, PNG, PDF (max 5 MB)</p>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Upload failed</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-center mt-5">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px w-10 bg-border" />
              or
              <div className="h-px w-10 bg-border" />
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={loadSample}>
              <FileText className="h-3.5 w-3.5" />
              Load Sample DARS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* JSON input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Paste JSON Data</CardTitle>
          <CardDescription>
            Have raw JSON from your DARS? Paste it directly below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <textarea
              value={input}
              onChange={e => {
                setInput(e.target.value);
                setParsed(null);
                setErrors([]);
                setSaved(false);
              }}
              rows={14}
              placeholder={`{\n  "studentProfile": { "name": "...", "studentId": "...", ... },\n  "completedCourses": [...],\n  "inProgressCourses": [...],\n  "remainingRequirements": [...]\n}`}
              className={cn(
                'w-full resize-y rounded-lg border bg-muted/30 font-mono text-xs px-3 py-3 leading-relaxed',
                'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring',
                'min-h-[200px] transition-colors',
                errors.length > 0 ? 'border-destructive/50' : 'border-border'
              )}
              spellCheck={false}
            />
            {input && (
              <button
                onClick={() => { setInput(''); setParsed(null); setErrors([]); }}
                className="absolute top-2 right-2 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleParse} disabled={!input.trim()}>
              Validate & Parse
            </Button>
            {parsed && !saved && (
              <Button onClick={handleSave} variant="outline">
                Save to Account
              </Button>
            )}
            {saved && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation failed ({errors.length} error{errors.length > 1 ? 's' : ''})</AlertTitle>
          <AlertDescription>
            <ul className="mt-1.5 space-y-0.5">
              {errors.map((err, i) => (
                <li key={i} className="text-xs">• {err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Parsed results */}
      {parsed && (
        <div className="space-y-4 animate-slide-up">
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>DARS parsed successfully</AlertTitle>
            <AlertDescription>
              All fields validated. Review the summary below then generate your plan.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <GraduationCap className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <CardTitle>{parsed.studentProfile.name}</CardTitle>
                  <CardDescription>
                    {parsed.studentProfile.major}{parsed.studentProfile.minor ? ` · ${parsed.studentProfile.minor} Minor` : ''} · GPA {parsed.studentProfile.currentGPA.toFixed(2)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: BookOpen, label: 'Completed', value: parsed.completedCourses.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { icon: Loader2, label: 'In Progress', value: parsed.inProgressCourses.length, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { icon: ClipboardList, label: 'Requirements Left', value: parsed.remainingRequirements.length, color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className={cn('rounded-lg p-3 text-center', bg)}>
                    <Icon className={cn('h-4 w-4 mx-auto mb-1.5', color)} strokeWidth={1.75} />
                    <div className={cn('text-2xl font-bold tabular-nums', color)}>{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Requirements list */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Remaining Requirements</p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {parsed.remainingRequirements.map((req, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 bg-muted/50 text-xs">
                      <span className="text-foreground font-medium truncate">{req.requirementCategory}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge
                          variant={req.priority === 'required' ? 'solid' : req.priority === 'recommended' ? 'warning' : 'secondary'}
                          className="text-[10px]"
                        >
                          {req.priority}
                        </Badge>
                        <span className="text-muted-foreground">{req.creditsNeeded} cr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button asChild className="flex-1">
                  <Link href="/plans">
                    Generate My Plan
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
