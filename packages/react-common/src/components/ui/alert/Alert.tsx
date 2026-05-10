import classNames from 'classnames';

import { MessageList } from '../utils/MessageList';

type AlertType = 'info' | 'warning' | 'error' | 'success';
interface AlertProps {
  message: string | string[];
  type?: AlertType;
  className?: string;
}

const alertType: Record<AlertType, string> = {
  info: 'bg-info border-info-ring text-info-foreground',
  warning: 'bg-warning border-warning-ring text-warning-foreground',
  error: 'bg-danger border-danger-ring text-danger-foreground',
  success: 'bg-success border-success-ring text-success-foreground',
};

export function Alert(props: AlertProps) {
  const { message, type = 'error', className } = props;
  const alertRole = type === 'error' ? 'alert' : 'status';

  const alertClassName = classNames(
    'flex w-full flex-col items-center justify-center self-start rounded-md border p-4 text-sm',
    alertType[type],
    className,
  );

  return (
    <div role={alertRole} className={alertClassName}>
      {Array.isArray(message) ? <MessageList messages={message} /> : message}
    </div>
  );
}
