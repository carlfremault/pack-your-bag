interface MessageListProps {
  messages: string[];
}

export default function MessageList(props: MessageListProps) {
  const { messages } = props;

  return (
    <ul className="list-disc pl-4">
      {messages.map((message, index) => (
        <li key={`${index}-${message.slice(0, 10)}`}>{message}</li>
      ))}
    </ul>
  );
}
