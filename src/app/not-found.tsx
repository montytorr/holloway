import Link from '@/components/app-link';
import { HollowayMark } from '@/components/holloway-mark';

export default function NotFound() {
  return (
    <main className="system-message">
      <HollowayMark size={40} />
      <p className="page-eyebrow">Holloway · 404</p>
      <h1 className="h1">Page not found</h1>
      <p className="page-description">
        This address doesn’t point to an available page. Return to your
        workspace to find what you need.
      </p>
      <Link href="/" className="btn btn--primary">
        Open workspace
      </Link>
    </main>
  );
}
