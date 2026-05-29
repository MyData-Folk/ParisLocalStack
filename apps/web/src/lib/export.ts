function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function downloadFile(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function exportRowsAsJson(rows: Record<string, unknown>[], name: string) {
  downloadFile(`${name}-${dateStamp()}.json`, "application/json;charset=utf-8", JSON.stringify(rows, null, 2));
}

export function exportRowsAsExcel(rows: Record<string, unknown>[], name: string) {
  const headers = Object.keys(rows[0] ?? {});
  const headerRow = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${headers.map((header) => `<td>${escapeHtml(String(row[header] ?? ""))}</td>`).join("")}</tr>`
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
  downloadFile(`${name}-${dateStamp()}.xls`, "application/vnd.ms-excel;charset=utf-8", html);
}