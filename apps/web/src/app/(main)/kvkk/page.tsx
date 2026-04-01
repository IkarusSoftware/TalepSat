import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { getLegalDocument } from '../../../../../../shared/legal-content';

export const metadata = {
  title: 'KVKK Aydınlatma Metni | TalepSat',
};

export default function KvkkPage() {
  return <LegalDocumentPage document={getLegalDocument('kvkk')} />;
}
