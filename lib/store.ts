import fs from 'fs';
import path from 'path';
import type { DARSData, AcademicPlan, CourseInfo } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function writeJson(filename: string, data: unknown): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getSampleDars(): DARSData {
  return readJson<DARSData>('sampleDars.json');
}

export function getCourseCatalog(): CourseInfo[] {
  return readJson<CourseInfo[]>('courseCatalog.json');
}

export function savePlan(plan: AcademicPlan): void {
  writeJson(`plan_${plan.studentId}.json`, plan);
}

export function loadPlan(studentId: string): AcademicPlan | null {
  const filename = `plan_${studentId}.json`;
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return readJson<AcademicPlan>(filename);
}

export function saveDars(data: DARSData): void {
  writeJson(`dars_${data.studentProfile.studentId}.json`, data);
}

export function loadDars(studentId: string): DARSData | null {
  const filename = `dars_${studentId}.json`;
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return readJson<DARSData>(filename);
}
