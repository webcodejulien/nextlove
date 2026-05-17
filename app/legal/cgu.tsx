import LegalScreen from '../../components/LegalScreen';
import { CGU_SECTIONS, LAST_UPDATE_CGU } from '../../constants/legalContent';

export default function CGUScreen() {
  return (
    <LegalScreen
      title="Conditions Générales d'Utilisation"
      subtitle="Règles d'utilisation de l'application NextLove"
      icon="document-text"
      lastUpdated={LAST_UPDATE_CGU}
      sections={CGU_SECTIONS}
    />
  );
}
