import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { refineProductImage } from './services/geminiService';
import { BatchItem, AspectRatio } from './types';

const App: React.FC = () => {
  const [queue, setQueue] = useState<BatchItem[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImagesSelect = (base64s: string[]) => {
    const newItems: BatchItem[] = base64s.map(img => ({
      id: crypto.randomUUID(),
      original: img,
      generated: null,
      status: 'idle'
    }));
    setQueue(prev => [...prev, ...newItems]);
  };

  const handleDeleteItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const processQueue = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // We copy the queue initially to avoid closure staleness, 
    // but we need to update state as we go.
    // A simple approach: iterate through indices.
    
    // Helper to process one item
    const processItem = async (item: BatchItem) => {
      try {
        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing', error: undefined } : i));
        
        const result = await refineProductImage(item.original, customPrompt, aspectRatio);
        
        setQueue(prev => prev.map(i => i.id === item.id ? { 
          ...i, 
          status: 'success', 
          generated: result 
        } : i));
      } catch (error: any) {
        setQueue(prev => prev.map(i => i.id === item.id ? { 
          ...i, 
          status: 'error', 
          errorMessage: error.message || "Failed" 
        } : i));
      }
    };

    // Find all idle items
    // Note: We get the list from state setter to ensure freshness if we were doing this reactively,
    // but here we just grab the current queue snapshot for the loop logic.
    const itemsToProcess = queue.filter(item => item.status === 'idle' || item.status === 'error');
    
    // Process sequentially to be gentle on rate limits (or could do Promise.all with concurrency limit)
    for (const item of itemsToProcess) {
      await processItem(item);
    }

    setIsProcessing(false);
  };

  const handleDownload = (item: BatchItem) => {
    if (item.generated) {
      const link = document.createElement('a');
      link.href = item.generated;
      link.download = `product-${item.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const pendingCount = queue.filter(i => i.status === 'idle').length;
  const processingCount = queue.filter(i => i.status === 'processing').length;
  const completedCount = queue.filter(i => i.status === 'success').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.061-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                    </svg>
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">ProductPolish AI</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
               {queue.length > 0 && (
                 <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                    {completedCount} 完成 / {queue.length} 总计
                 </span>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Sidebar: Controls */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4">批量精修设置</h2>
                
                <div className="space-y-5">
                  <ImageUploader 
                    onImagesSelected={handleImagesSelect}
                    disabled={isProcessing}
                    compact={true}
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">输出比例</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(AspectRatio).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          disabled={isProcessing}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            aspectRatio === ratio 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">精修指令</label>
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      rows={3}
                      placeholder="统一指令：例如‘纯白背景’..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="pt-2">
                    <Button 
                      onClick={processQueue} 
                      disabled={isProcessing || pendingCount === 0}
                      isLoading={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? `正在处理 (${processingCount})` : `开始批量处理 (${pendingCount})`}
                    </Button>
                    
                    {queue.length > 0 && !isProcessing && (
                      <button 
                        onClick={() => setQueue([])}
                        className="w-full mt-3 text-sm text-gray-500 hover:text-red-500 transition-colors"
                      >
                        清空列表
                      </button>
                    )}
                  </div>
                </div>
             </div>
          </div>

          {/* Right Content: Gallery Grid */}
          <div className="flex-1 min-w-0">
             {queue.length === 0 ? (
               <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center h-[500px]">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">等待上传</h3>
                  <p className="text-gray-500 max-w-md">请在左侧上传您的产品图片，支持批量拖拽。AI 将自动为您生成精美的电商主图。</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {queue.map((item) => (
                   <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                      <div className="relative aspect-square bg-gray-100 group">
                        {/* Image Display */}
                        <img 
                          src={item.generated || item.original} 
                          alt="Product" 
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Hover Overlay to See Original */}
                        {item.generated && (
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Hold to compare</span>
                          </div>
                        )}

                        {/* Processing Overlay */}
                        {item.status === 'processing' && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col">
                             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                             <span className="text-xs font-semibold text-blue-600">AI 精修中...</span>
                          </div>
                        )}

                        {/* Error Overlay */}
                        {item.status === 'error' && (
                          <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center flex-col p-4 text-center">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-500 mb-2">
                               <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                             </svg>
                             <p className="text-xs text-red-600 font-medium">{item.errorMessage || "处理失败"}</p>
                          </div>
                        )}
                        
                        {/* Remove Button */}
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={item.status === 'processing'}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>

                        {/* Tag */}
                        <div className="absolute bottom-2 left-2">
                           {item.status === 'success' && (
                             <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md border border-green-200 font-medium shadow-sm">
                               精修完成
                             </span>
                           )}
                           {item.status === 'idle' && (
                             <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                               等待处理
                             </span>
                           )}
                        </div>
                      </div>
                      
                      {/* Card Footer */}
                      <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center h-14">
                         {item.status === 'success' ? (
                           <button 
                            onClick={() => handleDownload(item)}
                            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              下载图片
                           </button>
                         ) : (
                           <span className="text-xs text-gray-400 w-full text-center">
                             {item.status === 'processing' ? 'Processing...' : 'Ready to start'}
                           </span>
                         )}
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;