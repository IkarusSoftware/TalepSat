import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { getLegalDocument } from '../../../../../../shared/legal-content';

export const metadata = {
  title: 'Kullanım Şartları | TalepSat',
};

export default function TermsPage() {
  return <LegalDocumentPage document={getLegalDocument('terms')} />;
}
