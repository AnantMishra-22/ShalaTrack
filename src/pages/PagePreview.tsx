import { PageHeading } from '../components/PageHeading';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeftIcon, CheckIcon } from '../components/icons';
import { addedPages, pages, pageHref } from '../data/pages';

export function PagePreview({ path, homePath = 'admin.html' }: { path: string; homePath?: string }) {
  const page = pages.find(item => item.path === path);
  return <div className="page-content route-preview">
    <PageHeading title={page?.title || 'Page not found'} description={page ? 'Scheduled for the next redesign milestone.' : 'This page is not in the redesign.'} action={<Button asChild variant="outline"><a href={pageHref(homePath)}><ArrowLeftIcon />{homePath === 'admin.html' ? 'School overview' : 'Teacher overview'}</a></Button>} />
    <Card className="planned-page-card">
      <Badge className="demo-badge">Planned page</Badge>
      <h2>{page ? 'What this page will retain' : 'Return to the school overview'}</h2>
      <p>This milestone covers the shared navigation, sign-in preview and admin dashboard. This destination is reserved, with its feature checklist recorded.</p>
      {page && <ul className="feature-checklist">{page.features.map(feature => <li key={feature}><CheckIcon />{feature}</li>)}</ul>}
      {page && addedPages.includes(page) && <p className="subtle-note">Added to support the agreed backend architecture.</p>}
    </Card>
  </div>;
}
