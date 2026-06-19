import React from "react";
import { TopTagsClient } from "./TopTagsClient";

interface TopTagsProps {
  data: any;
}

export function TopTags({ data }: TopTagsProps) {
  return <TopTagsClient tagPerformance={data.tagPerformance || []} />;
}
