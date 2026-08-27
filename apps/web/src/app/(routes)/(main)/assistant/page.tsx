import { Metadata } from 'next';

import AssistantView from '@/features/assistant/components/AssistantView';

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'An AI Assistant to help create packing lists.',
};

export default function Page() {
  return (
    <div className="flex w-full flex-col justify-center overflow-y-auto">
      <h1 className="sr-only">AI Assistant</h1>
      <AssistantView />
    </div>
  );
}
