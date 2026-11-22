import { backendServices } from '@supermarket/api-sdk';
import { AppSection } from '@supermarket/frontend-ui';

export function RouteInventorySection() {
  return (
    <AppSection
      title="Current route inventory"
      description="These are the live backend routes already supporting the operational slice now visible on the screen."
    >
      <div className="rounded-3xl border border-line bg-stone-950 px-5 py-4 text-stone-100">
        <ul className="space-y-2 font-mono text-sm">
          <li>{backendServices.checkout.routes.openPosSession}</li>
          <li>{backendServices.checkout.routes.closePosSession(':sessionId')}</li>
          <li>{backendServices.checkout.routes.startSale}</li>
          <li>/catalog-items/barcodes/:barcode</li>
          <li>{backendServices.checkout.routes.addSaleItem(':saleId')}</li>
          <li>{backendServices.checkout.routes.removeSaleItem(':saleId')}</li>
          <li>{backendServices.checkout.routes.processSalePayment(':saleId')}</li>
          <li>{backendServices.checkout.routes.completeSale(':saleId')}</li>
          <li>{backendServices.checkout.routes.cancelSale(':saleId')}</li>
        </ul>
      </div>
    </AppSection>
  );
}
