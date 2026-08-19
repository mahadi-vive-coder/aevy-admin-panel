import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Product, BottleShape, ProductGender, ProductImage, ProductSeason } from '../../types';
import { uploadProductImageToSupabase } from '../../lib/supabase';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  Upload,
  AlertTriangle,
  Check,
  X,
  Sparkles,
  ArrowUpDown,
  Tag,
  DollarSign,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  Snowflake,
  Wind,
  Layers,
  ArrowLeft,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const AVAILABLE_SEASONS: ProductSeason[] = [
  'Spring',
  'Summer',
  'Monsoon',
  'Autumn',
  'Winter',
  'All Season',
];

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, toggleProductActive, updateStock, isSaving } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShape, setSelectedShape] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'low_stock'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewActiveImageIdx, setPreviewActiveImageIdx] = useState<number>(0);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState<number>(3000);
  const [formSize, setFormSize] = useState<string>('30ml');
  const [formBottleShape, setFormBottleShape] = useState<BottleShape>('Round');
  const [formCategory, setFormCategory] = useState('Extrait de Parfum');
  const [formGender, setFormGender] = useState<ProductGender>('Unisex');
  const [formTopNotes, setFormTopNotes] = useState('');
  const [formHeartNotes, setFormHeartNotes] = useState('');
  const [formBaseNotes, setFormBaseNotes] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formStock, setFormStock] = useState<number>(20);
  const [formLowStockThreshold, setFormLowStockThreshold] = useState<number>(5);
  const [formFeatured, setFormFeatured] = useState<boolean>(false);
  const [formActive, setFormActive] = useState<boolean>(true);
  
  // Multi-Image State
  const [formImages, setFormImages] = useState<Array<{ id?: string; image_url: string; sort_order: number; is_primary: boolean }>>([]);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  // Seasons Multi-Select State
  const [formSeasons, setFormSeasons] = useState<ProductSeason[]>([]);

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormShortDesc('');
    setFormDesc('');
    setFormPrice(3000);
    setFormSize('30ml');
    setFormBottleShape('Round');
    setFormCategory('Extrait de Parfum');
    setFormGender('Unisex');
    setFormTopNotes('');
    setFormHeartNotes('');
    setFormBaseNotes('');
    setFormSku(`AEVY-NEW-${Date.now().toString().slice(-4)}`);
    setFormStock(20);
    setFormLowStockThreshold(5);
    setFormFeatured(false);
    setFormActive(true);
    setFormImages([]);
    setNewImageUrlInput('');
    setFormSeasons(['All Season']);
    setUploadErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormShortDesc(product.short_description || '');
    setFormDesc(product.description || '');
    setFormPrice(product.price);
    setFormSize(product.size || '30ml');
    setFormBottleShape(product.bottle_shape || 'Round');
    setFormCategory(product.category || 'Extrait de Parfum');
    setFormGender(product.gender || 'Unisex');
    setFormTopNotes(product.top_notes || '');
    setFormHeartNotes(product.heart_notes || '');
    setFormBaseNotes(product.base_notes || '');
    setFormSku(product.sku);
    setFormStock(product.stock);
    setFormLowStockThreshold(product.low_stock_threshold || 5);
    setFormFeatured(Boolean(product.featured));
    setFormActive(Boolean(product.active));
    
    // Populate existing images from product_images or fallback to image_url
    if (product.images && product.images.length > 0) {
      setFormImages(
        product.images.map((img, idx) => ({
          id: img.id,
          image_url: img.image_url,
          sort_order: img.sort_order ?? idx,
          is_primary: Boolean(img.is_primary),
        }))
      );
    } else if (product.image_url) {
      setFormImages([
        {
          image_url: product.image_url,
          sort_order: 0,
          is_primary: true,
        },
      ]);
    } else {
      setFormImages([]);
    }

    setNewImageUrlInput('');
    setFormSeasons(product.seasons || []);
    setUploadErrorMsg(null);
    setIsModalOpen(true);
  };

  // Auto-generate slug and SKU when name changes
  const handleNameChange = (newName: string) => {
    setFormName(newName);
    if (!editingProduct) {
      const generatedSlug = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(generatedSlug);
      
      const cleanInitials = newName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'FRG';
      const shapeCode = formBottleShape === 'Round' ? 'RND' : 'SQR';
      setFormSku(`AEVY-${cleanInitials}-30-${shapeCode}`);
    }
  };

  // Handle Multi-file Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadErrorMsg(null);
    setIsUploadingImage(true);
    try {
      const uploadedImages: Array<{ image_url: string; sort_order: number; is_primary: boolean }> = [];
      const baseOrder = formImages.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadedUrl = await uploadProductImageToSupabase(file);
        uploadedImages.push({
          image_url: uploadedUrl,
          sort_order: baseOrder + i,
          is_primary: formImages.length === 0 && i === 0,
        });
      }

      setFormImages((prev) => {
        const updated = [...prev, ...uploadedImages];
        // Ensure at least one image is primary
        if (!updated.some((img) => img.is_primary) && updated.length > 0) {
          updated[0].is_primary = true;
        }
        return updated;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Storage upload failed';
      console.error('Image upload failed:', err);
      setUploadErrorMsg(msg);
    } finally {
      setIsUploadingImage(false);
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  // Add image by direct URL
  const handleAddDirectImageUrl = () => {
    const url = newImageUrlInput.trim();
    if (!url) return;

    setFormImages((prev) => {
      const isFirst = prev.length === 0;
      const updated = [
        ...prev,
        {
          image_url: url,
          sort_order: prev.length,
          is_primary: isFirst,
        },
      ];
      return updated;
    });
    setNewImageUrlInput('');
  };

  // Set primary image
  const handleSetPrimaryImage = (index: number) => {
    setFormImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    );
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Re-assign sort orders
      const reordered = next.map((img, i) => ({ ...img, sort_order: i }));
      // If primary was removed, make the first image primary
      if (reordered.length > 0 && !reordered.some((img) => img.is_primary)) {
        reordered[0].is_primary = true;
      }
      return reordered;
    });
  };

  // Move image position
  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    setFormImages((prev) => {
      const targetIdx = direction === 'left' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;

      return next.map((img, i) => ({ ...img, sort_order: i }));
    });
  };

  // Toggle Season Selection
  const handleToggleSeason = (season: ProductSeason) => {
    setFormSeasons((prev) => {
      if (season === 'All Season') {
        // If clicking All Season, toggle it
        if (prev.includes('All Season')) {
          return [];
        }
        return ['All Season'];
      }

      // If specific season clicked, remove 'All Season' and toggle the clicked season
      const withoutAll = prev.filter((s) => s !== 'All Season');
      if (withoutAll.includes(season)) {
        return withoutAll.filter((s) => s !== season);
      } else {
        return [...withoutAll, season];
      }
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;

    // Determine primary image URL
    const primaryImage = formImages.find((img) => img.is_primary) || formImages[0];
    const primaryUrl = primaryImage ? primaryImage.image_url : '';

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, '-'),
      short_description: formShortDesc.trim(),
      description: formDesc.trim(),
      price: Number(formPrice),
      size: formSize,
      bottle_shape: formBottleShape,
      category: formCategory,
      gender: formGender,
      top_notes: formTopNotes.trim(),
      heart_notes: formHeartNotes.trim(),
      base_notes: formBaseNotes.trim(),
      sku: formSku.trim(),
      stock: Number(formStock),
      low_stock_threshold: Number(formLowStockThreshold),
      featured: formFeatured,
      active: formActive,
      image_url: primaryUrl,
      images: formImages.map((img, i) => ({
        id: img.id,
        image_url: img.image_url,
        sort_order: i,
        is_primary: img.is_primary,
      })),
      seasons: formSeasons,
    };

    let success = false;
    if (editingProduct) {
      success = await updateProduct(editingProduct.id, payload);
    } else {
      success = await addProduct(payload);
    }

    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProduct(productToDelete.id);
    setProductToDelete(null);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.top_notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.heart_notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.base_notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesShape = selectedShape === 'all' || p.bottle_shape === selectedShape;
    const matchesGender = selectedGender === 'all' || p.gender === selectedGender;
    
    let matchesSeason = true;
    if (selectedSeason !== 'all') {
      matchesSeason = Boolean(p.seasons && (p.seasons.includes(selectedSeason as ProductSeason) || p.seasons.includes('All Season')));
    }

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = p.active;
    if (statusFilter === 'inactive') matchesStatus = !p.active;
    if (statusFilter === 'low_stock') matchesStatus = p.active && p.stock <= (p.low_stock_threshold || 5);

    return matchesSearch && matchesShape && matchesGender && matchesSeason && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121216] border border-[#22222A] p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="font-serif-brand text-2xl font-bold text-[#FAF9F5] tracking-wide">
              Fragrance Catalog & Inventory
            </h1>
          </div>
          <p className="text-xs text-[#8E8E9A] mt-1 pl-11">
            Manage AEVY 30ml extraits, multi-image galleries, seasonal curation, olfactory notes, and live stock.
          </p>
        </div>

        <button
          id="add-product-btn"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:brightness-110 text-[#0B0B0C] font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fragrance</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#121216] border border-[#22222A] rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70707D]" />
            <input
              type="text"
              placeholder="Search fragrance, SKU, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] placeholder-[#5A5A66] outline-none"
            />
          </div>

          {/* Bottle Shape Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedShape}
              onChange={(e) => setSelectedShape(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none cursor-pointer"
            >
              <option value="all">All Bottle Shapes</option>
              <option value="Round">Round Flacon</option>
              <option value="Square">Square Flacon</option>
            </select>
          </div>

          {/* Season Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none cursor-pointer"
            >
              <option value="all">All Seasons</option>
              {AVAILABLE_SEASONS.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none cursor-pointer"
            >
              <option value="all">All ({products.length})</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Hidden</option>
              <option value="low_stock">Low Stock Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Table / Cards */}
      <div className="bg-[#121216] border border-[#22222A] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#202028] bg-[#16161D] text-[#8E8E9A] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 sm:px-6">Fragrance</th>
                <th className="py-3.5 px-4">Flacon & Season</th>
                <th className="py-3.5 px-4">Price (BDT)</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Notes Profile</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D26] text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#707080]">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium text-[#8E8E98]">
                      {products.length === 0 ? 'No fragrances in catalog yet.' : 'No fragrances match the specified filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow = product.stock <= (product.low_stock_threshold || 5);
                  const displayImage = product.image_url || (product.images && product.images[0]?.image_url);
                  const imageCount = product.images?.length || (product.image_url ? 1 : 0);

                  return (
                    <tr key={product.id} className="hover:bg-[#16161E]/70 transition-colors">
                      {/* Product Name & Visual */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setPreviewProduct(product);
                              setPreviewActiveImageIdx(0);
                            }}
                            className="relative group shrink-0 cursor-pointer"
                            title="Click to preview fragrance gallery & details"
                          >
                            {displayImage ? (
                              <img
                                src={displayImage}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover bg-[#0E0E12] border border-[#282834] group-hover:border-[#D4AF37] transition-colors"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[#16161E] border border-[#282834] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37] transition-colors">
                                <Package className="w-5 h-5 opacity-70" />
                              </div>
                            )}
                            {imageCount > 1 && (
                              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#0E0E12] text-[#D4AF37] text-[9px] font-mono font-bold rounded-md border border-[#2E2E3C] shadow">
                                {imageCount}
                              </span>
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setPreviewProduct(product);
                                  setPreviewActiveImageIdx(0);
                                }}
                                className="font-serif-brand font-bold text-sm text-[#FAF9F5] hover:text-[#D4AF37] text-left transition-colors cursor-pointer"
                              >
                                {product.name}
                              </button>
                              {product.featured && (
                                <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" title="Featured Fragrance" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#7A7A8A] font-mono mt-0.5">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Size, Bottle Shape & Seasons */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#FAF9F5] flex items-center gap-1.5">
                          <span>{product.size}</span>
                          <span className="text-[#606070]">•</span>
                          <span className="text-[#C5A059]">{product.bottle_shape}</span>
                        </div>

                        {/* Seasons Badges */}
                        {product.seasons && product.seasons.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {product.seasons.map((season) => (
                              <span
                                key={season}
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#1C1C28] border border-[#2D2D3E] text-[#A0A0B0]"
                              >
                                {season}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#606070] italic mt-0.5">All Seasons</div>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-sm text-[#FAF9F5]">
                        ৳{Number(product.price).toLocaleString()}
                      </td>

                      {/* Stock with quick modifier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStock(product.id, product.stock - 1)}
                            className="w-6 h-6 rounded bg-[#1A1A24] hover:bg-[#252533] text-[#FAF9F5] flex items-center justify-center font-bold text-xs border border-[#2B2B38] cursor-pointer"
                            title="Decrease stock"
                          >
                            -
                          </button>
                          
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-bold ${
                              isLow
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : 'bg-[#181822] text-[#FAF9F5] border border-[#2A2A36]'
                            }`}
                          >
                            {product.stock} units
                          </span>

                          <button
                            onClick={() => updateStock(product.id, product.stock + 1)}
                            className="w-6 h-6 rounded bg-[#1A1A24] hover:bg-[#252533] text-[#FAF9F5] flex items-center justify-center font-bold text-xs border border-[#2B2B38] cursor-pointer"
                            title="Increase stock"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Fragrance Notes */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="text-[11px] text-[#A0A0AB] truncate" title={`Top: ${product.top_notes} | Heart: ${product.heart_notes} | Base: ${product.base_notes}`}>
                          <span className="text-[#D4AF37] font-semibold">T:</span> {product.top_notes || '—'}
                        </div>
                        <div className="text-[11px] text-[#7A7A8A] truncate">
                          <span className="text-[#A0A0B0] font-semibold">B:</span> {product.base_notes || '—'}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleProductActive(product.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            product.active
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                              : 'bg-[#1F1F28] text-[#7A7A8A] border border-[#30303E]'
                          }`}
                        >
                          {product.active ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-[#7A7A8A]" />}
                          <span>{product.active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPreviewProduct(product);
                              setPreviewActiveImageIdx(0);
                            }}
                            className="p-2 bg-[#1A1A22] hover:bg-[#252530] text-[#A0A0B0] hover:text-[#FAF9F5] rounded-lg border border-[#2B2B38] transition-colors cursor-pointer"
                            title="Preview gallery & details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 bg-[#1A1A22] hover:bg-[#252530] text-[#D4AF37] rounded-lg border border-[#2B2B38] transition-colors cursor-pointer"
                            title="Edit details, notes & image"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-2 bg-[#1A1A22] hover:bg-red-950/60 text-[#8E8E98] hover:text-red-400 rounded-lg border border-[#2B2B38] hover:border-red-900/60 transition-colors cursor-pointer"
                            title="Delete fragrance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#121216] border border-[#262634] rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#20202A]">
              <div>
                <h2 className="font-serif-brand text-lg font-bold text-[#FAF9F5]">
                  {editingProduct ? 'Edit Fragrance Formulation' : 'Create New Fragrance'}
                </h2>
                <p className="text-xs text-[#8E8E98] mt-0.5">
                  Configure AEVY 30ml extrait specs, multi-image gallery, seasonal pairing, and stock.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#70707D] hover:text-[#FAF9F5] rounded-lg bg-[#181822] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
              
              {/* Fragrance Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                    Fragrance Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. AEVY Noir Intense"
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. aevy-noir-intense"
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                  />
                </div>
              </div>

              {/* Price, SKU, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                    Price (BDT ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={50}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                    SKU Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="AEVY-XYZ-30-RND"
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                    Initial Stock Units *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-bold"
                  />
                </div>
              </div>

              {/* Size & Bottle Shape Requirements */}
              <div className="p-4 bg-[#16161E] border border-[#262634] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AEVY Specification Requirements</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1.5">
                      Flacon Size
                    </label>
                    <input
                      type="text"
                      disabled
                      value="30ml"
                      className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] text-[#8E8E98] rounded-xl cursor-not-allowed font-medium"
                    />
                    <span className="text-[10px] text-[#7A7A8A]">Standard AEVY 30ml size</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1.5">
                      Bottle Shape *
                    </label>
                    <select
                      value={formBottleShape}
                      onChange={(e) => setFormBottleShape(e.target.value as BottleShape)}
                      className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] text-[#FAF9F5] rounded-xl outline-none cursor-pointer"
                    >
                      <option value="Round">Round (Curved Flacon)</option>
                      <option value="Square">Square (Geometric Flacon)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1.5">
                      Gender Persona
                    </label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as ProductGender)}
                      className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] text-[#FAF9F5] rounded-xl outline-none cursor-pointer"
                    >
                      <option value="Unisex">Unisex</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Seasons (Multi-Select) */}
              <div className="p-4 bg-[#16161E] border border-[#262634] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider text-[11px]">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Seasonal Curation (Multi-Select)</span>
                  </div>
                  <span className="text-[10px] text-[#8E8E9A]">Select all applicable seasons for this perfume</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_SEASONS.map((season) => {
                    const isSelected = formSeasons.includes(season);
                    return (
                      <button
                        key={season}
                        type="button"
                        onClick={() => handleToggleSeason(season)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#D4AF37] text-[#0B0B0C] shadow-md shadow-[#D4AF37]/20 border border-[#D4AF37]'
                            : 'bg-[#0E0E12] text-[#A0A0B0] hover:text-[#FAF9F5] border border-[#2A2A38] hover:border-[#404055]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{season}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Image Gallery & Supabase Storage */}
              <div className="p-4 bg-[#16161E] border border-[#262634] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider text-[11px]">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Fragrance Imagery & Gallery ({formImages.length} images)</span>
                  </div>
                  <span className="text-[10px] text-[#8E8E9A]">Multi-upload supported • Click star to set Primary cover</span>
                </div>

                {/* Upload & Direct URL Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1C1C28] hover:bg-[#262638] border border-[#343448] hover:border-[#D4AF37] rounded-xl text-[#FAF9F5] cursor-pointer text-xs font-semibold transition-all shrink-0">
                    <Upload className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isUploadingImage ? 'Uploading to Supabase...' : 'Upload Images'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="url"
                      value={newImageUrlInput}
                      onChange={(e) => setNewImageUrlInput(e.target.value)}
                      placeholder="Or paste direct image URL (https://...)"
                      className="flex-1 px-3 py-2 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddDirectImageUrl}
                      disabled={!newImageUrlInput.trim()}
                      className="px-3.5 py-2 bg-[#20202E] hover:bg-[#2A2A3E] text-[#FAF9F5] rounded-xl text-xs font-semibold border border-[#303044] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {uploadErrorMsg && (
                  <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{uploadErrorMsg}</span>
                  </div>
                )}

                {/* Image List / Thumbnails Grid */}
                {formImages.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#282838] rounded-xl text-center text-[#707080]">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No images added yet. Upload files or enter image URLs above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                    {formImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`group relative rounded-xl overflow-hidden border bg-[#0E0E12] flex flex-col ${
                          img.is_primary ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50' : 'border-[#262634]'
                        }`}
                      >
                        <div className="relative aspect-square bg-[#14141C] overflow-hidden">
                          <img
                            src={img.image_url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />

                          {/* Primary Badge */}
                          {img.is_primary && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#D4AF37] text-[#0B0B0C] text-[9px] font-bold uppercase tracking-wider rounded">
                              Cover
                            </span>
                          )}

                          {/* Action Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                                img.is_primary ? 'bg-[#D4AF37] text-black' : 'bg-black/70 hover:bg-[#D4AF37] text-white hover:text-black'
                              }`}
                              title={img.is_primary ? 'Primary Cover Image' : 'Set as Primary Cover'}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1.5 rounded-lg bg-red-900/80 hover:bg-red-600 text-white text-xs cursor-pointer"
                              title="Remove Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Reorder footer */}
                        <div className="flex items-center justify-between px-2 py-1 bg-[#14141D] border-t border-[#20202C] text-[10px] text-[#707080]">
                          <span className="font-mono">#{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, 'left')}
                              className="p-0.5 hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === formImages.length - 1}
                              onClick={() => handleMoveImage(idx, 'right')}
                              className="p-0.5 hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fragrance Pyramid Notes */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">
                  Olfactory Pyramid (Fragrance Notes)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#D4AF37] mb-1 block">Top Notes</span>
                    <input
                      type="text"
                      value={formTopNotes}
                      onChange={(e) => setFormTopNotes(e.target.value)}
                      placeholder="e.g. Calabrian Bergamot, Sea Salt"
                      className="w-full px-3 py-2 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#D4AF37] mb-1 block">Heart Notes</span>
                    <input
                      type="text"
                      value={formHeartNotes}
                      onChange={(e) => setFormHeartNotes(e.target.value)}
                      placeholder="e.g. Tuscan Leather, Smoked Oud"
                      className="w-full px-3 py-2 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#D4AF37] mb-1 block">Base Notes</span>
                    <input
                      type="text"
                      value={formBaseNotes}
                      onChange={(e) => setFormBaseNotes(e.target.value)}
                      placeholder="e.g. Baltic Amber, Bourbon Vanilla"
                      className="w-full px-3 py-2 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                    Short Tagline Description
                  </label>
                  <input
                    type="text"
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    placeholder="Brief 1-sentence luxury teaser..."
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                    Full Olfactory Story & Atelier Description
                  </label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Detailed composition story, craftsmanship details..."
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Toggles: Featured & Active */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0E0E12] border-[#30303E] text-[#D4AF37] focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-[#FAF9F5]">Feature on Store Showcase</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0E0E12] border-[#30303E] text-[#D4AF37] focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-[#FAF9F5]">Active & Visible to Customers</span>
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-[#20202A] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-[#181822] hover:bg-[#20202C] text-[#FAF9F5] border border-[#2B2B38] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:brightness-110 text-[#0B0B0C] font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingProduct ? 'Save Formulation Changes' : 'Create Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Fragrance Gallery & Luxury Quick View Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#121216] border border-[#2B2B38] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#202028]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
                  AEVY Fragrance Showcase
                </span>
                <h3 className="font-serif-brand text-lg font-bold text-[#FAF9F5] mt-0.5">
                  {previewProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-2 text-[#70707D] hover:text-[#FAF9F5] rounded-lg bg-[#181822] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gallery Section */}
            {(() => {
              const galleryImages = previewProduct.images && previewProduct.images.length > 0
                ? previewProduct.images.map((img) => img.image_url)
                : previewProduct.image_url
                ? [previewProduct.image_url]
                : [];

              const activeUrl = galleryImages[previewActiveImageIdx] || galleryImages[0];

              return (
                <div className="space-y-3">
                  {activeUrl ? (
                    <div className="relative aspect-[16/9] sm:aspect-[2/1] rounded-xl overflow-hidden bg-[#0A0A0E] border border-[#22222E]">
                      <img
                        src={activeUrl}
                        alt={previewProduct.name}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />

                      {galleryImages.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setPreviewActiveImageIdx((prev) =>
                                prev === 0 ? galleryImages.length - 1 : prev - 1
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setPreviewActiveImageIdx((prev) =>
                                prev === galleryImages.length - 1 ? 0 : prev + 1
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-40 rounded-xl bg-[#15151F] border border-[#262634] flex flex-col items-center justify-center text-[#707080]">
                      <Package className="w-8 h-8 opacity-40 mb-1 text-[#D4AF37]" />
                      <span className="text-xs">No imagery uploaded</span>
                    </div>
                  )}

                  {/* Thumbnail Row */}
                  {galleryImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {galleryImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewActiveImageIdx(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border cursor-pointer transition-all ${
                            previewActiveImageIdx === idx
                              ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50'
                              : 'border-[#262636] opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Thumb ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Specifications & Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#0E0E12] border border-[#20202C] rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-[#707080] uppercase tracking-wider block">Price</span>
                <span className="font-bold text-[#FAF9F5] text-sm">
                  ৳{Number(previewProduct.price).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#707080] uppercase tracking-wider block">Flacon</span>
                <span className="font-medium text-[#FAF9F5]">
                  {previewProduct.size} • {previewProduct.bottle_shape}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#707080] uppercase tracking-wider block">Stock Units</span>
                <span className="font-bold text-[#FAF9F5]">
                  {previewProduct.stock} available
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#707080] uppercase tracking-wider block">SKU Code</span>
                <span className="font-mono text-[#D4AF37]">
                  {previewProduct.sku}
                </span>
              </div>
            </div>

            {/* Best Season Section */}
            {previewProduct.seasons && previewProduct.seasons.length > 0 && (
              <div className="p-3 bg-[#161622] border border-[#28283C] rounded-xl flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-xs font-semibold text-[#FAF9F5] shrink-0">Best Seasons:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {previewProduct.seasons.map((season) => (
                    <span
                      key={season}
                      className="px-2 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[10px] font-medium"
                    >
                      {season}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Pyramid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 bg-[#0E0E12] border border-[#20202C] rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-1">
                  Top Notes
                </span>
                <p className="text-[#A0A0B0] text-[11px] leading-relaxed">
                  {previewProduct.top_notes || '—'}
                </p>
              </div>

              <div className="p-3 bg-[#0E0E12] border border-[#20202C] rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-1">
                  Heart Notes
                </span>
                <p className="text-[#A0A0B0] text-[11px] leading-relaxed">
                  {previewProduct.heart_notes || '—'}
                </p>
              </div>

              <div className="p-3 bg-[#0E0E12] border border-[#20202C] rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-1">
                  Base Notes
                </span>
                <p className="text-[#A0A0B0] text-[11px] leading-relaxed">
                  {previewProduct.base_notes || '—'}
                </p>
              </div>
            </div>

            {/* Descriptions */}
            {previewProduct.description && (
              <div className="p-3.5 bg-[#0E0E12] border border-[#20202C] rounded-xl text-xs text-[#A0A0B0] leading-relaxed">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#707080] block mb-1">
                  Composition & Story
                </span>
                {previewProduct.description}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const toEdit = previewProduct;
                  setPreviewProduct(null);
                  handleOpenEditModal(toEdit);
                }}
                className="px-4 py-2 bg-[#1C1C28] hover:bg-[#262638] text-[#D4AF37] border border-[#343448] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Edit Fragrance
              </button>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="px-4 py-2 bg-[#20202C] hover:bg-[#2A2A3A] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121216] border border-[#2B2B38] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-900/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                  Delete Fragrance
                </h3>
                <p className="text-xs text-[#8E8E98]">
                  Are you sure you want to remove this product?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#16161F] border border-[#242432] rounded-xl text-xs space-y-1">
              <p className="font-bold text-[#FAF9F5]">{productToDelete.name}</p>
              <p className="text-[11px] text-[#8E8E98]">
                SKU: {productToDelete.sku} • {productToDelete.bottle_shape} • {productToDelete.size}
              </p>
              <p className="text-[11px] text-red-400/90 pt-1">
                This action will delete the record and any associated image records from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-[#181822] hover:bg-[#20202C] text-[#FAF9F5] border border-[#2B2B38] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
