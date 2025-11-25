import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResendReceiptButton } from "./resend-receipt-button";

export type ReceiptRow = {
  id: string;
  createdAt: Date;
  description: string;
  amount: string;
  receiptUrl?: string | null;
};

export function ReceiptsTable({ receipts }: { receipts: ReceiptRow[] }) {
  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-sm text-muted-foreground">
        No payments yet. Tickets and membership receipts will land here once you check out through Stripe.
      </div>
    );
  }

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
                {receipt.createdAt.toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </TableCell>
              <TableCell className="text-sm">{receipt.description}</TableCell>
              <TableCell className="text-right text-sm font-medium">{receipt.amount}</TableCell>
              <TableCell className="text-right text-sm">
                <div className="flex flex-col items-end gap-1">
                  {receipt.receiptUrl ? (
                    <Link
                      href={receipt.receiptUrl}
                      className="text-foreground underline-offset-4 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Stripe receipt
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                  <ResendReceiptButton paymentId={receipt.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
