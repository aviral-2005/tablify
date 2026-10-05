import { Link, useParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';

// This page is not actually used — tracking is done directly
// Keeping as a fallback redirect
export default function OrderConfirmationPage() {
  const { slug, tableNumber } = useParams();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 max-w-lg mx-auto">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-6">Your order has been sent to the kitchen</p>
        <Link
          to={`/order/${slug}/${tableNumber}`}
          className="btn-primary btn btn-lg"
        >
          <ArrowLeft size={16} />
          Back to Menu
        </Link>
      </div>
    </div>
  );
}
