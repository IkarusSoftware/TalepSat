import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { getLegalDocument } from '../../../../../../shared/legal-content';

export const metadata = {
  title: 'Çerez Politikası | TalepSat',
};

export default function CookiesPage() {
  return <LegalDocumentPage document={getLegalDocument('cookies')} />;
}
