// See App.tsx's own comment on this same import -- required for the
// classic JSX transform this app's tsconfig uses.
import * as React from 'react';
import { useEffect, useRef } from 'react';
import type { ScdsListColumn } from '@tn4consulting/shared-ui-scds-core';
import type { UpstreamResult } from 'dashboard-data-access';
import './register-scds';

type ScdsMultiColumnListElement = HTMLElement & {
  items: unknown[];
  columns: ScdsListColumn[];
};

const COLUMNS: ScdsListColumn[] = [{ id: 'task', header: 'Task', cell: (task) => task as string }];

export function TasksList({ tasks }: { tasks: UpstreamResult<string[]> | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listElRef = useRef<ScdsMultiColumnListElement | null>(null);

  // scds-multi-column-list's `items`/`columns` are DOM properties (they're
  // non-primitive), not HTML attributes -- created and mounted imperatively
  // rather than via JSX, same pattern as job-bank's FeatureSearch.tsx.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !tasks || tasks.status !== 'ok') {
      return;
    }
    const list = document.createElement('scds-multi-column-list') as ScdsMultiColumnListElement;
    list.setAttribute('list-label', 'My Tasks');
    list.setAttribute('empty-label', 'No outstanding tasks.');
    list.columns = COLUMNS;
    list.items = tasks.data;
    listElRef.current = list;
    container.appendChild(list);
    return () => {
      container.removeChild(list);
      listElRef.current = null;
    };
  }, [tasks]);

  return (
    <section className="tasks-list">
      <scds-heading tag="h2" id="tasks-heading">
        My Tasks
      </scds-heading>
      {tasks ? (
        tasks.status === 'ok' ? (
          <div ref={containerRef} />
        ) : (
          <p role="alert">Tasks are temporarily unavailable.</p>
        )
      ) : null}
    </section>
  );
}
