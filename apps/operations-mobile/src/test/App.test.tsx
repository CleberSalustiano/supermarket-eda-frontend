import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import { OperationsInventoryScreen } from '../screens/OperationsInventoryScreen';

describe('Operations mobile shell', () => {
  it('renders the inventory tab content', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0
        }
      }
    });

    const screenResult = render(
      <QueryClientProvider client={queryClient}>
        <OperationsInventoryScreen />
      </QueryClientProvider>
    );

    screen.getByText(/Mobile stock control for the floor team/i);
    screenResult.unmount();
    queryClient.clear();
  });
});
