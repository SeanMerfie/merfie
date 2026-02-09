import { useState, useEffect } from 'react';
import { actions } from 'astro:actions';
import ContentCard from '@components/ContentCard';
import Pagination from '@components/Pagination';

interface CampaignListProps {
  searchTerm?: string | null;
  page?: number;
}

interface Campaign {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  systemId: number | null;
  published: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  status: string | null;
  systemName: string | null;
  coverImage: string | null;
  imagefocalX: number | null;
  imageFocalY: number | null;
  imageAlt: string | null;
  imageArtist: string | null;
  imageArtistURL: string | null;
  tags: string[];
}

interface CampaignsResponse {
  campaigns: Campaign[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
}

const CampaignList = ({ searchTerm = null, page = 1 }: CampaignListProps) => {
  const [data, setData] = useState<CampaignsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);
      console.log(searchTerm)
      const result = await actions.campaigns.getCampaignsPage({
        searchTerm,
        page,
        pageSize: 15
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        setData(result.data);
      }
      setLoading(false);
    };

    fetchCampaigns();
  }, [searchTerm, page]);

  if (loading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!data || data.campaigns.length === 0) {
    return <div className="alert alert-info">No campaigns found.</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.campaigns.map((campaign) => (
          <ContentCard
            key={campaign.id}
            imageUrl={campaign.coverImage}
            focusX={campaign.imagefocalX}
            focusY={campaign.imageFocalY}
            title={campaign.title}
            contentUrl={`/campaigns/${campaign.id}`}
          >
            {campaign.subtitle && <p className="text-sm opacity-70">{campaign.subtitle}</p>}
            {campaign.systemName && <p className="text-xs opacity-50">{campaign.systemName}</p>}
            {campaign.tags.length > 0 && (
              <div className="card-actions mt-2">
                {campaign.tags.map((tag) => (
                  <span key={tag} className="badge badge-outline badge-sm">{tag}</span>
                ))}
              </div>
            )}
          </ContentCard>
        ))}
      </div>

      <Pagination
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        totalCount={data.totalCount}
        pageSize={15}
      />
    </div>
  );
};

export default CampaignList;
