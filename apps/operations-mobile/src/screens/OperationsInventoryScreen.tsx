import { useQuery } from '@tanstack/react-query';
import { fetchServiceHealth } from '@supermarket/api-sdk';
import { ClipboardCheck, PackageCheck, TriangleAlert } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ServiceStatusCard } from '../components/ServiceStatusCard';
import { WorkflowCard } from '../components/WorkflowCard';
import { mobileServiceBaseUrls } from '../environment';

export function OperationsInventoryScreen() {
  const healthQuery = useQuery({
    queryKey: ['mobile-health', 'inventory'],
    queryFn: () =>
      fetchServiceHealth('inventory', {
        baseUrl: mobileServiceBaseUrls.inventory
      })
  });

  const healthState = healthQuery.isPending
    ? 'loading'
    : healthQuery.isSuccess
      ? 'healthy'
      : 'unavailable';

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-4">
        <View className="rounded-[32px] border border-line bg-panel p-6">
          <Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-accent">
            Operations Mobile
          </Text>
          <Text className="mt-3 text-[30px] font-semibold tracking-tight text-ink">
            Mobile stock control for the floor team.
          </Text>
          <Text className="mt-3 text-sm leading-6 text-muted">
            The first mobile lane is intentionally narrow: receiving, loss capture, and physical
            adjustment with clear touch targets and low visual noise.
          </Text>
        </View>

        <ServiceStatusCard
          title="Inventory backend"
          description="Checks the live inventory service before deeper mobile workflows are added."
          state={healthState}
          timestamp={healthQuery.data?.timestamp}
        />

        <WorkflowCard
          eyebrow="Receiving"
          title="Capture supplier arrivals"
          description="Prepare a touch-first invoice receiving flow for warehouse and store operators."
          icon={<PackageCheck color="#1f766e" size={22} />}
        />
        <WorkflowCard
          eyebrow="Losses"
          title="Register shrink quickly"
          description="Keep damage, expiration, and theft capture compact enough for real stock-room usage."
          icon={<TriangleAlert color="#1f766e" size={22} />}
        />
        <WorkflowCard
          eyebrow="Physical count"
          title="Adjust counted stock"
          description="Support store-floor count corrections with explicit collector context and threshold updates."
          icon={<ClipboardCheck color="#1f766e" size={22} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
