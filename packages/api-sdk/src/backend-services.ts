export const backendServices = {
  checkout: {
    serviceName: 'checkout-service',
    defaultBaseUrl: 'http://localhost:3001',
    routes: {
      health: '/health',
      scanCatalogItemByBarcode: (barcode: string) =>
        `/catalog-items/barcodes/${encodeURIComponent(barcode)}`,
      openPosSession: '/pos-sessions',
      closePosSession: (sessionId: string) => `/pos-sessions/${sessionId}/closure`,
      startSale: '/sales',
      addSaleItem: (saleId: string) => `/sales/${saleId}/items`,
      removeSaleItem: (saleId: string) => `/sales/${saleId}/items/removals`,
      processSalePayment: (saleId: string) => `/sales/${saleId}/payment`,
      completeSale: (saleId: string) => `/sales/${saleId}/completion`,
      cancelSale: (saleId: string) => `/sales/${saleId}/cancellation`
    }
  },
  inventory: {
    serviceName: 'inventory-service',
    defaultBaseUrl: 'http://localhost:3002',
    routes: {
      health: '/health',
      registerSupplierInvoice: '/supplier-invoices',
      registerInventoryLoss: '/inventory-losses',
      registerPhysicalInventoryAdjustment: '/inventory-adjustments/physical'
    }
  },
  management: {
    serviceName: 'management-service',
    defaultBaseUrl: 'http://localhost:3003',
    routes: {
      health: '/health',
      registerProduct: '/products',
      updateProductPrice: (productId: string) => `/products/${productId}/price`,
      registerEmployee: '/employees',
      generateProfitAndLossReport: '/reports/profit-and-loss'
    }
  }
} as const;

export type BackendServiceCatalog = typeof backendServices;

