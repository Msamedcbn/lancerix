import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * The shape every area of the dashboard uses before it has data.
 *
 * An empty state is the first thing most users see, so it says what belongs
 * here and what has to happen for it to fill, rather than "nothing found".
 */
export function EmptyState({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children?: ReactNode }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  );
}

export function PageHeading({
  title,
  subtitle,
}: Readonly<{ title: string; subtitle: string }>) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  );
}
