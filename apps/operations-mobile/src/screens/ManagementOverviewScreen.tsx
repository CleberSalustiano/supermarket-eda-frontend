import { useQuery } from '@tanstack/react-query';
import { fetchServiceHealth } from '@supermarket/api-sdk';
import { BriefcaseBusiness, ChartNoAxesCombined, Users } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ServiceStatusCard } from '../components/ServiceStatusCard';
import { WorkflowCard } from '../components/WorkflowCard';
import { mobileServiceBaseUrls } from '../environment';

export function ManagementOverviewScreen() {
  const healthQuery = useQuery({
    queryKey: ['mobile-health', 'management'],
    queryFn: () =>
      fetchServiceHealth('management', {
        baseUrl: mobileServiceBaseUrls.management
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
            Manager View
          </Text>
          <Text className="mt-3 text-[30px] font-semibold tracking-tight text-ink">
            Useful visibility without the full desktop surface.
          </Text>
          <Text className="mt-3 text-sm leading-6 text-muted">
            Managers should be able to check essential signals on a company phone without carrying
            the entire admin interface into mobile.
          </Text>
        </View>

        <ServiceStatusCard
          title="Management backend"
          description="Confirms that the reporting and management service is reachable from the mobile shell."
          state={healthState}
          timestamp={healthQuery.data?.timestamp}
        />

        <WorkflowCard
          eyebrow="Reporting"
          title="Compact P&L access"
          description="Use the existing profit-and-loss endpoint as the first mobile visibility surface."
          icon={<ChartNoAxesCombined color="#1f766e" size={22} />}
        />
        <WorkflowCard
          eyebrow="Catalog"
          title="Fast operational context"
          description="Prepare room for quick product and pricing visibility once read endpoints exist."
          icon={<BriefcaseBusiness color="#1f766e" size={22} />}
        />
        <WorkflowCard
          eyebrow="People"
          title="Role-aware expansion"
          description="Keep future mobile management capabilities narrow and role-conscious from the start."
          icon={<Users color="#1f766e" size={22} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
