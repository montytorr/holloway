import presentation from './page-presentation.module.css';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-context';
import EmailAdminClient from './email-admin-client';
import { PageFrame, SectionHeader } from '@/components/atoms';

export const metadata = {
  title: 'Email Templates — Holloway',
};

export default async function EmailAdminPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login?redirect=/admin/emails');
  if (!user.isSuperAdmin) redirect('/');

  return (
    <PageFrame>
      <SectionHeader
        title={<>Email Templates</>}
        sub={
          <>
            <p
              className={['dim text-xs', presentation.copy1]
                .filter(Boolean)
                .join(' ')}
            >
              Preview and test transactional emails
            </p>
          </>
        }
      />
      <EmailAdminClient userEmail={user.email} />
    </PageFrame>
  );
}
