"use client"; // 添加这一行以标记为客户端组件
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [walletAddresses, setWalletAddresses] = useState('');
  const [pointsData, setPointsData] = useState([]);
  const [previousPointsData, setPreviousPointsData] = useState([]); // 用于存储之前的 points 数据
  const [error, setError] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(null); // 用于存储上次获取数据的时间

  const fetchPoints = async (addresses) => {
    try {
      const results = await Promise.all(addresses.map(async (address) => {
        const response = await fetch(`https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/scroll/wallet-points?walletAddress=${address}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        return { 
          address, 
          points: result[0].points // 提取 points 值
        }; 
      }));

      // 计算每日增量
      const updatedPointsData = results.map((currentData) => {
        const previousData = previousPointsData.find(data => data.address === currentData.address);
        const dailyIncrement = previousData ? currentData.points - previousData.points : 0; // 计算增量
        return { ...currentData, dailyIncrement }; // 返回包含增量的数据
      });

      setPointsData(updatedPointsData);
      setPreviousPointsData(results); // 更新之前的 points 数据
      setLastFetchTime(Date.now()); // 更新最后获取时间
      setError(''); // 清除错误信息
    } catch (err) {
      setError('Failed to fetch data. Please check the wallet addresses.');
      setPointsData([]); // 清空之前的数据
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const addresses = walletAddresses.split('\n').map(addr => addr.trim()).filter(addr => addr); // 过滤空地址
    if (addresses.length > 0) {
      const now = Date.now();
      // 检查是否超过 24 小时（86400000 毫秒）
      if (!lastFetchTime || (now - lastFetchTime) > 86400000) {
        fetchPoints(addresses);
      } else {
        setError('Data can only be fetched once every 24 hours.');
      }
    } else {
      setError('Please enter at least one wallet address.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-10 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-6">Scroll Wallet Dashboard</h1>
      <div className="flex space-x-4 mb-6">
        {/* 以太坊 Logo */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-10 h-10">
          <path fill="#3C3C3D" d="M16 0l-16 16 16 16 16-16-16-16zm0 2.5l13.5 13.5-13.5 8.5-13.5-8.5L16 2.5zm0 27l-8.5-5.5 8.5-5.5 8.5 5.5-8.5 5.5z"/>
        </svg>
      </div>
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={walletAddresses}
          onChange={(e) => setWalletAddresses(e.target.value)}
          placeholder="Enter wallet addresses, one per line"
          className="border border-gray-700 p-3 w-80 h-40 resize-none bg-gray-800 text-white placeholder-gray-400"
          style={{ whiteSpace: 'pre-wrap' }} // 确保换行可见
        />
        <button type="submit" className="ml-2 p-3 bg-blue-600 hover:bg-blue-500 transition duration-200 rounded shadow-lg">Fetch Points</button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>} {/* 显示错误信息 */}
      <div className="mt-6 space-y-4">
        {pointsData.length > 0 ? (
          pointsData.map(({ address, points, dailyIncrement }) => (
            <div key={address} className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-2xl">Wallet Address: {address}</h2>
              <p>Current Points: <span className="font-bold">{points} Marks</span></p>
              <p>Daily Increment: <span className="font-bold">{dailyIncrement} Marks</span></p> {/* 显示每日增量 */}
            </div>
          ))
        ) : (
          <p>No data available. Please enter wallet addresses.</p>
        )}
      </div>
    </main>
  );
}
