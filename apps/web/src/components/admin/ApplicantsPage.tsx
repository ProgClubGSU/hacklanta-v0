import { useState } from 'react';
import type { ApplicationData } from '../dashboard/ApplicationForm';
import ApplicantReview from './ApplicantReview';
import ApplicantTable from './ApplicantTable';
import StatsOverview from './StatsOverview';

export default function ApplicantsPage() {
  const [selected, setSelected] = useState<ApplicationData | null>(null);

  const handleUpdated = (updated: ApplicationData) => {
    setSelected(updated);
  };

  return (
    <div>
      <StatsOverview />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className={selected ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <ApplicantTable onSelect={setSelected} />
        </div>

        {selected && (
          <div className="lg:col-span-1">
            <ApplicantReview
              application={selected}
              onClose={() => setSelected(null)}
              onUpdated={handleUpdated}
            />
          </div>
        )}
      </div>
    </div>
  );
}
