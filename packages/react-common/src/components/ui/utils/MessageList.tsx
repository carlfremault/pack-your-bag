interface MessageListProps {
  messages: string[];
}

export function MessageList(props: MessageListProps) {
  const { messages } = props;

  return (
    <ul className="list-disc pl-4">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}
