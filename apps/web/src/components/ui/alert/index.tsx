import classNames from 'classnames';

import { AlertType } from '@/types/ui-types';

import MessageList from './MessageList';

interface AlertProps {
  message: string | string[];
  type?: AlertType;
  className?: string;
}

const alertType: Record<AlertType, string> = {
  info: 'bg-blue-300 border-blue-600 text-black',
  warning: 'bg-yellow-200 border-yellow-600 text-black',
  error: 'bg-red-300 border-red-500 text-black',
  success: 'bg-green-200 border-green-600 text-black',
};

export default function Alert(props: AlertProps) {
  const { message, type = 'error', className } = props;
  const alertRole = type === 'error' ? 'alert' : 'status';

  const alertClassName = classNames(
    'flex w-full flex-col items-center justify-center self-start rounded-md border p-4',
    alertType[type],
    className,
  );

  return (
    <div role={alertRole} className={alertClassName}>
      {Array.isArray(message) ? <MessageList messages={message} /> : message}
    </div>
  );
}
