import { GraduationCapIcon } from './icons';
export function Brand({ compact = false, homePath = 'admin.html' }: { compact?: boolean; homePath?: string }) {
  return <a className={`brand ${compact ? 'brand-compact' : ''}`} href={`#/${homePath}`} aria-label="ShalaTrack overview">
    <span className="brand-mark"><GraduationCapIcon /></span>
    <span>Shala<span className="brand-light">Track</span><span className="brand-period">.</span></span>
  </a>;
}
