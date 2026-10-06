// Download rows as a UTF-8 CSV (with BOM so Excel shows Vietnamese correctly).
export function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [columns.map((c) => escape(c.title)), ...rows.map((row) => columns.map((c) => escape(c.value(row))))]
  const blob = new Blob(['﻿' + lines.map((l) => l.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
