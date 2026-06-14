import { ActivityIndicator, Text, View } from 'react-native';

type StatusState = 'loading' | 'healthy' | 'unavailable';

export function ServiceStatusCard({
  title,
  description,
  state,
  timestamp
}: {
  title: string;
  description: string;
  state: StatusState;
  timestamp?: string;
}) {
  return (
    <View className="rounded-[24px] border border-line bg-panel p-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-base font-semibold text-ink">{title}</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">{description}</Text>
        </View>
        {state === 'loading' ? (
          <ActivityIndicator color="#a16207" />
        ) : (
          <View
            className={`rounded-full px-3 py-1 ${
              state === 'healthy' ? 'bg-emerald-100' : 'bg-rose-100'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold uppercase tracking-[2px] ${
                state === 'healthy' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {state === 'healthy' ? 'Healthy' : 'Unavailable'}
            </Text>
          </View>
        )}
      </View>
      <Text className="mt-4 font-mono text-xs text-muted">{timestamp ?? 'No timestamp yet'}</Text>
    </View>
  );
}
