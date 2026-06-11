"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "./severity";
import { formatCurrency } from "@/lib/utils";
import type { AiRecommendation } from "@/lib/types";

export function Recommendations({ recs }: { recs: AiRecommendation[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> AI Recommendations
        </CardTitle>
        <Badge variant="default">Explainable AI</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {recs.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-lg border border-border/60 bg-secondary/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{r.title}</p>
              <SeverityBadge severity={r.priority} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {r.rationale}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-primary">
                <TrendingUp className="h-3 w-3" /> {r.impact}
              </span>
              {r.estimatedSavings ? (
                <span className="rounded-md bg-success/10 px-2 py-1 text-success">
                  {formatCurrency(r.estimatedSavings)} saved
                </span>
              ) : null}
              <span className="ml-auto text-muted-foreground">
                {Math.round(r.confidence * 100)}% confidence
              </span>
            </div>
          </motion.div>
        ))}
        {recs.length === 0 && (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            No recommendations — operating within optimal parameters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
