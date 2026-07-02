import React from "react";
import { ArticlesTableClient } from "./ArticlesTableClient";

interface ArticlesTableProps {
  data: any;
}

export function ArticlesTable({ data }: ArticlesTableProps) {
  return <ArticlesTableClient articles={data.articles || []} />;
}
