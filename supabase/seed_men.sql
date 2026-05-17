-- NextLove — Seed : 10 profils masculins
INSERT INTO public.users (
  id, name, age, gender, looking_for, about, lifestyle, relation_type,
  kids, religion, smoke, drink, education, values, photos, location,
  is_premium, is_verified, is_active, questionnaire_data
) VALUES

(uuid_generate_v4(), 'Lucas', 29, 'man', 'woman',
 'Entrepreneur dans la tech, passionné de surf et de voyage. Je cherche quelqu''un d''authentique avec qui partager de vraies aventures.',
 'Actif', 'serious', 'open', 'Aucune', 'never', 'socially', 'masters',
 ARRAY['Infidélité passée','Alcool fréquent'], ARRAY['https://randomuser.me/api/portraits/men/32.jpg'],
 '{"city":"Paris","lat":48.8566,"lng":2.3522}',
 true, true, true,
 '{"firstName":"Lucas","age":29,"city":"Paris","job":"Entrepreneur","education":"bac5","personality":"extravert","dominantTrait":"adventurer","humorLevel":8,"communication":"Direct","attachment":"Secure","religion":"Aucune","politics":"Centre","familyImportance":7,"ambitionLevel":10,"honestyLevel":9,"lifestyle":"Actif","sports":"Régulier","alcohol":"Socially","smoking":"Non fumeur","diet":"Omnivore","pets":"J aime","partnerAgeMin":24,"partnerAgeMax":34,"maxDistance":50,"appearanceImportance":7,"partnerEducation":"bac3","childrenOk":"Oui","dealBreakers":["infidelity","heavy_drinker"]}'),

(uuid_generate_v4(), 'Thomas', 31, 'man', 'woman',
 'Médecin généraliste et coureur de marathon. La santé et le sport sont au cœur de ma vie. Je cherche quelqu''un de curieux et bienveillant.',
 'Actif', 'serious', 'want', 'Croyant', 'never', 'never', 'phd',
 ARRAY['Fumeur','Relation non sérieuse'], ARRAY['https://randomuser.me/api/portraits/men/44.jpg'],
 '{"city":"Lyon","lat":45.7640,"lng":4.8357}',
 false, true, true,
 '{"firstName":"Thomas","age":31,"city":"Lyon","job":"Médecin","education":"doctorate","personality":"ambivert","dominantTrait":"empathic","humorLevel":7,"communication":"Diplomatique","attachment":"Secure","religion":"Croyant","politics":"Centre","familyImportance":9,"ambitionLevel":8,"honestyLevel":10,"lifestyle":"Actif","sports":"Intensif","alcohol":"Non","smoking":"Non fumeur","diet":"Omnivore","pets":"J adore","partnerAgeMin":26,"partnerAgeMax":38,"maxDistance":40,"appearanceImportance":6,"partnerEducation":"bac5","childrenOk":"Oui","dealBreakers":["smoker","casual_only"]}'),

(uuid_generate_v4(), 'Hugo', 27, 'man', 'woman',
 'Designer UX passionné par la créativité et l''art. Amoureux du cinéma indépendant et des cafés en terrasse. Toujours partant pour un road trip.',
 'Équilibré', 'casual', 'open', 'Aucune', 'never', 'socially', 'masters',
 ARRAY['Valeurs très différentes'], ARRAY['https://randomuser.me/api/portraits/men/68.jpg'],
 '{"city":"Paris","lat":48.8566,"lng":2.3522}',
 false, true, true,
 '{"firstName":"Hugo","age":27,"city":"Paris","job":"Designer UX","education":"bac5","personality":"introvert","dominantTrait":"creative","humorLevel":9,"communication":"Émotionnel","attachment":"Anxieux","religion":"Aucune","politics":"Gauche","familyImportance":5,"ambitionLevel":7,"honestyLevel":8,"lifestyle":"Équilibré","sports":"Occasionnel","alcohol":"Socially","smoking":"Non fumeur","diet":"Végétarien","pets":"J adore","partnerAgeMin":23,"partnerAgeMax":32,"maxDistance":30,"appearanceImportance":7,"partnerEducation":"bac3","childrenOk":"Indifférent","dealBreakers":["different_values"]}'),

