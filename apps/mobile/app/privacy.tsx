import React from 'react';
import { getLegalDocument } from '../../../shared/legal-content';
import { LegalDocumentScreen } from '../src/components/legal/LegalDocumentScreen';

export default function PrivacyScreen() {
  return <LegalDocumentScreen document={getLegalDocument('privacy')} />;
}
