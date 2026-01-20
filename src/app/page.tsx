import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to reputation page as the main entry point
  redirect('/reputation');
}
