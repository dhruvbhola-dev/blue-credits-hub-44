import { useState, useEffect } from 'react';
import { getWalletAddress, getSellerData, getBuyerCredits, getVerifierAddress } from '@/contracts/contract';

export const useBlockchainData = (userRole?: string) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [sellerData, setSellerData] = useState<any>(null);
  const [buyerCredits, setBuyerCredits] = useState(0);
  const [verifierAddress, setVerifierAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const address = await getWalletAddress();
      setWalletAddress(address);

      const verifier = await getVerifierAddress();
      setVerifierAddress(verifier);

      if (userRole === 'ngo' || userRole === 'localpeople') {
        const seller = await getSellerData(address);
        setSellerData({
          hasSubmitted: seller[0],
          credits: Number(seller[1]),
          forSale: Number(seller[2])
        });
      }

      if (userRole === 'company') {
        const credits = await getBuyerCredits(address);
        setBuyerCredits(Number(credits));
      }
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  return {
    walletAddress,
    sellerData,
    buyerCredits,
    verifierAddress,
    loading,
    refresh: fetchData
  };
};