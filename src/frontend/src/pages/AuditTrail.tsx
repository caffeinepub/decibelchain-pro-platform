import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { formatTimestamp, useAuditLog } from "../hooks/useQueries";
import { useTranslation } from "../i18n";

const PAGE_SIZE = 20;

export function AuditTrail() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;
  const { data: entries, isLoading } = useAuditLog(offset, PAGE_SIZE);

  return (
    <div className="p-6 space-y-6 max-w-5xl" data-ocid="audit_trail.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">{t("auditTrail")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t("auditLog")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="audit_trail.loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-muted" />
          ))}
        </div>
      ) : !entries?.length ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="audit_trail.empty_state"
        >
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("noAuditEntries")}</p>
        </div>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table data-ocid="audit_trail.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">#</TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("action")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("entityType")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("entityId")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("actor")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("details")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t("timestamp")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow
                    key={Number(entry.id)}
                    data-ocid={`audit_trail.row.${i + 1}`}
                    className="border-border hover:bg-muted/20"
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {Number(entry.id)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-primary/20 text-primary text-xs"
                      >
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {entry.entityType}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-24 truncate">
                      {entry.entityId}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-24 truncate">
                      {entry.actorId}
                    </TableCell>
                    <TableCell className="text-xs max-w-32 truncate">
                      {entry.details}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("auditLog")} • {t("page")} {page + 1}
        </p>
        <div className="flex gap-2">
          <Button
            data-ocid="audit_trail.pagination_prev"
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="border-border"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            data-ocid="audit_trail.pagination_next"
            variant="outline"
            size="sm"
            disabled={!entries?.length || entries.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="border-border"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
