import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { getLegalDocument } from '../../../../../../shared/legal-content';

export const metadata = {
  title: 'Gizlilik Politikası | TalepSat',
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={getLegalDocument('privacy')} />;
}
