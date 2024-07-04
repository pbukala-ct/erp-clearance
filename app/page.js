'use client'
import { apiRoot } from '../utils/commercetools-client'

import { useState, useEffect } from 'react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [newPrices, setNewPrices] = useState({});
  const [skuMap, setSkuMap] = useState({});

  useEffect(() => {
    console.log("Fetching Products")
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await apiRoot.products().get({
        queryArgs: {
          expand: ['productType', 'masterData.current.categories[*]'],
        }
      }).execute();
      setProducts(response.body.results);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  async function updatePrices() {
  for (const [variantId, newPrice] of Object.entries(newPrices)) {
    if (newPrice) {
      try {
        // Find the product and variant
        const product = products.find(p => 
          p.masterData.current.masterVariant.id === variantId || 
          p.masterData.current.variants.some(v => v.id === variantId)
        );
        
        if (!product) {
          console.error(`Product not found for variant ID: ${variantId}`);
          continue;
        }

        const variant = variantId === product.masterData.current.masterVariant.id
          ? product.masterData.current.masterVariant
          : product.masterData.current.variants.find(v => v.id === variantId);

        if (!variant || !variant.prices || variant.prices.length === 0) {
          console.error(`Variant or prices not found for variant ID: ${variantId}`);
          continue;
        }

        const priceId = variant.prices[0].id;
        const currentPrice = variant.prices[0].value;

        const actions = [
          {
            action: 'changePrice',
            priceId: priceId,
            price: {
              currencyCode: 'AUD',
              centAmount: Math.round(parseFloat(newPrice) * 100),
            },
          },
          {
            action: 'setProductPriceCustomType',
            priceId: priceId,
            fields: {
              wasPrice: {
                currencyCode: 'AUD',
                centAmount: currentPrice.centAmount,
              },
              date: new Date().toISOString(),
            },
            type: {
              key: 'price-sale',
              typeId: 'type',
            },
          },
          {
            action: 'addToCategory',
            category: {
              typeId: 'category',
              id: '3fd21e57-94f1-40a1-890f-75aca972d52c',
            },
          },
        ];

        await apiRoot.products().withId({ ID: product.id }).post({
          body: {
            version: product.version,
            actions,
          },
        }).execute();

        console.log(`Successfully updated price for variant ID: ${variantId}`);
      } catch (error) {
        console.error('Error updating product:', error);
      }
    }
  }
  fetchProducts();
  setNewPrices({});
}

  function handleProductClick(productId) {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  }

  function handlePriceChange(variantId, price, sku) {
    setNewPrices(prev => ({
      ...prev,
      [variantId]: { price, sku }
    }));
  }

  const formatPrice = (prices) => {
    if (!prices || prices.length === 0) return 'N/A';
    const price = prices.find(p => p.value.currencyCode === 'AUD');
    return price ? `$${(price.value.centAmount / 100).toFixed(2)} AUD` : 'N/A';
  };

  async function updatePrices() {
    const productVersions = new Map(); 
    for (const [variantId, { price: newPrice, sku }] of Object.entries(newPrices)) {
      if (newPrice) {
        try {
          // console.log("SKU: " + sku)
          // console.log("variantId: " + variantId)
          // console.log("newPrice: " + newPrice)
          // Find the product and variant
    
    let product = products.find(p => 
      p.masterData.current.masterVariant.sku === sku || 
      p.masterData.current.variants.some(v => v.sku === sku)
    );

    if (!product) {
      console.error(`Product not found for SKU: ${sku}`);
      continue;
    }

     // Check if we have an updated version of this product
     if (productVersions.has(product.id)) {
      const updatedProduct = await apiRoot.products().withId({ ID: product.id }).get().execute();
      product = updatedProduct.body;
    }

    const variant = product.masterData.current.masterVariant.sku === sku
      ? product.masterData.current.masterVariant
      : product.masterData.current.variants.find(v => v.sku === sku);

    if (!variant) {
      console.error(`Variant not found for SKU: ${sku}`);
      continue;
    }

    if (!variant.prices || variant.prices.length === 0) {
      console.error(`Prices not found for SKU: ${sku}`);
      continue;
    }
    const currentDate = new Date();

    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  
          const priceId = variant.prices[0].id;
          const currentPrice = variant.prices[0].value;
  
          const actions = [
            {
              action: 'changePrice',
              priceId: priceId,
              staged: false,
              price: {
                value:{
                  currencyCode: 'AUD',
                  centAmount: Math.round(parseFloat(newPrice) * 100),
                }
              },
            },
            {
              action: 'setProductPriceCustomType',
              priceId: priceId,
              fields: {
                wasPrice: {
                  currencyCode: 'AUD',
                  centAmount: currentPrice.centAmount,
                },
                date: formattedDate,
              },
              type: {
                key: 'price-sale',
                typeId: 'type',
              },
            },];

            // Check if the product is already in the specified category
        const targetCategoryId = '3fd21e57-94f1-40a1-890f-75aca972d52c';
        const isInCurrentCategory = product.masterData.current.categories.some(cat => cat.id === targetCategoryId);
        const isInStagedCategory = product.masterData.staged.categories.some(cat => cat.id === targetCategoryId);

        if (!isInCurrentCategory && !isInStagedCategory) {
          console.log("Product is not in the category")
          actions.push({
            action: 'addToCategory',
            category: {
              typeId: 'category',
              id: targetCategoryId,
            },
          });
        }
  
        const updatedProduct =  await apiRoot.products().withId({ ID: product.id }).post({
            body: {
              version: product.version,
              actions,
            },
          }).execute();

          // Update the product version in our map
        productVersions.set(product.id, updatedProduct.body.version);
  
          console.log(`Successfully updated price for variant ID: ${variantId}`);
        } catch (error) {
          console.error('Error updating product:', error);
        }
      }
    }
    fetchProducts();
    setNewPrices({});
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50 relative">
    <main className="max-w-4xl mx-auto">
        <header className="text-center mb-8 bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">ERP Clearance Manager</h1>
          <p className="text-xl text-gray-600">Streamline Your Inventory Clearance Process</p>
          <p className="mt-4 text-gray-500">Provide clearance prices for your catalogue below</p>
        </header>

    
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <img
                  src={product.masterData.current.masterVariant.images?.[0]?.url || '/placeholder.png'}
                  alt={product.masterData.current.name.en}
                  className="w-24 h-24 object-cover rounded-md"
                />
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-blue-700">{product.masterData.current.name.en}</h2>
                  <p className="text-sm text-gray-600">Key: {product.key}</p>
                  <p className="mt-2 font-medium">
                    Current Price: {formatPrice(product.masterData.current.masterVariant.prices)}
                  </p>
                </div>
              </div>
              {expandedProduct === product.id && (
                <div className="mt-4 space-y-4">
                  {product.masterData.current.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center border-t pt-4">
                      <img 
                        src={variant.images?.[0]?.url || '/placeholder.png'} 
                        alt={variant.sku}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="ml-4 flex-grow">
                        <p className="text-sm font-medium">SKU: {variant.sku}</p>
                        <p className="mt-1">
                          Current Price: {formatPrice(variant.prices)}
                        </p>
                        <div className="mt-2 flex items-center">
                          <label htmlFor={`price-${variant.id}`} className="mr-2 text-sm font-medium text-gray-700">
                            Clearance Price:
                          </label>
                          <div className="relative">
                          <input
                            id={`price-${variant.id}`}
                            type="number"
                            step="0.01"
                            placeholder="New price"
                            value={newPrices[variant.id]?.price || ''}
                            onChange={(e) => handlePriceChange(variant.id, e.target.value, variant.sku)}
                            className="w-40 border-2 border-blue-300 rounded px-3 py-1 focus:outline-none focus:border-blue-500 text-right pr-12"
                          />
                            <span className="absolute right-3 top-1 text-gray-500">AUD</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={updatePrices} 
          className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-semibold w-full"
        >
          Update Clearance Prices
        </button>
      </main>

{/* Floating component for displaying inputted prices */}
<div className="fixed top-4 right-4 w-80 bg-white p-6 rounded-lg shadow-lg max-h-[calc(100vh-2rem)] overflow-y-auto border-2 border-blue-500">
  <h3 className="text-xl font-bold mb-4 text-blue-700 border-b-2 border-blue-200 pb-2">Pending Updates</h3>
  {Object.entries(newPrices).length > 0 ? (
    <ul className="space-y-3">
      {Object.entries(newPrices).map(([variantId, { price, sku }]) => (
        <li key={variantId} className="bg-blue-50 p-3 rounded-md shadow-sm">
          <div className="text-sm font-semibold text-blue-800">{sku}</div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-green-600 font-medium">New Price:</span>
            <span className="text-green-700 font-bold">${parseFloat(price).toFixed(2)} AUD</span>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500 italic">No updates pending</p>
  )}
  <div className="mt-4 text-sm text-gray-600 bg-yellow-100 p-2 rounded">
    <p className="font-semibold">Total updates: {Object.entries(newPrices).length}</p>
  </div>
</div>

    </div>
  );
}