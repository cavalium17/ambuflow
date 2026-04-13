
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, RefreshCw, AlertCircle, Search, Briefcase, MapPin } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  source: string;
  isJob?: boolean;
}

interface NewsTabProps {
  darkMode: boolean;
  currentGeoPosition: { latitude: number; longitude: number } | null;
}

const FEEDS = [
  { name: 'FNMS', url: 'https://www.fnms.fr/actualites/flux-rss' },
  { name: 'Légifrance', url: 'https://www.legifrance.gouv.fr/rss/actualite' },
  { name: 'Ministère Santé', url: 'https://sante.gouv.fr/spip.php?page=backend' }
];

const NewsTab: React.FC<NewsTabProps> = React.memo(({ darkMode, currentGeoPosition }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityName, setCityName] = useState<string | null>(null);

  const fetchCityName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`);
      const data = await response.json();
      const city = data.city || data.locality || data.principalSubdivision || "votre secteur";
      setCityName(city);
      return city;
    } catch (err) {
      console.error("Error fetching city name:", err);
      return "votre secteur";
    }
  };

  const fetchJobs = async (city: string) => {
    try {
      // Mocking job search results as there's no direct RSS for local jobs without API keys
      // In a real scenario, we would use an API like Indeed, France Travail, etc.
      const mockJobs: NewsItem[] = [
        {
          title: `Ambulancier DE (H/F) - ${city}`,
          link: 'https://www.hellowork.com/fr-fr/emploi/ambulancier.html',
          pubDate: new Date().toISOString(),
          contentSnippet: `Poste en CDI à pourvoir immédiatement à ${city}. Planning attractif, véhicule récent. (Source: Hellowork)`,
          source: 'Hellowork',
          isJob: true
        },
        {
          title: `Auxiliaire Ambulancier (H/F) - Secteur ${city}`,
          link: 'https://www.francetravail.fr/recherche-offres/liste?motsCles=ambulancier',
          pubDate: new Date(Date.now() - 43200000).toISOString(),
          contentSnippet: `Mission urgente en intérim à ${city}. Horaires variables, primes de panier. (Source: France Travail / Pôle Emploi)`,
          source: 'France Travail',
          isJob: true
        },
        {
          title: `Ambulancier / Conducteur VSL (H/F) - ${city}`,
          link: 'https://www.indeed.fr/q-ambulancier-l-france.html',
          pubDate: new Date(Date.now() - 86400000).toISOString(),
          contentSnippet: `Recherche auxiliaire motivé pour missions variées. Formation AFGSU à jour requise. (Source: Indeed)`,
          source: 'Indeed',
          isJob: true
        }
      ];
      return mockJobs;
    } catch (err) {
      console.error("Error fetching jobs:", err);
      return [];
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    const allNews: NewsItem[] = [];

    try {
      // Fetch News Feeds
      const fetchPromises = FEEDS.map(async (feed) => {
        try {
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
          const data = await response.json();
          
          if (data.status === 'ok') {
            return data.items.map((item: any) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              contentSnippet: item.description?.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
              source: feed.name
            }));
          }
          return [];
        } catch (err) {
          console.error(`Error fetching ${feed.name}:`, err);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      results.forEach(items => allNews.push(...items));

      // Fetch Jobs if location is available
      if (currentGeoPosition) {
        const city = await fetchCityName(currentGeoPosition.latitude, currentGeoPosition.longitude);
        const jobs = await fetchJobs(city);
        allNews.push(...jobs);
      }

      // Sort by date
      allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      
      // Filter for transport related keywords
      const filteredNews = allNews.filter(item => {
        if (item.isJob) return true; // Keep all jobs
        const keywords = ['transport', 'ambulance', 'vsl', 'sanitaire', 'ambulancier', 'santé', 'sécurité sociale'];
        const content = (item.title + item.contentSnippet).toLowerCase();
        return keywords.some(k => content.includes(k));
      });

      setNews(filteredNews);
    } catch (err) {
      setError("Impossible de charger les actualités. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [currentGeoPosition]);

  const filteredItems = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bentoCardBase = `relative overflow-hidden transition-all duration-300 rounded-[32px] border ${
    darkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'
  } backdrop-blur-xl`;

  return (
    <div className="p-5 space-y-6 animate-fadeIn pb-32">
      {/* Search Bar & Refresh */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          {currentGeoPosition && cityName ? (
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secteur : {cityName}</span>
            </div>
          ) : <div></div>}
          <button 
            onClick={fetchNews}
            disabled={loading}
            className={`p-2 rounded-xl transition-all ${
              darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className={`${bentoCardBase} p-4 flex items-center gap-3`}>
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher une actualité ou un job..."
            className="bg-transparent border-none outline-none text-sm font-bold w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Chargement des nouveautés...</p>
        </div>
      ) : error ? (
        <div className={`${bentoCardBase} p-8 flex flex-col items-center text-center space-y-4`}>
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500">
            <AlertCircle size={32} />
          </div>
          <p className="text-sm font-bold text-slate-500">{error}</p>
          <button 
            onClick={fetchNews}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-bold text-slate-500">Aucun résultat trouvé.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`${bentoCardBase} group cursor-pointer`}
                onClick={() => window.open(item.link, '_blank')}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        item.isJob ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                      }`}>
                        {item.isJob && <Briefcase size={8} className="inline mr-1 mb-0.5" />}
                        {item.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                      <Clock size={12} />
                      {new Date(item.pubDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <h3 className={`text-sm font-black leading-snug mb-2 transition-colors ${
                    item.isJob ? 'group-hover:text-emerald-500' : 'group-hover:text-indigo-500'
                  }`}>
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
                    {item.contentSnippet}
                  </p>
                  <div className={`flex items-center justify-end text-[9px] font-black uppercase tracking-widest gap-1 ${
                    item.isJob ? 'text-emerald-500' : 'text-indigo-500'
                  }`}>
                    {item.isJob ? 'Voir l\'offre' : 'Lire la suite'} <ExternalLink size={12} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

export default NewsTab;
