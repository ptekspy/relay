"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { getQueryClient } from "./getQueryClient";

export default function TanstackQueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = getQueryClient();

  return createElement(QueryClientProvider, { client: queryClient }, children);
}
