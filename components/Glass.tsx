"use client";

import React from "react";

export function GlassPanel({
  children,
  className = "",
  solid = false,
}: {
  children: React.ReactNode;
  className?: string;
  solid?: boolean;
}) {
  return (
    <div className={`${solid ? "glass-panel-solid" : "glass-panel"} ${className}`}>{children}</div>
  );
}

export function GlassInput({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`glass-input rounded-xl px-4 py-3 text-[15px] ${error ? "input-error" : ""} ${props.className ?? ""}`}
      />
      {error && (
        <p id={`${id}-error`} className="field-error-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function GlassSelect({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <select
        id={id}
        {...props}
        aria-invalid={Boolean(error)}
        className={`glass-input rounded-xl px-4 py-3 text-[15px] appearance-none ${error ? "input-error" : ""} ${props.className ?? ""}`}
      >
        {children}
      </select>
      {error && <p className="field-error-text">{error}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`btn-primary rounded-full px-7 py-3.5 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`btn-ghost rounded-full px-6 py-3 text-[15px] ${className}`}>
      {children}
    </button>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip rounded-full px-3.5 py-1.5 text-sm text-white/85">{children}</span>;
}
