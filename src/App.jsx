jsx
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Upload, 
  CheckCircle, 
  XCircle, 
  ShoppingBag, 
  Clock, 
  Search, 
  Users, 
  ChevronRight, 
  Maximize2,
  Package,
  CreditCard,
  MapPin,
  Clipboard,
  Check,
  AlertCircle
} from 'lucide-react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, collection, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, appId } from './firebase';

const PRODUCTS = [
  {
    id: 'prod-001',
    title: 'iPhone 15 Pro Max (256GB - Sourced from Shop.com)',
    price: 4200000,
    description: 'Original Apple iPhone 15 Pro Max. Features Titanium design, powerful A17 Pro chip, customizable Action button, and the most powerful iPhone camera system ever.',
    image: '[https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80)',
    category: 'Electronics'
  },
  {
    id: 'prod-002',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    price: 950000,
    description: 'Industry-leading noise canceling wireless headphones with Auto NC Optimizer, crystal clear hands-free calling, and Alexa voice control.',
    image: '[https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80)',
    category: 'Audio'
  },
  {
    id: 'prod-003',
    title: 'Custom Mechanical Gaming Keyboard (RGB)',
    price: 250000,
    description: 'Hot-swappable tactile switches, dynamic RGB backlighting, durable double-shot PBT keycaps, and ergonomic compact layout.',
    image: '[https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80)',
    category: 'Accessories'
  },
  {
    id: 'prod-004',
    title: 'Nike Air Max Solo - Premium Edition',
    price: 380000,
    description: 'Stylishly designed lifestyle sneakers with advanced cushioning system, breathable upper mesh, and maximum grip outer sole.',
    image: '[https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80)',
    category: 'Fashion'
  },
  {
    id: 'prod-005',
    title: 'Dell XPS 13 Core-i7 Laptop',
    price: 3500000,
    description: 'Stunning 13.4-inch FHD InfinityEdge display, 12th Gen Intel Core i7, 16GB RAM, 512GB SSD, Windows 11 Home edition.',
    image: '[https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80)',
    category: 'Electronics'
  },
  {
    id: 'prod-006',
    title: 'Stanley Quencher H2.0 FlowState Tumbler (40oz)',
    price: 120000,
    description: 'Double-wall vacuum insulation keeps drinks ice cold for hours. Durable recycled stainless steel design with reusable straw.',
    image: '[https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80)',
    category: 'Lifestyle'
  }
];
export default function App() {
  const [activeTab, setActiveTab] = useState('shop');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const copyToClipboard = (text) => {
    const dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    showToast("Copied to clipboard!", "success");
  };
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Firebase Authentication failed:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const ordersCollection = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    
    const unsubscribe = onSnapshot(ordersCollection, 
      (snapshot) => {
        const orderList = [];
        snapshot.forEach((doc) => {
          orderList.push({ id: doc.id, ...doc.data() });
        });
        
        const sortedOrders = orderList.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(sortedOrders);

        if (selectedOrder) {
          const updatedSelected = sortedOrders.find(o => o.id === selectedOrder.id);
          if (updatedSelected) {
            setSelectedOrder(updatedSelected);
          }
        }
      },
      (error) => {
        console.error("Error fetching orders: ", error);
        showToast("Error loading order data.", "error");
      }
    );
    return () => unsubscribe();
  }, [user, selectedOrder?.id]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Added ${product.title} to Cart, 'success');
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQty = (productId, amount) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + amount;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      });
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 450;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setPaymentReceipt(compressedBase64);
        setFormError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!shippingName.trim()  !shippingPhone.trim()  !shippingAddress.trim()) {
      setFormError('Shipping details cannot be blank.');
      return;
    }
    if (!paymentReceipt) {
      setFormError('Please upload a screenshot of your transfer receipt.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderData = {
        userId: user?.uid || 'anonymous_user',
        customerName: shippingName,
        customerPhone: shippingPhone,
        shippingAddress: shippingAddress,
        items: cart.map(item => ({
          productId: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity
        })),
        totalPrice: getCartTotal(),
        receiptImage: paymentReceipt,
        status: 'Pending',
        createdAt: Date.now()
      };

      const ordersCollection = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      await addDoc(ordersCollection, orderData);

      setCart([]);
      setShippingName('');
      setShippingPhone('');
      setShippingAddress('');
      setPaymentReceipt(null);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setOrderSuccessMessage('Order has been placed successfully! Wait for Admin approval.');
      showToast('Order submitted successfully!', 'success');
    } catch (error) {
      console.error("Error submitting order: ", error);
      setFormError('Failed to submit order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      showToast(Order status updated to ${newStatus}!, 'success');
    } catch (error) {
      console.error("Error updating order status: ", error);
      showToast('Status update failed.', 'error');
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchMatch = 
      order.customerName.toLowerCase().includes(adminSearch.toLowerCase()) ||
      order.id.toLowerCase().includes(adminSearch.toLowerCase()) ||
      order.customerPhone.includes(adminSearch);

    const statusMatch = adminStatusFilter === 'All' || order.status === adminStatusFilter;

    return searchMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {toast.show && (
        <div className={fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-white transition-all duration-300 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}}>
          {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">MegaStore Myanmar</h1>
              <p className="text-xs text-slate-500">Shop.com Sourced • Secure Manual Checkout</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('shop')}
              className={px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'shop'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }}
            >
              <ShoppingBag size={16} />
              Customer Store
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }}
            >
              <Users size={16} />
              Admin Panel
              {orders.filter(o => o.status === 'Pending').length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {orders.filter(o => o.status === 'Pending').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'shop' && (
          <div>
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl text-white p-6 sm:p-10 mb-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-12 -translate-y-12">
                <ShoppingBag size={300} />
              </div>
              <div className="relative z-10 max-w-2xl">
                <span className="bg-indigo-500/50 text-indigo-100 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Myanmar Single-Brand Store
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold mt-4 leading-tight">
                  High-Quality Global Sourced Products
                </h2>
                <p className="mt-3 text-indigo-100 text-sm sm:text-base leading-relaxed">
                  Browse products sourced directly from shop.com and checkout conveniently with local Myanmar mobile wallets (KPay / Wave Pay). Upload receipt to secure swift validation!
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition"
                  >
                    <ShoppingCart size={18} />
                    View Shopping Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
                  </button>
                </div>
              </div>
            </div>

            {orderSuccessMessage && (
              <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm animate-fade-in">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <CheckCircle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900 text-lg">Order Received!</h3>
                  <p className="text-emerald-700 text-sm mt-1">{orderSuccessMessage}</p>
                  <p className="text-xs text-slate-500 mt-2">Go to Admin tab above to see your order verify immediately in real-time!</p>
                  <button 
                    onClick={() => setOrderSuccessMessage('')}
                    className="mt-3 text-xs font-bold text-emerald-800 hover:underline"
                  >
                    Dismiss notification
                  </button>
                </div>
              </div>
            )}

            <div className="mb-6 flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Featured Products</h3>
                <p className="text-xs text-slate-500">6 Items currently aggregated</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
              >
                <ShoppingCart size={22} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {PRODUCTS.map((prod) => (

<div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group">
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    <img 
                      src={prod.image} 
                      alt={prod.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {prod.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {prod.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed flex-1">
                      {prod.description}
                    </p>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Myanmar Price</span>
                        <span className="font-extrabold text-indigo-600 text-lg">
                          {prod.price.toLocaleString()} <span className="text-sm font-semibold">MMK</span>
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(prod)}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <ShoppingCart size={14} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    {activeTab === 'admin' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Order Verification Center</h2>
              <p className="text-sm text-slate-500 mt-1">Real-time incoming customer payments and shipping records</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-medium">All Orders</span>
                <span className="text-2xl font-black text-slate-900 mt-2">{orders.length}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <Clock size={12} /> Pending Verification
                </span>
                <span className="text-2xl font-black text-amber-600 mt-2">
                  {orders.filter(o => o.status === 'Pending').length}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle size={12} /> Confirmed Orders
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-2">
                  {orders.filter(o => o.status === 'Confirmed').length}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <XCircle size={12} /> Rejected Orders
                </span>
                <span className="text-2xl font-black text-rose-600 mt-2">
                  {orders.filter(o => o.status === 'Rejected').length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search name, phone, order ID..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>

                  <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {['All', 'Pending', 'Confirmed', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setAdminStatusFilter(status)}
                        className={px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                          adminStatusFilter === status
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
<div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {['All', 'Pending', 'Confirmed', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setAdminStatusFilter(status)}
                        className={px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                          adminStatusFilter === status
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Order ID & Date</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4 text-right">Total (MMK)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-400">
                            No matching orders found.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr 
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={hover:bg-slate-50/75 cursor-pointer transition ${
                              selectedOrder?.id === order.id ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : ''
                            }}
                          >
                            <td className="py-4 px-4">
                              <span className="font-mono text-[10px] text-slate-400 block max-w-[80px] truncate">
                                #{order.id}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-900">
                              <div>{order.customerName}</div>
                              <div className="text-[10px] font-normal text-slate-400">{order.customerPhone}</div>
                            </td>
                            <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                              {order.totalPrice.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                order.status === 'Confirmed' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : order.status === 'Rejected' 
                                  ? 'bg-rose-100 text-rose-800'

: 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <ChevronRight size={16} className="text-slate-400 inline" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
<div className="lg:col-span-5">
                {selectedOrder ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                    
                    <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Reviewing Order</span>
                        <span className="font-mono text-xs">{selectedOrder.id}</span>
                      </div>
                      <span className={px-3 py-1 rounded-full text-xs font-bold ${
                        selectedOrder.status === 'Confirmed' 
                          ? 'bg-emerald-500 text-white' 
                          : selectedOrder.status === 'Rejected' 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-amber-500 text-white'
                      }}>
                        {selectedOrder.status}
                      </span>
                    </div>

                    <div className="p-5 space-y-6">
                      
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <MapPin size={13} /> Shipping Info
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2 border border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Name:</span>
                            <span className="font-bold text-slate-900">{selectedOrder.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Phone:</span>
                            <span className="font-bold text-slate-900">{selectedOrder.customerPhone}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">Address:</span>
                            <span className="font-semibold text-slate-900 leading-relaxed block bg-white border border-slate-100 rounded-lg p-2 mt-1">
                              {selectedOrder.shippingAddress}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <Package size={13} /> Sourced Items
                        </h4>
                        <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-250 rounded-xl">
                          {selectedOrder.items.map((item, index) => (
                            <div key={index} className="p-3 text-xs flex justify-between items-center bg-white">
                              <div className="max-w-[70%]">
                                <span className="font-semibold text-slate-900 block truncate">{item.title}</span>
                                <span className="text-[10px] text-slate-500">{item.price.toLocaleString()} MMK x {item.quantity}</span>
                              </div>
                              <span className="font-bold text-slate-900">
                                {(item.price * item.quantity).toLocaleString()} MMK
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-between items-center px-2 py-1">
{selectedOrder.status === 'Pending' && (
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Confirmed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                          >
                            <CheckCircle size={15} />
                            Confirm Order
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Rejected')}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <XCircle size={15} />
                            Reject Order
                          </button>
                        </div>
                      )}

                      {selectedOrder.status !== 'Pending' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-center gap-2">
                          {selectedOrder.status === 'Confirmed' ? (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle size={14} /> Order Verified & Confirmed
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                              <XCircle size={14} /> Order Rejected
                            </span>
                          )}
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Pending')}
                            className="text-[10px] font-bold text-indigo-600 hover:underline ml-auto"
                          >
                            Reset to Pending
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500">
                    <AlertCircle size={32} className="mx-auto mb-3 text-slate-400" />
                    <p className="font-semibold text-sm">No Order Selected</p>
                    <p className="text-xs text-slate-400 mt-1">Select an incoming order from the left list table to verify details, products and checkout screenshot.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
</main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white flex flex-col shadow-2xl">
              
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="text-indigo-600" /> Shopping Cart
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-3">
                    <ShoppingBag size={48} className="mx-auto text-slate-300" />
                    <p className="font-bold text-sm">Your cart is empty</p>
                    <p className="text-xs">Browse our catalog and add items you like!</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4 p-3 border border-slate-150 rounded-xl bg-slate-50/50">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 text-xs block truncate">{item.product.title}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{item.product.price.toLocaleString()} MMK</span>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md py-0.5 px-2">
                            <button onClick={() => updateCartQty(item.product.id, -1)} className="text-slate-600 text-xs font-black">-</button>
                            <span className="text-xs font-bold text-slate-900 px-1">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.product.id, 1)} className="text-slate-600 text-xs font-black">+</button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Cart Total</span>
                    <span className="text-xl font-black text-indigo-600">{getCartTotal().toLocaleString()} MMK</span>
                  </div>
                  <button
                    onClick={() => setIsCheckoutOpen(true)}

className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-md shadow-indigo-200 text-sm"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />
          
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-10 flex flex-col animate-scale-in">
            
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Checkout & Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Please transfer money manually and upload receipt</p>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-6 space-y-6 flex-1">
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={13} /> 1. Shipping Details
                </h4>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 09xxxxxxxx"
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Delivery Region / State</label>
                    <input
                      type="text"
                      required
                      placeholder="Yangon, Mandalay, etc."
                      className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Shipping Address</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Street Name, Ward, Township"
                    value={shippingAddress}

onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={13} /> 2. Manual Wallet Payment Transfer
                </h4>

                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 space-y-3">
                  <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                    Please transfer the exact total bill to one of our mobile wallet numbers listed below. Save and upload a screenshot proof of transaction.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-black text-blue-600">KBZPay (KPay)</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-[10px] text-slate-400">Account Name</div>
                        <div className="text-xs font-bold text-slate-800">U Kyaw Kyaw Store</div>
                      </div>
                      <div className="mt-1 flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="font-mono text-xs font-bold text-slate-900">09123456789</span>
                        <button 
                          type="button" 
                          onClick={() => copyToClipboard('09123456789')}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                        >
                          <Clipboard size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-black text-amber-500">WaveMoney</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-[10px] text-slate-400">Account Name</div>
                        <div className="text-xs font-bold text-slate-800">U Kyaw Kyaw Store</div>
                      </div>
                      <div className="mt-1 flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="font-mono text-xs font-bold text-slate-900">09987654321</span>
                        <button 
                          type="button" 
                          onClick={() => copyToClipboard('09987654321')}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                        >
                          <Clipboard size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload size={13} /> 3. Upload Payment Receipt Screenshot
                </h4>

                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition relative">

{paymentReceipt ? (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <img 
                          src={paymentReceipt} 
                          alt="Uploaded receipt proof" 
                          className="max-h-40 rounded-lg shadow-sm object-contain" 
                        />
                      </div>
                      <p className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                        <Check size={14} /> Screenshot Uploaded Successfully
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setPaymentReceipt(null)}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Change screenshot
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-600">Select transaction receipt image</p>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG formats supported</p>
                      <input 
                        type="file" 
                        required
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-500">Order Bill Total:</span>
                  <span className="text-lg font-black text-indigo-600">{getCartTotal().toLocaleString()} MMK</span>
                </div>

                {formError && (
                  <div className="text-xs font-bold text-rose-600 flex items-center gap-1 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                    <AlertCircle size={14} /> {formError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Submitting...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      <footer className="bg-slate-950 text-slate-400 py-6 border-t border-slate-800 mt-16 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 MegaStore Myanmar. Sourced aggregated storefront system demo.</p>
          {user && (
            <p className="text-[10px] text-slate-500 font-mono">
              Signed in User ID: <span className="text-slate-300 select-all">{user.uid}</span>
            </p>
          )}
        </div>
      </footer>

    </div>
  );
                      }
