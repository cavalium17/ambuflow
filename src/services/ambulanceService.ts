import { GoogleGenAI, Type } from "@google/genai";
import { AmbulanceCompany } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AmbulanceSearchResponse {
  ville: string;
  resultats: AmbulanceCompany[];
  fallback: {
    actif: boolean;
    message: string;
    autoriser_saisie_libre: boolean;
  };
}

export async function fetchAmbulanceCompanies(city: string): Promise<AmbulanceSearchResponse> {
  const emptyResponse: AmbulanceSearchResponse = {
    ville: city,
    resultats: [],
    fallback: { actif: false, message: "", autoriser_saisie_libre: true }
  };

  if (!city || city.length < 3) return emptyResponse;

  // 1. Local Fallback (Last resort)
  const getLocalFallback = (cityName: string): AmbulanceSearchResponse => {
    const slug = cityName.toLowerCase().replace(/\s+/g, '-');
    return {
      ville: cityName,
      resultats: [
        {
          id: `ambulances-locales-${slug}-1`,
          nom: `Ambulances de ${cityName}`,
          adresse: `Centre-ville, ${cityName}`,
          telephone: null,
          latitude: null,
          longitude: null,
          label: `Ambulances de ${cityName} - ${cityName}`,
          value: `ambulances-locales-${slug}-1`,
          suggestion: true
        },
        {
          id: `vsl-taxi-${slug}-2`,
          nom: `VSL & Taxis ${cityName}`,
          adresse: `Zone Artisanale, ${cityName}`,
          telephone: null,
          latitude: null,
          longitude: null,
          label: `VSL & Taxis ${cityName} - ${cityName}`,
          value: `vsl-taxi-${slug}-2`,
          suggestion: true
        }
      ],
      fallback: { actif: true, message: "Données locales générées", autoriser_saisie_libre: true }
    };
  };

  // 2. SIREN API Fallback
  const fetchSirenFallback = async (cityName: string): Promise<AmbulanceSearchResponse> => {
    const cleanQuery = cityName.trim();
    if (cleanQuery.length < 3) return emptyResponse;

    try {
      const url = new URL("https://recherche-entreprises.api.gouv.fr/search");
      
      // Paramètres optimisés pour ton besoin
      url.searchParams.append("q", cleanQuery);
      url.searchParams.append("activite_principale", "86.90A"); // Filtre APE Ambulances
      url.searchParams.append("per_page", "25"); // Limite acceptée par l'API
      url.searchParams.append("limite_matching_etablissements", "true");

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`SIREN API error: ${response.status}`);
      
      const data = await response.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        return {
          ville: cityName,
          resultats: data.results.map((item: any) => ({
            id: item.siege?.siret || Math.random().toString(36).substr(2, 9),
            nom: item.nom_complet || item.nom_raison_sociale,
            adresse: item.siege?.adresse || item.siege?.geo_adresse || item.nom_complet,
            telephone: null,
            latitude: item.siege?.latitude ? parseFloat(item.siege.latitude) : null,
            longitude: item.siege?.longitude ? parseFloat(item.siege.longitude) : null,
            label: `${item.nom_complet || item.nom_raison_sociale} - ${item.siege?.libelle_commune || cityName}`,
            value: item.siege?.siret || Math.random().toString(36).substr(2, 9),
            suggestion: true,
            zipCode: item.siege?.code_postal,
            city: item.siege?.libelle_commune
          })),
          fallback: { actif: true, message: "Données SIRENE officielles", autoriser_saisie_libre: true }
        };
      }
    } catch (e) {
      console.error("Siren fallback failed:", e);
    }
    return getLocalFallback(cityName);
  };

  // 3. Main Gemini Search
  try {
    const systemInstruction = `Tu es un assistant qui transforme des données de recherche en liste de sociétés d’ambulance pour une application.

OBJECTIF :
Créer une liste simple et propre de sociétés d’ambulance pour une dropdown.

RÈGLES :
- Garde les résultats qui ressemblent à des entreprises d’ambulance (Ambulances, VSL, Transport Sanitaire)
- Ne filtre PAS trop (si peu de résultats, garde-les tous)
- Supprime les doublons
- Sois précis sur les noms

RÈGLES FORMAT :
- id = nom en minuscule avec tirets (ex: "ambulances-du-centre")
- label = nom + " - ${city}"
- value = id
- suggestion = true

IMPORTANT :
- Si seulement 2 résultats → retourne les 2 (ne supprime rien)
- JSON uniquement
- pas d’explication`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `VILLE :\n${city}\n\nINSTRUCTION :\nRecherche et liste les sociétés d'ambulance et de transport sanitaire à ${city}, France.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ville: { type: Type.STRING },
            resultats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  nom: { type: Type.STRING },
                  adresse: { type: Type.STRING },
                  telephone: { type: Type.STRING, nullable: true },
                  latitude: { type: Type.NUMBER, nullable: true },
                  longitude: { type: Type.NUMBER, nullable: true },
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  suggestion: { type: Type.BOOLEAN }
                },
                required: ["id", "nom", "adresse", "label", "value", "suggestion"]
              }
            },
            fallback: {
              type: Type.OBJECT,
              properties: {
                actif: { type: Type.BOOLEAN },
                message: { type: Type.STRING },
                autoriser_saisie_libre: { type: Type.BOOLEAN }
              },
              required: ["actif", "message", "autoriser_saisie_libre"]
            }
          },
          required: ["ville", "resultats", "fallback"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text) as AmbulanceSearchResponse;
      if (data.resultats && Array.isArray(data.resultats) && data.resultats.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.error("Gemini search failed:", error);
  }

  // If Gemini fails, try SIREN, then Local
  return await fetchSirenFallback(city);
}
