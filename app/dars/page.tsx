'use client';

import { useState, useRef } from 'react';
import { parseDarsJson } from '@/lib/parser';
import type { DARSData } from '@/lib/types';

export default function DarsPage() {
  const [input, setInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [parsed, setParsed] = useState<DARSData | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadSample() {
    const res = await fetch('/api/sample-dars');
    const json = await res.json() as DARSData;
    setInput(JSON.stringify(json, null, 2));
    setParsed(null);
    setErrors([]);
    setSaved(false);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">DARS Input</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a photo or file of your DARS report, or paste JSON directly.
        </p>
      </div>

      {/* Upload box */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`bg-white rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={onFileInputChange}
          disabled={uploading}
        />
        {uploading ? (
          <>
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Extracting DARS data with AI…</p>
          </>
        ) : (
          <>
            <span className="text-4xl">📄</span>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Drop a file here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">Supports images (JPG, PNG, etc.) and PDFs</p>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{uploadError}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={loadSample}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 transition-colors"
          >
            Load Sample Data
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-400">or paste your own DARS JSON below</span>
        </div>

        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); setParsed(null); setErrors([]); setSaved(false); }}
          rows={20}
          placeholder={'{\n  "studentProfile": { ... },\n  "completedCourses": [ ... ],\n  "inProgressCourses": [ ... ],\n  "remainingRequirements": [ ... ]\n}'}
          className="w-full font-mono text-xs text-black rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          spellCheck={false}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleParse}
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg px-5 py-2 transition-colors"
          >
            Validate & Parse
          </button>
          {parsed && (
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg px-5 py-2 transition-colors"
            >
              Save DARS
            </button>
          )}
          {saved && <span className="text-green-600 text-sm">✓ Saved successfully</span>}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-700 mb-2">Validation errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-red-600 text-sm">{e}</li>
            ))}
          </ul>
        </div>
      )}

      {parsed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">✓</span>
            <p className="font-semibold text-green-800">DARS parsed successfully</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoBox label="Student" value={parsed.studentProfile.name} />
            <InfoBox label="Major" value={parsed.studentProfile.major} />
            <InfoBox label="GPA" value={parsed.studentProfile.currentGPA.toFixed(2)} />
            <InfoBox
              label="Credits"
              value={`${parsed.studentProfile.totalCreditsCompleted} / ${parsed.studentProfile.totalCreditsRequired}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <SummaryBox
              title="Completed Courses"
              count={parsed.completedCourses.length}
              color="text-blue-700"
              items={parsed.completedCourses.slice(0, 5).map(c => `${c.courseCode} (${c.grade})`)}
            />
            <SummaryBox
              title="In Progress"
              count={parsed.inProgressCourses.length}
              color="text-yellow-600"
              items={parsed.inProgressCourses.map(c => c.courseCode)}
            />
            <SummaryBox
              title="Requirements Left"
              count={parsed.remainingRequirements.length}
              color="text-red-600"
              items={parsed.remainingRequirements.slice(0, 5).map(r => r.requirementCategory)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-green-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800 text-sm truncate">{value}</p>
    </div>
  );
}

function SummaryBox({ title, count, color, items }: { title: string; count: number; color: string; items: string[] }) {
  return (
    <div className="bg-white rounded-lg border border-green-200 p-3">
      <p className="text-xs text-gray-500 mb-0.5">{title}</p>
      <p className={`text-xl font-bold ${color} mb-2`}>{count}</p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 truncate">{item}</li>
        ))}
        {count > items.length && (
          <li className="text-xs text-gray-400">+{count - items.length} more</li>
        )}
      </ul>
    </div>
  );
}
