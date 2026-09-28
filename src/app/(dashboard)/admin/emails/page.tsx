import presentation from './page-presentation.module.css';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-context';
import EmailAdminClient from './email-admin-client';
import { PageFrame } from '@/components/atoms';

export const metadata = {
  title: 'Email Templates — Holloway',
};

export default async function EmailAdminPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login?redirect=/admin/emails');
  if (!user.isSuperAdmin) redirect('/');

  return (
    <PageFrame>
      <div className={presentation.section1}>
        <div className={presentation.row1}>
          <div className={presentation.row2}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={presentation.ink1}
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div>
            <h1 className="h2">Email Templates</h1>
            <p
              className={['dim text-xs', presentation.copy1]
                .filter(Boolean)
                .join(' ')}
            >
              Preview and test transactional emails
            </p>
          </div>
        </div>
      </div>
      <EmailAdminClient userEmail={user.email} />
    </PageFrame>
  );
}
