import type { ReactNode } from 'react';

import { Text, View } from 'react-native';

export function WorkflowCard({
  eyebrow,
  title,
  description,
  icon
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <View className="rounded-[28px] border border-line bg-panel p-5">
      <View className="mb-4 self-start rounded-[18px] bg-accentSoft p-3">{icon}</View>
      <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-muted">
        {eyebrow}
      </Text>
      <Text className="mt-3 text-xl font-semibold tracking-tight text-ink">{title}</Text>
      <Text className="mt-2 text-sm leading-6 text-muted">{description}</Text>
    </View>
  );
}
