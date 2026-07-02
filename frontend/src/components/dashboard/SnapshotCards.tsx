import React from "react";
import { SnapshotCardsClient } from "./SnapshotCardsClient";

interface SnapshotCardsProps {
  data: any;
}

export function SnapshotCards({ data }: SnapshotCardsProps) {
  return (
    <SnapshotCardsClient
      totalViews={data.totalViews || 0}
      totalReads={data.totalReads || 0}
      avgReadTime={data.avgReadTime || 0}
      viewTrends={data.viewTrends || []}
    />
  );
}
