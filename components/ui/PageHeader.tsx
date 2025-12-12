import React from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Optional: small helper block that answers “what happens next?” */
  nextHint?: React.ReactNode;
  /** Optional: right-side slot for later (e.g., step indicator) */
  rightSlot?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, nextHint, rightSlot }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="ss-h1">{title}</h1>
          {subtitle ? <div className="ss-subtitle">{subtitle}</div> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>

      {nextHint ? <div className="ss-helper">{nextHint}</div> : null}
    </div>
  );
}
