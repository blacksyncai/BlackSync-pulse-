import {
  getDueTaskAlerts,
  getTaskAlertKey,
} from '@/pulse-notifications/utils/getDueTaskAlerts';
import { type PulseTask } from '@/pulse-tasks/types/PulseTask';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { useToast } from 'twenty-ui/components';

const NOTIFIED_STORAGE_KEY = 'pulse-task-alerts-notified';
const CHECK_INTERVAL_MS = 60 * 1000;
const NOTIFIED_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

const readNotified = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
};

const writeNotified = (notified: Record<string, number>) => {
  try {
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(notified));
  } catch {
    // Storage can be blocked; alerts then just repeat after a reload.
  }
};

export const canUseDesktopNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const useDesktopTaskAlerts = ({
  tasks,
  refetch,
}: {
  tasks: PulseTask[];
  refetch: () => Promise<unknown>;
}) => {
  const { enqueueToast } = useToast();
  const navigate = useNavigate();
  const latest = useRef({ tasks, refetch, enqueueToast, navigate });

  latest.current = { tasks, refetch, enqueueToast, navigate };

  // Polling is a subscription to time passing, which no event handler can drive.
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const notified = readNotified();
      const alerts = getDueTaskAlerts(
        latest.current.tasks,
        now,
        new Set(Object.keys(notified)),
      );

      for (const task of alerts) {
        const title = task.title.length > 0 ? task.title : 'Untitled task';
        const account = task.target?.companyName ?? task.target?.personName;
        const body = [
          task.priority === 'URGENT' ? 'Urgent' : null,
          (task.dueAt?.getTime() ?? 0) < now ? 'Overdue' : 'Due now',
          account,
        ]
          .filter(Boolean)
          .join(' · ');

        notified[getTaskAlertKey(task)] = now;
        latest.current.enqueueToast({
          variant: task.priority === 'URGENT' ? 'warning' : 'info',
          children: `${title} · ${body}`,
        });

        if (
          canUseDesktopNotifications() &&
          Notification.permission === 'granted'
        ) {
          const notification = new Notification(title, {
            body,
            tag: getTaskAlertKey(task),
          });

          notification.onclick = () => {
            window.focus();
            latest.current.navigate(AppPath.PulseTodo);
          };
        }
      }

      writeNotified(
        Object.fromEntries(
          Object.entries(notified).filter(
            ([, notifiedAt]) => now - notifiedAt < NOTIFIED_RETENTION_MS,
          ),
        ),
      );
    };

    const timeout = setTimeout(check, 5000);
    const interval = setInterval(() => {
      void latest.current
        .refetch()
        .catch(() => undefined)
        .then(check);
    }, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);
};
