import LegalScreen from '../../components/LegalScreen';
import { PRIVACY_SECTIONS, LAST_UPDATE_PRIVACY } from '../../constants/legalContent';

export default function PrivacyScreen() {
  return (
    <LegalScreen
      title="Politique de confidentialité"
      subtitle="Comment NextLove collecte, utilise et protège vos données personnelles"
      icon="shield-checkmark"
      lastUpdated={LAST_UPDATE_PRIVACY}
      sections={PRIVACY_SECTIONS}
    />
  );
}