(uuid_generate_v4(), 'Antoine', 34, 'man', 'woman',
 'Chef cuisinier étoilé, passionné par les saveurs et les voyages gastronomiques. Je cherche quelqu''un qui partage ma passion pour la belle vie.',
 'Actif', 'serious', 'open', 'Aucune', 'sometimes', 'socially', 'bachelors',
 ARRAY['Infidélité passée'], ARRAY['https://randomuser.me/api/portraits/men/55.jpg'],
 '{"city":"Bordeaux","lat":44.8378,"lng":-0.5792}',
 true, true, true,
 '{"firstName":"Antoine","age":34,"city":"Bordeaux","job":"Chef Cuisinier","education":"bac3","personality":"extravert","dominantTrait":"adventurer","humorLevel":8,"communication":"Direct","attachment":"Secure","religion":"Aucune","politics":"Apolitique","familyImportance":7,"ambitionLevel":9,"honestyLevel":8,"lifestyle":"Actif","sports":"Occasionnel","alcohol":"Socially","smoking":"Occasionnel","diet":"Omnivore","pets":"Neutre","partnerAgeMin":26,"partnerAgeMax":40,"maxDistance":80,"appearanceImportance":7,"partnerEducation":"bac","childrenOk":"Indifférent","dealBreakers":["infidelity"]}'),

(uuid_generate_v4(), 'Maxime', 26, 'man', 'woman',
 'Ingénieur en IA chez une startup parisienne. Passionné de jeux de société, d''escalade et de science-fiction. Cherche une vraie connexion.',
 'Équilibré', 'serious', 'dont_want', 'Aucune', 'never', 'socially', 'masters',
 ARRAY['Fumeur','Alcool fréquent'], ARRAY['https://randomuser.me/api/portraits/men/79.jpg'],
 '{"city":"Paris","lat":48.8566,"lng":2.3522}',
 false, true, true,
 '{"firstName":"Maxime","age":26,"city":"Paris","job":"Ingénieur IA","education":"bac5","personality":"introvert","dominantTrait":"rational","humorLevel":7,"communication":"Factuel","attachment":"Secure","religion":"Aucune","politics":"Apolitique","familyImportance":5,"ambitionLevel":9,"honestyLevel":10,"lifestyle":"Équilibré","sports":"Régulier","alcohol":"Socially","smoking":"Non fumeur","diet":"Omnivore","pets":"Neutre","partnerAgeMin":22,"partnerAgeMax":30,"maxDistance":30,"appearanceImportance":6,"partnerEducation":"bac5","childrenOk":"Non","dealBreakers":["smoker","heavy_drinker"]}'),

(uuid_generate_v4(), 'Pierre', 32, 'man', 'woman',
 'Avocat pénaliste le jour, guitariste le soir. La justice et la musique sont mes deux passions. Amateur de randonnée et de bonne littérature.',
 'Équilibré', 'serious', 'open', 'Croyant', 'never', 'socially', 'masters',
 ARRAY['Infidélité passée','Alcool fréquent'], ARRAY['https://randomuser.me/api/portraits/men/21.jpg'],
 '{"city":"Toulouse","lat":43.6047,"lng":1.4442}',
 false, true, true,
 '{"firstName":"Pierre","age":32,"city":"Toulouse","job":"Avocat","education":"bac5","personality":"ambivert","dominantTrait":"rational","humorLevel":7,"communication":"Direct","attachment":"Secure","religion":"Croyant","politics":"Centre","familyImportance":8,"ambitionLevel":9,"honestyLevel":10,"lifestyle":"Équilibré","sports":"Occasionnel","alcohol":"Socially","smoking":"Non fumeur","diet":"Omnivore","pets":"J aime","partnerAgeMin":27,"partnerAgeMax":38,"maxDistance":60,"appearanceImportance":6,"partnerEducation":"bac5","childrenOk":"Oui","dealBreakers":["infidelity","heavy_drinker"]}'),

(uuid_generate_v4(), 'Nicolas', 28, 'man', 'woman',
 'Photographe professionnel spécialisé en portraits. Je vois le monde à travers mon objectif. Amoureux du jazz et des marchés du dimanche.',
 'Casanier', 'serious', 'open', 'Spirituel', 'never', 'never', 'bachelors',
 ARRAY['Relation non sérieuse','Fumeur'], ARRAY['https://randomuser.me/api/portraits/men/91.jpg'],
 '{"city":"Nantes","lat":47.2184,"lng":-1.5536}',
 false, true, true,
 '{"firstName":"Nicolas","age":28,"city":"Nantes","job":"Photographe","education":"bac3","personality":"introvert","dominantTrait":"creative","humorLevel":7,"communication":"Émotionnel","attachment":"Secure","religion":"Spirituel","politics":"Gauche","familyImportance":8,"ambitionLevel":7,"honestyLevel":9,"lifestyle":"Casanier","sports":"Occasionnel","alcohol":"Non","smoking":"Non fumeur","diet":"Omnivore","pets":"J adore","partnerAgeMin":24,"partnerAgeMax":34,"maxDistance":50,"appearanceImportance":5,"partnerEducation":"bac3","childrenOk":"Indifférent","dealBreakers":["casual_only","smoker"]}'),

