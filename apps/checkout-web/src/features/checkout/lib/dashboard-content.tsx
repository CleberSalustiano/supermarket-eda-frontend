import { Boxes, CircleDollarSign, CreditCard, Receipt, ReceiptText, ScanLine } from 'lucide-react';

export const navigationItems = [
  {
    label: 'Workspace control',
    description: 'Keep tenant targeting explicit while the backend still has no authenticated user session.'
  },
  {
    label: 'Active sale execution',
    description: 'Move from session start to cart mutation with state continuity inside the cashier workspace.'
  },
  {
    label: 'Terminal handling',
    description: 'Process payment, completion, cancellation, and register closure without leaving the screen.'
  }
] as const;

export const actionCards = [
  {
    title: 'Open a register session',
    description: 'Capture the operator, register, and opening float before a sale begins.',
    footer: 'POST /pos-sessions',
    icon: <Receipt className="size-5" />
  },
  {
    title: 'Start and persist a sale',
    description: 'Create the sale once, keep it visible locally, and continue safely after a refresh.',
    footer: 'POST /sales',
    icon: <ReceiptText className="size-5" />
  },
  {
    title: 'Scan from the local catalog',
    description: 'Resolve product information from the checkout cache before mutating the cart.',
    footer: 'GET /catalog-items/barcodes/:barcode',
    icon: <ScanLine className="size-5" />
  },
  {
    title: 'Mutate cart totals live',
    description: 'Add or remove line quantities while the sale stays open and visible on the screen.',
    footer: 'POST /sales/:saleId/items and /items/removals',
    icon: <CircleDollarSign className="size-5" />
  },
  {
    title: 'Process payment and receipt',
    description: 'Advance the sale into payment, then completion, with receipt data visible immediately.',
    footer: 'POST /sales/:saleId/payment and /completion',
    icon: <CreditCard className="size-5" />
  },
  {
    title: 'Cancel or close safely',
    description: 'Handle reversal and register closure with explicit backend constraints and clear operator guidance.',
    footer: 'POST /sales/:saleId/cancellation and /pos-sessions/:sessionId/closure',
    icon: <Boxes className="size-5" />
  }
] as const;
