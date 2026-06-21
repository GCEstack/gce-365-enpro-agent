// static/js/utils.js — DOM helpers, formatters, toast system
export function qs(selector, context = document) {
  return context.querySelector(selector);
}

export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

export function formatCurrency(n) {
  if (n === undefined || n === null || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US');
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function showToast(title, message, type = 'info', duration = 5000) {
  let stack = qs('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-title">${escapeHtml(title)}</div><div class="toast-message">${escapeHtml(message)}</div>`;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
  toast.addEventListener('click', () => toast.remove());
}

export function confirmDialog(message) {
  return window.confirm(message);
}

export function promptDialog(message, defaultValue = '') {
  return window.prompt(message, defaultValue);
}