(uuid_generate_v4(), 'Baptiste', 25, 'man', 'woman',
 'Kiné du sport, passionné de trail running et de nutrition. Je cherche quelqu''un d''actif et d''optimiste avec qui partager de belles sorties.',
 'Actif', 'serious', 'want', 'Aucune', 'never', 'socially', 'masters',
 ARRAY['Fumeur','Pas de sport'], ARRAY['https://randomuser.me/api/portraits/men/12.jpg'],
 '{"city":"Grenoble","lat":45.1885,"lng":5.7245}',
 false, false, true,
 '{"firstName":"Baptiste","age":25,"city":"Grenoble","job":"Kinésithérapeute","education":"bac5","personality":"extravert","dominantTrait":"adventurer","humorLevel":8,"communication":"Direct","attachment":"Secure","religion":"Aucune","politics":"Apolitique","familyImportance":7,"ambitionLevel":8,"honestyLevel":9,"lifestyle":"Actif","sports":"Intensif","alcohol":"Socially","smoking":"Non fumeur","diet":"Omnivore","pets":"J adore","partnerAgeMin":22,"partnerAgeMax":32,"maxDistance":70,"appearanceImportance":7,"partnerEducation":"bac3","childrenOk":"Oui","dealBreakers":["smoker","no_sport"]}'),

(uuid_generate_v4(), 'Julien', 33, 'man', 'woman',
 'Directeur artistique dans une agence de pub. Cinéphile, voyageur et amateur de street art. Je crois aux rencontres qui changent la vie.',
 'Équilibré', 'serious', 'open', 'Aucune', 'never', 'socially', 'masters',
 ARRAY['Infidélité passée'], ARRAY['https://randomuser.me/api/portraits/men/28.jpg'],
 '{"city":"Marseille","lat":43.2965,"lng":5.3698}',
 true, true, true,
 '{"firstName":"Julien","age":33,"city":"Marseille","job":"Directeur Artistique","education":"bac5","personality":"ambivert","dominantTrait":"creative","humorLevel":9,"communication":"Diplomatique","attachment":"Secure","religion":"Aucune","politics":"Gauche","familyImportance":6,"ambitionLevel":8,"honestyLevel":9,"lifestyle":"Équilibré","sports":"Occasionnel","alcohol":"Socially","smoking":"Non fumeur","diet":"Omnivore","pets":"J aime","partnerAgeMin":26,"partnerAgeMax":38,"maxDistance":50,"appearanceImportance":7,"partnerEducation":"bac5","childrenOk":"Indifférent","dealBreakers":["infidelity"]}'),

(uuid_generate_v4(), 'Alexandre', 30, 'man', 'woman',
 'Data scientist et alpiniste le week-end. J''aime les défis intellectuels et physiques. Cherche quelqu''un qui ose sortir de sa zone de confort.',
 'Actif', 'serious', 'want', 'Aucune', 'never', 'socially', 'phd',
 ARRAY['Alcool fréquent','Fumeur'], ARRAY['https://randomuser.me/api/portraits/men/38.jpg'],
 '{"city":"Strasbourg","lat":48.5734,"lng":7.7521}',
 false, true, true,
 '{"firstName":"Alexandre","age":30,"city":"Strasbourg","job":"Data Scientist","education":"doctorate","personality":"introvert","dominantTrait":"rational","humorLevel":6,"communication":"Factuel","attachment":"Secure","religion":"Aucune","politics":"Centre","familyImportance":6,"ambitionLevel":10,"honestyLevel":9,"lifestyle":"Actif","sports":"Intensif","alcohol":"Socially","smoking":"Non fumeur","diet":"Omnivore","pets":"Neutre","partnerAgeMin":25,"partnerAgeMax":35,"maxDistance":80,"appearanceImportance":6,"partnerEducation":"bac5","childrenOk":"Oui","dealBreakers":["heavy_drinker","smoker"]}')

ON CONFLICT (id) DO NOTHING;
