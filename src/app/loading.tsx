import { Loader } from '@/components/Loader';

export default function Loading() {
  return (
    <div className="page-container grid min-h-[calc(100vh-4.5rem)] place-items-center py-12">
      <Loader label="Loading Splitbill" />
    </div>
  );
}
