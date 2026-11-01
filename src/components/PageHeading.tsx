import type { ReactNode } from 'react';
export function PageHeading({ title, description, action }: { title: string; description: ReactNode; action?: ReactNode }) {
  return <div className="page-heading"><div><h1 tabIndex={-1}>{title}</h1><p>{description}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>;
}
