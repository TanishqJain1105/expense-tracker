import { redirect } from 'next/navigation';

/** The dashboard is the home page now; this keeps old links working. */
export default function DashboardPage() {
  redirect('/');
}
