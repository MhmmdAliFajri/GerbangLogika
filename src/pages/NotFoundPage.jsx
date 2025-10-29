import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan</p>
        <Button 
          className="bg-[#123069] text-white hover:bg-[#1B296D]"
          onClick={() => navigate('/')}
        >
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;