import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
  const price = product.effectivePrice ?? product.price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    setAdding(true);
    try {
      await addItem(product.id, product.minOrderQty);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-gray-700">품절</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.manufacturer && (
          <p className="mb-1 text-xs text-gray-400">{product.manufacturer}</p>
        )}
        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-gray-900">{product.name}</h3>
        {product.specifications && (
          <p className="mb-2 text-xs text-gray-500 line-clamp-1">{product.specifications}</p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-gray-900">{formatPrice(price)}</p>
            {product.unit && <p className="text-xs text-gray-400">/ {product.unit}</p>}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stockQuantity === 0}
            className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
            title="장바구니에 담기"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
