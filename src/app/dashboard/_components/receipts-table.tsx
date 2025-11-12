import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IntlConfig } from "@/lib/intl/resolveIntlConfig";

export type ReceiptRow = {
  id: string;
  createdAt: Date;
  description: string;
  amount: string;
  receiptUrl?: string | null;
};

export function ReceiptsTable({ receipts, intlConfig }: { receipts: ReceiptRow[]; intlConfig: IntlConfig }) {
  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-sm text-muted-foreground">
        No payments yet. Tickets and membership receipts will land here once you check out through Stripe.
      </div>
    );
  }

  const dateFormatter = new Intl.DateTimeFormat(intlConfig.locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: intlConfig.tz,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {dateFormatter.format(receipt.createdAt)}
              </TableCell>
              <TableCell className="text-sm">{receipt.description}</TableCell>
              <TableCell className="text-right text-sm font-medium">{receipt.amount}</TableCell>
              <TableCell className="text-right text-sm">
                {receipt.receiptUrl ? (
                  <Link
                    href={receipt.receiptUrl}
                    className="text-foreground underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Pending</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
