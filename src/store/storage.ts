import type { AppData } from './schema'
import { emptyData } from './schema'

export const STORAGE_KEY = 'schedflow_data'
export const SCHEMA_VERSION = 1

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || typeof parsed !== 'object' || parsed.version !== SCHEMA_VERSION) {
      return emptyData()
    }
    return parsed
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    throw new Error(
      'Could not save — browser storage is full. Remove large attachments or reset data to continue.',
    )
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
