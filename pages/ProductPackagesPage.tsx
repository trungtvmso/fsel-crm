
import React, { useState, useEffect, useContext } from 'react';
import { ProductPackageItem, ProductPackageApiResponse, AppMessage, MessageType } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { AppMessageKey, createAppMessage } from '../src/lib/messages';
import { API_BASE_URL_ORDERING } from '../constants'; // Import the new constant

interface ProductPackagesPageProps {
  setGlobalMessage: (message: AppMessage | null) => void;
}

const ProductPackagesPage: React.FC<ProductPackagesPageProps> = ({ setGlobalMessage }) => {
  const [productPackages, setProductPackages] = useState<ProductPackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { translate } = useContext(LanguageContext)!;

  useEffect(() => {
    const fetchProductPackages = async () => {
      setIsLoading(true);
      setError(null);
      setGlobalMessage(null);

      try {
        const response = await fetch(`${API_BASE_URL_ORDERING}/v1.2/package`);
        if (!response.ok) {
          // Try to parse error from API response if possible
          let apiErrorMsg = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData && errorData.errorMessages && errorData.errorMessages.length > 0) {
              apiErrorMsg = errorData.errorMessages.join(', ');
            } else if (errorData && errorData.message) {
              apiErrorMsg = errorData.message;
            }
          } catch (e) {
            // Ignore if parsing error response fails, stick with status code
          }
          throw new Error(apiErrorMsg);
        }
        
        const data: ProductPackageApiResponse = await response.json();

        if (data && data.isOK && Array.isArray(data.result)) {
          setProductPackages(data.result);
        } else {
          const errorMessage = data.errorMessages && data.errorMessages.length > 0 
            ? data.errorMessages.join(', ') 
            : translate('productPackagesPage.error');
          throw new Error(errorMessage);
        }
      } catch (e: any) {
        const errorMessage = e.message || translate('productPackagesPage.error');
        setError(errorMessage);
        setGlobalMessage(createAppMessage({ 
          key: AppMessageKey.ADMIN_INIT_ERROR, // Using a generic error key for now
          translate, 
          replacements: { message: errorMessage },
          typeOverride: MessageType.ERROR 
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductPackages();
  }, [translate, setGlobalMessage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text={translate('productPackagesPage.loading')} /></div>;
  }

  if (error && productPackages.length === 0) { // Only show full page error if no data is loaded
    return <div className="text-center text-red-400 p-4">{error}</div>;
  }

  if (productPackages.length === 0) {
    return <div className="text-center text-slate-400 p-4">{translate('productPackagesPage.noPackages')}</div>;
  }

  const getSuggestionTagClass = (suggestTag: string) => {
    switch (suggestTag.toLowerCase()) {
      case 'bestseller':
        return 'bg-red-600 text-red-100';
      case 'recommend':
        return 'bg-green-600 text-green-100';
      default:
        return 'bg-slate-600 text-slate-200';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-slate-100 mb-6 text-center">{translate('productPackagesPage.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productPackages.map((pkg) => (
          <div key={pkg.id} className="bg-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col transform hover:scale-105 transition-transform duration-200">
            {pkg.imagePaths && pkg.imagePaths.length > 0 && (
              <img 
                src={pkg.imagePaths[0]} 
                alt={pkg.name} 
                className="w-full h-48 object-cover" 
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x200?text=No+Image')}
              />
            )}
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-xl font-semibold text-sky-400 mb-2 truncate" title={pkg.name}>{pkg.name}</h3>
              
              <div className="mb-3">
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(pkg.price)}</p>
                <p className="text-sm text-slate-400">
                  {translate('productPackagesPage.duration', { monthNumber: String(pkg.monthNumber) })}
                  {pkg.priceMonth > 0 && ` (${formatCurrency(pkg.priceMonth)}/${translate('productPackagesPage.priceMonth').toLowerCase().split('/')[1] || 'Tháng'})`}
                </p>
              </div>

              {pkg.eventDescription && (
                <p className="text-xs text-amber-400 mb-2 bg-amber-800 bg-opacity-30 p-2 rounded">
                  <strong>{translate('productPackagesPage.eventDescription')}:</strong> {pkg.eventDescription}
                </p>
              )}
              
              <p className="text-sm text-slate-300 mb-1">
                <strong>{translate('productPackagesPage.incentives')}:</strong> {pkg.incentivesWhenPurchasing || translate('common.na')}
              </p>
              {pkg.description && <p className="text-sm text-slate-400 mb-3 flex-grow">{pkg.description}</p>}
              
              <div className="mt-auto pt-3">
                {pkg.suggests && pkg.suggests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pkg.suggests.map(tag => (
                      <span 
                        key={tag} 
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getSuggestionTagClass(tag)}`}
                      >
                        {translate(`productPackagesPage.suggests.${tag}`) || tag}
                      </span>
                    ))}
                  </div>
                )}
                 <p className="text-xs text-slate-500">Code: {pkg.code} | Refer: {pkg.referToken}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPackagesPage;